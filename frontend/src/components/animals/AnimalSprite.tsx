import type { CSSProperties } from 'react';
import type { AnimalAction, AnimalSpec } from '../../data/animals';
import './FarmAnimals.css';

/** background-position of one frame of the sheet at a whole-number scale. */
export function framePosition(spec: AnimalSpec, row: number, frame: number, scale: number) {
  return `${-frame * spec.frameWidth * scale}px ${-row * spec.frameHeight * scale}px`;
}

/** Inline style for a sprite box showing one frame (the sheet is sliced, never stretched). */
export function spriteStyle(spec: AnimalSpec, scale: number, variant = 0, action: AnimalAction = 'walk', frame = 0): CSSProperties {
  return {
    width: spec.frameWidth * scale,
    height: spec.frameHeight * scale,
    backgroundImage: `url(${spec.sheets[variant % spec.sheets.length]})`,
    backgroundSize: `${spec.sheetWidth * scale}px ${spec.sheetHeight * scale}px`,
    backgroundPosition: framePosition(spec, spec.rows[action], frame, scale),
  };
}

/** A still frame: the shop thumbnail uses the first (standing) frame. */
export default function AnimalSprite({ spec, scale = 3, variant = 0, label }: { spec: AnimalSpec; scale?: number; variant?: number; label: string }) {
  return <span className="animal-sprite" role="img" aria-label={label} style={spriteStyle(spec, scale, variant)} />;
}
