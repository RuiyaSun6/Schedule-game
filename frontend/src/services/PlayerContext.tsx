import { createContext, useContext } from 'react';
import type { Player } from '../types';

export const PlayerContext = createContext<Player | null>(null);
export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('Player provider is missing');
  return player;
}

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
