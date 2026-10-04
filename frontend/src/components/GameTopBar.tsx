import PlayerAvatar from './PlayerAvatar';
import XPBar from './XPBar';
import CoinDisplay from './CoinDisplay';
import { useAuthUser, usePlayer } from '../services/PlayerContext';

interface GameTopBarProps {
  player?: { level: number; xp: number; coins: number };
}

export default function GameTopBar({ player: suppliedPlayer }: GameTopBarProps) {
  const sharedPlayer = usePlayer();
  const { username } = useAuthUser();
  const player = suppliedPlayer ?? sharedPlayer;
  return (
    <section className="game-top-bar pixel-panel" aria-label="Player profile">
      <PlayerAvatar />
      <div className="profile-details">
        <div className="profile-name"><strong title={username}>{username}</strong><span>Lv. {player.level}</span></div>
        <div className="profile-id">ID: {sharedPlayer.id}</div>
        <XPBar xp={player.xp} level={player.level} />
        <CoinDisplay coins={player.coins} />
      </div>
    </section>
  );
}
