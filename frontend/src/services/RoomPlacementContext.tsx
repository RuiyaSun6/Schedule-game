import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePlayer } from './PlayerContext';
import type { WorldObjectPosition } from '../components/MoveModeScene';
import type { LocationId, PlacedFurniture } from '../types/building';
import { ownedCount } from '../data/shopAssets';

// Where furniture is, per player (localStorage; the backend only knows ownership).
// - positions: saved drag positions of fixed bedroom objects (starter furniture, home slots, pet corner).
// - placed: owned items placed by the player into a location (home or a building). Regular items
//   have at most one placement; stackable items (farm) one per owned copy (player.itemCounts).
// - stored: regular items the player put away; they wait in the Backpack.
// Ownership stays global: copies placed anywhere count against what the player owns.
type Positions = Record<string, WorldObjectPosition>;
// - wallpaper: the wallpaper item equipped on the bedroom wall (null = plain wall). One at a time.
interface FurnitureLayout { positions: Positions; placed: PlacedFurniture[]; stored: string[]; wallpaper: string | null; }

function readLayout(key: string): FurnitureLayout {
  const layout: FurnitureLayout = { positions: {}, placed: [], stored: [], wallpaper: null };
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!raw || typeof raw !== 'object') return layout;
    if (raw.positions && typeof raw.positions === 'object') {
      for (const [id, value] of Object.entries(raw.positions)) {
        const p = value as WorldObjectPosition;
        if (p && p.objectId === id && Number.isFinite(p.x) && Number.isFinite(p.y)) layout.positions[id] = p;
      }
    }
    if (Array.isArray(raw.placed)) {
      const seen = new Set<string>();
      layout.placed = raw.placed.filter((p: PlacedFurniture) => {
        const ok = p && typeof p.instanceId === 'string' && typeof p.itemId === 'string' && typeof p.locationId === 'string'
          && Number.isFinite(p.x) && Number.isFinite(p.y) && !seen.has(p.instanceId)
          && (p.cell === undefined || (Number.isInteger(p.cell.col) && Number.isInteger(p.cell.row)));
        if (ok) seen.add(p.instanceId);
        return ok;
      });
    }
    if (Array.isArray(raw.stored)) layout.stored = raw.stored.filter((id: unknown) => typeof id === 'string');
    if (typeof raw.wallpaper === 'string') layout.wallpaper = raw.wallpaper;
  } catch { /* Start with an empty layout. */ }
  return layout;
}

interface PlaceOptions {
  /** Stackable items add another copy instead of moving the existing one. */
  stackable?: boolean;
  /** Field tile for crops. */
  cell?: { col: number; row: number };
}
interface RoomPlacementState extends FurnitureLayout {
  setPosition: (position: WorldObjectPosition) => void;
  /** Places an item; returns false when no unplaced copy is left. */
  placeItem: (itemId: string, locationId: LocationId, x: number, y: number, options?: PlaceOptions) => boolean;
  moveItem: (instanceId: string, x: number, y: number, cell?: { col: number; row: number }) => void;
  /** Puts a regular item back in the Backpack, wherever it was (a location or a home slot). */
  storeItem: (itemId: string) => void;
  /** Puts one placed copy back in the Backpack (used by MOVE OBJECTS → STORE). */
  storeInstance: (instanceId: string) => void;
  /** Equips an owned wallpaper on the bedroom wall, or null for the plain wall. */
  setWallpaper: (itemId: string | null) => void;
}
const RoomContext = createContext<RoomPlacementState | null>(null);

export function RoomPlacementProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  // Same key as the earlier bedroom layout, so saved starter-furniture positions carry over.
  const key = `lifequest:room:v1:${player.id}`;
  const [layout, setLayout] = useState(() => readLayout(key));
  const current = useRef(layout);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(layout)); } catch { /* Session state remains usable. */ } }, [key, layout]);
  function commit(next: FurnitureLayout) { current.current = next; setLayout(next); }

  function setPosition(position: WorldObjectPosition) {
    commit({ ...current.current, positions: { ...current.current.positions, [position.objectId]: position } });
  }
  function placeItem(itemId: string, locationId: LocationId, x: number, y: number, options: PlaceOptions = {}) {
    const owned = ownedCount(player, itemId);
    const copies = current.current.placed.filter((p) => p.itemId === itemId);
    if (owned < 1 || (options.stackable && copies.length >= owned)) return false;
    const placement: PlacedFurniture = {
      instanceId: `${itemId}-${crypto.randomUUID().slice(0, 8)}`, itemId, locationId, x: Math.round(x), y: Math.round(y),
      ...(options.cell ? { cell: options.cell } : {}),
    };
    commit({
      ...current.current,
      // A regular item moves (one placement); a stackable item gains another copy.
      placed: [...(options.stackable ? current.current.placed : current.current.placed.filter((p) => p.itemId !== itemId)), placement],
      stored: current.current.stored.filter((id) => id !== itemId),
    });
    return true;
  }
  function moveItem(instanceId: string, x: number, y: number, cell?: { col: number; row: number }) {
    commit({ ...current.current, placed: current.current.placed.map((p) => p.instanceId === instanceId
      ? { ...p, x: Math.round(x), y: Math.round(y), ...(cell ? { cell } : {}) } : p) });
  }
  function storeInstance(instanceId: string) {
    const placement = current.current.placed.find((p) => p.instanceId === instanceId);
    if (!placement) return;
    const others = current.current.placed.filter((p) => p.instanceId !== instanceId);
    const regular = !others.some((p) => p.itemId === placement.itemId) && (player.itemCounts?.[placement.itemId] ?? 1) <= 1;
    commit({
      ...current.current,
      placed: others,
      // Regular items are marked stored so they don't reappear in a home slot; extra copies just become available.
      stored: regular && !current.current.stored.includes(placement.itemId) ? [...current.current.stored, placement.itemId] : current.current.stored,
    });
  }
  function storeItem(itemId: string) {
    commit({
      ...current.current,
      placed: current.current.placed.filter((p) => p.itemId !== itemId),
      stored: current.current.stored.includes(itemId) ? current.current.stored : [...current.current.stored, itemId],
    });
  }
  function setWallpaper(itemId: string | null) {
    if (itemId !== null && !player.ownedItems?.includes(itemId)) return;
    commit({ ...current.current, wallpaper: itemId });
  }
  return <RoomContext.Provider value={{ ...layout, setPosition, placeItem, moveItem, storeItem, storeInstance, setWallpaper }}>{children}</RoomContext.Provider>;
}

export function useRoomPlacement() {
  const room = useContext(RoomContext);
  if (!room) throw new Error('Room placement provider is missing');
  return room;
}
