import { createContext, useContext } from 'react';
import type { Player } from '../types';
import { mockPlayer } from './mockPlayer';

export const PlayerContext = createContext<Player>(mockPlayer);
export function usePlayer() { return useContext(PlayerContext); }

interface PlayerActions {
  updatePlayer: (player: Player) => void;
  beginMutation: () => boolean;
  endMutation: () => void;
}
export const PlayerActionsContext = createContext<PlayerActions | null>(null);
export function usePlayerActions() {
  const actions = useContext(PlayerActionsContext);
  if (!actions) throw new Error('Player actions provider is missing');
  return actions;
}
