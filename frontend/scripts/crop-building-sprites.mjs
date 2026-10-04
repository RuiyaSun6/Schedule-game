// One-off: crop building exteriors that exist in the asset packs into public/assets/buildings/.
// Usage (from frontend/): node scripts/crop-building-sprites.mjs
// Only the Farm has real art (the red-roof farmhouse in Tiny Wonder Farm). Café, Restaurant, and
// Library use the SVG placeholders in public/assets/buildings/placeholders/ until real art exists.
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const FARM_SHEET = 'public/assets/Tiny Wonder Farm Free/objects&items/farm objects free.png';
// The farmhouse starts at row 96 (its roof peak); row 95 is the bottom of the stone/bush above it,
// which touches the peak diagonally. Search columns 0-100 only (doors start at x=102).
const SEARCH = { left: 0, top: 96, right: 100, bottom: 191 };

const { data, info } = await sharp(FARM_SHEET).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
for (let y = SEARCH.top; y < Math.min(SEARCH.bottom, info.height); y++) {
  for (let x = SEARCH.left; x < SEARCH.right; x++) {
    if (!data[(y * info.width + x) * 4 + 3]) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
}
const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
mkdirSync('public/assets/buildings', { recursive: true });
await sharp(FARM_SHEET).extract(box).png().toFile('public/assets/buildings/farm.png');
console.log(`farm.png <- ${FARM_SHEET} (${box.left}, ${box.top}, ${box.width}, ${box.height})`);
