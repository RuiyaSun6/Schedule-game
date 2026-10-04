import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PlayerContext, usePlayer, usePlayerActions } from '../services/PlayerContext';
import { BUILDINGS, SHOP_BUILDINGS, getBuilding, nextBuildingUpgrade } from '../data/buildingCatalog';
import type { BuildingId, BuildingStatus, PlacedBuilding } from '../types/building';

// Building ownership and placement, frontend-only (localStorage per player).
// The backend has no building endpoints, so purchases and upgrades are recorded here as a coin
// "spend" that is subtracted from the backend balance everywhere the player is read.
// To move to the backend later: replace load/save and buy() with API calls; the shape stays.
interface BuildingSave {
  owned: BuildingId[];
  placed: PlacedBuilding[];
  /** Coins spent on buildings and upgrades; subtracted from the backend coin balance. */
  spent: number;
  levels: Partial<Record<BuildingId, number>>;
}

const emptySave = (): BuildingSave => ({ owned: [], placed: [], spent: 0, levels: {} });
const isBuildingId = (id: unknown): id is BuildingId => typeof id === 'string' && SHOP_BUILDINGS.some((b) => b.id === id);

function readSave(key: string): BuildingSave {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!raw || typeof raw !== 'object') return emptySave();
    const owned = Array.isArray(raw.owned) ? [...new Set(raw.owned.filter(isBuildingId))] as BuildingId[] : [];
    const placed = Array.isArray(raw.placed) ? raw.placed.filter((p: PlacedBuilding) =>
      p && typeof p.instanceId === 'string' && owned.includes(p.buildingId) && Number.isFinite(p.x) && Number.isFinite(p.y)) : [];
    const spent = Number.isFinite(raw.spent) && raw.spent > 0 ? raw.spent : 0;
    const levels: BuildingSave['levels'] = {};
    for (const building of BUILDINGS) {
      const level = raw.levels?.[building.id];
      if ((building.id === 'home' || owned.includes(building.id)) && (level === 1 || building.upgrades.some((upgrade) => upgrade.level === level))) levels[building.id] = level;
    }
    return { owned, placed, spent, levels };
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
  level: (id: BuildingId) => number;
  upgrade: (id: BuildingId, expectedLevel: number) => void;
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

  // Everything below this provider sees the same Coins after building purchases/upgrades.
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
    const available = Math.max(0, backendPlayer.coins - current.current.spent);
    if (available < building.price) throw new Error(`You need ${building.price - available} more coins.`);
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

  function level(id: BuildingId) { return current.current.levels[id] ?? 1; }
  function upgrade(id: BuildingId, expectedLevel: number) {
    if (id !== 'home' && !current.current.owned.includes(id)) throw new Error('Buy this building first.');
    if (level(id) !== expectedLevel) throw new Error('This building level has changed. Open its upgrade menu again.');
    const next = nextBuildingUpgrade(id, level(id));
    if (!next) throw new Error('This building is at MAX LEVEL.');
    // Use the current ledger, even if two clicks arrive before React renders again.
    const available = Math.max(0, backendPlayer.coins - current.current.spent);
    if (available < next.price) throw new Error(`You need ${next.price - available} more coins.`);
    if (!actions.beginMutation()) throw new Error('Another update is in progress. Please wait.');
    try {
      commit({ ...current.current, spent: current.current.spent + next.price, levels: { ...current.current.levels, [id]: next.level } });
    } finally { actions.endMutation(); }
  }

  return <WorldBuildingsContext.Provider value={{ ...save, status, buy, place, move, store, level, upgrade }}>
    <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
  </WorldBuildingsContext.Provider>;
}

export function useWorldBuildings() {
  const buildings = useContext(WorldBuildingsContext);
  if (!buildings) throw new Error('World buildings provider is missing');
  return buildings;
}
