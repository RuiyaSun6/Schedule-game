import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useDemoShop } from './DemoShopContext';
import { usePlayer } from './PlayerContext';
import type { WorldObjectPosition } from '../components/MoveModeScene';
export interface PlacedRoomItem { instanceId: string; variantId: string; }
interface RoomLayout { placedRoomItems: PlacedRoomItem[]; positions: Record<string, WorldObjectPosition>; }
const emptyLayout = (): RoomLayout => ({ placedRoomItems: [], positions: {} });
function readLayout(key: string): RoomLayout {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!raw || !raw.positions || typeof raw.positions !== 'object') return emptyLayout();
    const positions: RoomLayout['positions'] = {};
    for (const [id, value] of Object.entries(raw.positions)) {
      const p = value as WorldObjectPosition;
      if (p && p.objectId === id && Number.isFinite(p.x) && Number.isFinite(p.y)) positions[id] = p;
    }
    const items: PlacedRoomItem[] = Array.isArray(raw.placedRoomItems) ? raw.placedRoomItems : Array.isArray(raw.placedItemIds) ? raw.placedItemIds.filter((id: unknown) => typeof id === 'string').map((id: string) => ({ instanceId: `home-${id}`, variantId: id })) : [];
    const seen = new Set<string>();
    return { placedRoomItems: items.filter((item) => {
      if (!item || typeof item.instanceId !== 'string' || typeof item.variantId !== 'string' || seen.has(item.instanceId)) return false;
      seen.add(item.instanceId); return true;
    }), positions };
  } catch { return emptyLayout(); }
}
interface RoomPlacementState extends RoomLayout {
  ownedQuantity: (id: string) => number;
  availableQuantity: (id: string) => number;
  placeItem: (id: string) => void;
  storeItem: (instanceId: string) => void;
  setPosition: (position: WorldObjectPosition) => void;
}
const RoomContext = createContext<RoomPlacementState | null>(null);
export function RoomPlacementProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  const demo = useDemoShop();
  const key = `lifequest:room:v1:${player.id}`;
  const [layout, setLayout] = useState(() => readLayout(key));
  const current = useRef(layout);
  function commit(next: RoomLayout) { current.current = next; setLayout(next); }
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(layout)); } catch { /* Session state remains usable. */ } }, [key, layout]);
  function ownedQuantity(id: string) { return (player.ownedItems?.includes(id) ? 1 : 0) + (demo.quantities[id] ?? 0); }
  function availableQuantity(id: string) { return Math.max(0, ownedQuantity(id) - current.current.placedRoomItems.filter((item) => item.variantId === id).length); }
  function placeItem(id: string) {
    if (availableQuantity(id) < 1) return;
    commit({ ...current.current, placedRoomItems: [...current.current.placedRoomItems, { instanceId: `room-${crypto.randomUUID()}`, variantId: id }] });
  }
  function storeItem(instanceId: string) {
    const positions = { ...current.current.positions };
    delete positions[instanceId];
    commit({ placedRoomItems: current.current.placedRoomItems.filter((item) => item.instanceId !== instanceId), positions });
  }
  function setPosition(position: WorldObjectPosition) {
    commit({ ...current.current, positions: { ...current.current.positions, [position.objectId]: position } });
  }
  return <RoomContext.Provider value={{ ...layout, ownedQuantity, availableQuantity, placeItem, storeItem, setPosition }}>{children}</RoomContext.Provider>;
}
export function useRoomPlacement() {
  const room = useContext(RoomContext);
  if (!room) throw new Error('Room placement provider is missing');
  return room;
}
