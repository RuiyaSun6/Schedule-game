import { useEffect, useRef, useState } from 'react';
import './PetBird.css';

// The pet bird: an animated budgie on a cage stand (16x32 GIF, 10 frames), bought once under Pets.
// It lives in the bedroom like the cat's pet corner: shown at 3x (whole-number scale, about as tall as the cat tree), movable with
// MOVE OBJECTS, position saved with the room layout.
export const PET_BIRD_ID = 'pet-bird';
export const PET_BIRD_ART = { src: `${import.meta.env.BASE_URL}assets/interior%20full/pets/budgie/budgie_blue.gif`, width: 16, height: 32 };
const SCALE = 3;

/** moveMode: MOVE OBJECTS is on, so a press drags the bird instead of making it sing. */
export default function PetBird({ moveMode }: { moveMode: boolean }) {
  const [singing, setSinging] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function sing() {
    if (moveMode) return;
    // A new key restarts the hop and the note even on quick repeated taps.
    setSinging((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSinging(0), 1100);
  }

  return <button type="button" className="pet-bird" onClick={sing} aria-label={moveMode ? 'Drag the bird' : 'Your pet bird. Tap to hear it sing'}>
    {singing > 0 && <span key={`note-${singing}`} className="pet-bird-note" aria-hidden="true">♪</span>}
    <img key={`bird-${singing}`} className={`pet-sprite pet-bird-sprite${singing > 0 ? ' is-hopping' : ''}`} src={PET_BIRD_ART.src}
      width={PET_BIRD_ART.width * SCALE} height={PET_BIRD_ART.height * SCALE} alt="" draggable={false} />
  </button>;
}
