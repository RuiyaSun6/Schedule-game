import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePlayer } from './PlayerContext';
import type { WorldObjectPosition } from '../components/MoveModeScene';

// Saved positions for the bedroom's movable objects: starter furniture, item slots, and the pet corner.
// Bought items appear in their slot automatically; dragging only overrides where that slot sits.
type Positions = Record<string, WorldObjectPosition>;

function readPositions(key: string): Positions {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    const positions: Positions = {};
    if (!raw || !raw.positions || typeof raw.positions !== 'object') return positions;
    for (const [id, value] of Object.entries(raw.positions)) {
      const p = value as WorldObjectPosition;
      if (p && p.objectId === id && Number.isFinite(p.x) && Number.isFinite(p.y)) positions[id] = p;
    }
    return positions;
  } catch { return {}; }
}

interface RoomPlacementState {
  positions: Positions;
  setPosition: (position: WorldObjectPosition) => void;
}
const RoomContext = createContext<RoomPlacementState | null>(null);

export function RoomPlacementProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  // Same key as the earlier backpack layout, so saved starter-furniture positions carry over.
  const key = `lifequest:room:v1:${player.id}`;
  const [positions, setPositions] = useState(() => readPositions(key));
  const current = useRef(positions);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify({ positions })); } catch { /* Session state remains usable. */ } }, [key, positions]);
  function setPosition(position: WorldObjectPosition) {
    current.current = { ...current.current, [position.objectId]: position };
    setPositions(current.current);
  }
  return <RoomContext.Provider value={{ positions, setPosition }}>{children}</RoomContext.Provider>;
}

export function useRoomPlacement() {
  const room = useContext(RoomContext);
  if (!room) throw new Error('Room placement provider is missing');
  return room;
}
