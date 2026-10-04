import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AreaId } from '../types/world';
import { usePlayer, usePlayerActions } from './PlayerContext';
import { worldAreas } from './worldAreas';

interface AreaState {
  builtAreas: readonly AreaId[];
  demo: boolean;
  buildGarden: () => void;
}
const AreaContext = createContext<AreaState | null>(null);

// Temporary frontend-only ownership. Replace this adapter with the agreed
// backend area-purchase contract later; no invented endpoint is called.
export function AreaProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  const actions = usePlayerActions();
  const [demoBuiltAreas, setDemoBuiltAreas] = useState<AreaId[]>(['home']);
  const demo = player.builtAreas === undefined;
  const builtAreas = player.builtAreas ?? demoBuiltAreas;
  function buildGarden() {
    const garden = worldAreas.find((area) => area.id === 'garden')!;
    if (!demo) throw new Error('Backend area purchasing is not connected yet.');
    if (player.level < garden.requiredLevel) throw new Error('Garden requires Level 2.');
    if (builtAreas.includes('garden')) throw new Error('Garden is already built.');
    if (player.coins < garden.buildCost!) throw new Error('You need 50 coins to build Garden.');
    if (!actions.beginMutation()) throw new Error('Another update is in progress. Please wait.');
    try {
      actions.updatePlayer({ ...player, coins: player.coins - garden.buildCost! });
      setDemoBuiltAreas((current) => current.includes('garden') ? current : [...current, 'garden']);
    } finally { actions.endMutation(); }
  }
  return <AreaContext.Provider value={{ builtAreas, demo, buildGarden }}>{children}</AreaContext.Provider>;
}
export function useAreas() {
  const areas = useContext(AreaContext);
  if (!areas) throw new Error('Area provider is missing');
  return areas;
}
