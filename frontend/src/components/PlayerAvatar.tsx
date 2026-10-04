import { getOutfitAsset } from '../services/shop';
import { usePlayer } from '../services/PlayerContext';

export default function PlayerAvatar() {
  const player = usePlayer();
  const asset = getOutfitAsset(player.outfit ?? 'default');
  return <div className="pixel-avatar" role="img" aria-label="Player character">
    {asset && <img key={asset} className="outfit-sprite" src={asset} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
  </div>;
}
