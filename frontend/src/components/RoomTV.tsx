import { useState, type CSSProperties } from 'react';
import './RoomTV.css';

// Electronics: TVs bought once in the Shop and shown in the bedroom (32x32 GIFs, played with <img>).
// Like the pet bird they have their own movable spot (MOVE OBJECTS, saved with the room layout) and
// never go to the Backpack. Shown at 2x on phones and 3x on wider screens (RoomTV.css).
export interface TvArt { name: string; src: string; still: string; width: number; height: number }

const tvGifs = `${import.meta.env.BASE_URL}assets/interior%20full/TV%20gifs/`;
export const TV_ITEMS: Record<string, TvArt | undefined> = {
  // still: the GIF's first frame (public/assets/electronics/), shown while paused.
  'tv-cooking': { name: 'TV (cooking)', src: `${tvGifs}TV_cooking_dessert.gif`, still: `${import.meta.env.BASE_URL}assets/electronics/tv-cooking-still.png`, width: 32, height: 32 },
};
export const isElectronics = (id: string) => TV_ITEMS[id] !== undefined;

/** moveMode: MOVE OBJECTS is on, so a press drags the TV instead of switching it. */
export default function RoomTV({ itemId, moveMode }: { itemId: string; moveMode: boolean }) {
  const [paused, setPaused] = useState(false);
  const tv = TV_ITEMS[itemId];
  if (!tv) return null;
  return <button type="button" className={`room-tv${paused ? ' is-paused' : ''}`} aria-pressed={paused}
    aria-label={moveMode ? `Drag the ${tv.name}` : paused ? `${tv.name}, paused. Tap to play` : `${tv.name}, playing. Tap to pause`}
    onClick={() => { if (!moveMode) setPaused((value) => !value); }}>
    <img className="room-tv-screen" src={paused ? tv.still : tv.src} alt="" draggable={false}
      style={{ '--tv-w': tv.width, '--tv-h': tv.height } as CSSProperties} />
  </button>;
}
