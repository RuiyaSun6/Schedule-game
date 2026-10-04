// Animated farm animals. Each one is a shop item (stackable, with a per-player limit) drawn from a
// single sprite sheet: a grid of equal frames, one action per row, played left to right.
// Sheets are used whole and sliced with background-position (no per-frame files).

/** Rows of the sheet. stand is not a row: it holds frame 0 of the walk row. */
export type AnimalAction = 'walk' | 'peck' | 'sit' | 'run';

export interface AnimalSpec {
  name: string;
  /** Colour variants with the same layout; animal n uses sheets[n % sheets.length]. */
  sheets: string[];
  sheetWidth: number;
  sheetHeight: number;
  /** One frame (sheet size / grid). */
  frameWidth: number;
  frameHeight: number;
  framesPerRow: number;
  rows: Record<AnimalAction, number>;
  /** The way the art faces; the other way is a horizontal flip. */
  facing: 'left' | 'right';
  /** Animation frames per second. */
  fps: number;
  /** Walking speed in art pixels per second (multiplied by the display scale). */
  speed: number;
}

// public/assets/chicken/*.png: 128x128, a 4x4 grid of 32x32 frames, all facing left.
//   row 0 walk: steps, body bobbing forward and back
//   row 1 peck: head goes down to the ground (lowest in frame 2) and back up
//   row 2 sit:  settles down until the legs are hidden (frame 3 is sitting)
//   row 3 run:  frame 0 upright, frames 1-3 leaning forward with quick steps
const CHICKEN: AnimalSpec = {
  name: 'Chicken',
  sheets: ['Chicken_Sprite_Sheet', 'Chicken_Sprite_Sheet_Light_Brown', 'Chicken_Sprite_Sheet_Black'].map((file) => `/assets/chicken/${file}.png`),
  sheetWidth: 128,
  sheetHeight: 128,
  frameWidth: 128 / 4,
  frameHeight: 128 / 4,
  framesPerRow: 4,
  rows: { walk: 0, peck: 1, sit: 2, run: 3 },
  facing: 'left',
  fps: 7,
  speed: 14,
};

/** Shop item id -> animal. */
export const ANIMALS: Record<string, AnimalSpec | undefined> = { chicken: CHICKEN };

export const isAnimal = (id: string) => ANIMALS[id] !== undefined;
