import type { CSSProperties } from 'react';
import type { FieldGrid } from './farmGrid';

// The farm field: farm-background.png at a whole-number scale, centred. The surrounding area uses
// the grass colour, which matches the image's plain grass tiles, so the field looks endless.
export const FIELD_GRASS = '#a5c543';

export default function FarmFieldBackground({ grid }: { grid: FieldGrid | null }) {
  const style: CSSProperties = grid ? {
    backgroundImage: `url(${grid.field.src})`,
    backgroundSize: `${grid.field.cols * grid.cell}px ${grid.field.rows * grid.cell}px`,
    backgroundPosition: `${grid.originX}px ${grid.originY}px`,
  } : {};
  return <div className="farm-field" style={style} aria-hidden="true" />;
}
