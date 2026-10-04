import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PlayerContext, usePlayer, usePlayerActions } from '../services/PlayerContext';
import { SHOP_BUILDINGS, getBuilding } from '../data/buildingCatalog';
import type { BuildingId, BuildingStatus, PlacedBuilding } from '../types/building';

// Building ownership and placement, frontend-only (localStorage per player).
// The backend has no building endpoints, so buying a building is recorded here as a coin
// "spend" that is subtracted from the backend balance everywhere the player is read.
// To move to the backend later: replace load/save and buy() with API calls; the shape stays.
interface BuildingSave {
  owned: BuildingId[];
  placed: PlacedBuilding[];
  /** Coins spent on buildings; subtracted from the backend coin balance. */
  spent: number;
}

const emptySave = (): BuildingSave => ({ owned: [], placed: [], spent: 0 });
const isBuildingId = (id: unknown): id is BuildingId => typeof id === 'string' && SHOP_BUILDINGS.some((b) => b.id === id);

function readSave(key: string): BuildingSave {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!raw || typeof raw !== 'object') return emptySave();
    const owned = Array.isArray(raw.owned) ? [...new Set(raw.owned.filter(isBuildingId))] as BuildingId[] : [];
    const placed = Array.isArray(raw.placed) ? raw.placed.filter((p: PlacedBuilding) =>
      p && typeof p.instanceId === 'string' && owned.includes(p.buildingId) && Number.isFinite(p.x) && Number.isFinite(p.y)) : [];
    const spent = Number.isFinite(raw.spent) && raw.spent > 0 ? raw.spent : 0;
    return { owned, placed, spent };
  } catch { return emptySave(); }
}

interface WorldBuildingsState extends BuildingSave {
  status: (id: BuildingId) => BuildingStatus;
  /** Checks level and coins, charges the price, and marks the building owned (stored, not placed). */
  buy: (id: BuildingId) => void;
  place: (id: BuildingId, x: number, y: number) => void;
  move: (instanceId: string, x: number, y: number) => void;
  /** Takes a placed building off the map; it stays owned (no refund). */
  store: (instanceId: string) => void;
}
const WorldBuildingsContext = createContext<WorldBuildingsState | null>(null);

export function WorldBuildingsProvider({ children }: { children: ReactNode }) {
  const backendPlayer = usePlayer();
  const actions = usePlayerActions();
  const key = `lifequest:buildings:v1:${backendPlayer.id}`;
  const [save, setSave] = useState(() => readSave(key));
  const current = useRef(save);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(save)); } catch { /* Session state stays usable. */ } }, [key, save]);
  function commit(next: BuildingSave) { current.current = next; setSave(next); }

  // Everything below this provider sees coins after building purchases.
  const coins = Math.max(0, backendPlayer.coins - save.spent);
  const player = coins === backendPlayer.coins ? backendPlayer : { ...backendPlayer, coins };

  function status(id: BuildingId): BuildingStatus {
    const building = getBuilding(id)!;
    if (current.current.placed.some((p) => p.buildingId === id)) return 'placed';
    if (current.current.owned.includes(id)) return 'stored';
    if (player.level < building.requiredLevel) return 'locked';
    return coins < building.price ? 'not-enough-coins' : 'available';
  }
  function buy(id: BuildingId) {
    const building = getBuilding(id);
    if (!building || id === 'home') throw new Error('This building is not for sale.');
    if (current.current.owned.includes(id)) throw new Error(`You already own the ${building.name}.`);
    if (player.level < building.requiredLevel) throw new Error(`${building.name} unlocks at Lv. ${building.requiredLevel}.`);
    if (coins < building.price) throw new Error(`You need ${building.price - coins} more coins.`);
    if (!actions.beginMutation()) throw new Error('Another update is in progress. Please wait.');
    try {
      commit({ ...current.current, owned: [...current.current.owned, id], spent: current.current.spent + building.price });
    } finally { actions.endMutation(); }
  }
  function place(id: BuildingId, x: number, y: number) {
    if (!current.current.owned.includes(id)) throw new Error('Buy this building first.');
    const placed = current.current.placed.filter((p) => p.buildingId !== id);
    commit({ ...current.current, placed: [...placed, { instanceId: `${id}-1`, buildingId: id, x: Math.round(x), y: Math.round(y) }] });
  }
  function move(instanceId: string, x: number, y: number) {
    commit({ ...current.current, placed: current.current.placed.map((p) => p.instanceId === instanceId ? { ...p, x: Math.round(x), y: Math.round(y) } : p) });
  }
  function store(instanceId: string) {
    commit({ ...current.current, placed: current.current.placed.filter((p) => p.instanceId !== instanceId) });
  }

  return <WorldBuildingsContext.Provider value={{ ...save, status, buy, place, move, store }}>
    <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
  </WorldBuildingsContext.Provider>;
}

export function useWorldBuildings() {
  const buildings = useContext(WorldBuildingsContext);
  if (!buildings) throw new Error('World buildings provider is missing');
  return buildings;
}
