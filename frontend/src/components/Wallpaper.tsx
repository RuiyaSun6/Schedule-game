import type { CSSProperties } from 'react';
import type { Item } from '../types';
import PixelButton from './PixelButton';
import { WALLPAPERS, wallpaperSrc } from '../data/wallpapers';
import { usePlayer } from '../services/PlayerContext';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import './Wallpaper.css';

// Wallpapers: tiles from scripts/crop-wallpapers.mjs, always repeated (never stretched) at a
// whole-number scale so the pixel art stays crisp.

/** CSS for a tiled wallpaper surface. scale: a number, or a CSS expression such as var(--room-scale). */
export function wallpaperStyle(itemId: string | null | undefined, scale: number | string = 3): CSSProperties | undefined {
  const tile = itemId ? WALLPAPERS[itemId] : undefined;
  if (!tile) return undefined;
  const size = (px: number) => typeof scale === 'number' ? `${px * scale}px` : `calc(${px}px * ${scale})`;
  return {
    backgroundImage: `url(${wallpaperSrc(tile)})`,
    backgroundRepeat: 'repeat',
    backgroundSize: `${size(tile.width)} ${size(tile.height)}`,
    // Anchor to the bottom so the pattern meets the wall trim the same way at any wall height.
    backgroundPosition: 'left bottom',
    imageRendering: 'pixelated',
  };
}

/** A tiled preview swatch for shop cards and the picker. */
export function WallpaperSwatch({ item, scale = 3 }: { item: Pick<Item, 'id' | 'name'>; scale?: number }) {
  return <span className="wallpaper-swatch" role="img" aria-label={`${item.name} wallpaper`} style={wallpaperStyle(item.id, scale)} />;
}

/** Bedroom wallpaper picker (shown in the Home Backpack): equip one owned wallpaper or the plain wall. */
export function WallpaperPicker({ items }: { items: Item[] }) {
  const player = usePlayer();
  const room = useRoomPlacement();
  const owned = items.filter((item) => WALLPAPERS[item.id] && player.ownedItems?.includes(item.id));
  return <section className="wallpaper-picker" aria-labelledby="wallpaper-picker-title">
    <h3 id="wallpaper-picker-title">WALLPAPER</h3>
    {owned.length === 0 ? <p>No wallpapers yet. Find some in the Shop under WALLPAPER.</p> : <>
      <p>Pick one for your bedroom wall. You can switch any time.</p>
      <div className="wallpaper-options">
        <article className={`wallpaper-option pixel-panel${room.wallpaper === null ? ' is-equipped' : ''}`}>
          <span className="wallpaper-swatch wallpaper-swatch-plain" aria-hidden="true" />
          <h4>Plain Wall</h4>
          <PixelButton disabled={room.wallpaper === null} onClick={() => room.setWallpaper(null)}>{room.wallpaper === null ? 'EQUIPPED' : 'EQUIP'}</PixelButton>
        </article>
        {owned.map((item) => {
          const equipped = room.wallpaper === item.id;
          return <article key={item.id} className={`wallpaper-option pixel-panel${equipped ? ' is-equipped' : ''}`}>
            <WallpaperSwatch item={item} />
            <h4>{item.name}</h4>
            <PixelButton disabled={equipped} onClick={() => room.setWallpaper(item.id)}>{equipped ? 'EQUIPPED' : 'EQUIP'}</PixelButton>
          </article>;
        })}
      </div>
    </>}
  </section>;
}
