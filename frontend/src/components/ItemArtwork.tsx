import { useState, type CSSProperties } from 'react';
import type { Item } from '../types';
import { getItemArt, isWallpaper } from '../data/shopAssets';
import { WallpaperSwatch } from './Wallpaper';
import AnimalSprite from './animals/AnimalSprite';
import { ANIMALS } from '../data/animals';

// One standalone sprite per item, scaled by a whole number so pixels stay crisp and nothing is cropped.
// fit: the largest square (px) the art may fill; the scale is the biggest integer that fits.
// fit={null}: no inline size; the scene sets it via --art-w/--art-h (see RoomSlots.css).
export default function ItemArtwork({ item, fit = 96 }: { item: Item; fit?: number | null }) {
  const [failed, setFailed] = useState(false);
  // Wallpapers preview as a tiled swatch, not a single small tile.
  if (isWallpaper(item.id)) return <WallpaperSwatch item={item} />;
  // Animals show the first (standing) frame of their sprite sheet, not the whole sheet.
  const animal = ANIMALS[item.id];
  if (animal) return <AnimalSprite spec={animal} scale={fit === null ? 2 : Math.max(1, Math.floor(fit / Math.max(animal.frameWidth, animal.frameHeight)))} label={item.name} />;
  const art = getItemArt(item.id);
  if (!art || failed) return <span className="item-art-placeholder" aria-label={`${item.name}: artwork coming soon`}>◇</span>;
  const scale = fit === null ? 1 : Math.max(1, Math.floor(Math.min(fit / art.width, fit / art.height)));
  const style = {
    '--art-w': art.width,
    '--art-h': art.height,
    ...(fit === null ? {} : { width: art.width * scale, height: art.height * scale }),
  } as CSSProperties;
  return <img className="item-art item-art-sprite" src={art.src} alt={item.name} style={style} draggable={false} onError={() => setFailed(true)} />;
}
