// One-off: crop pet furniture sprites out of the Furnitures.png sheet.
// Usage (from frontend/): node scripts/crop-pet-sprites.mjs [path/to/Furnitures.png]
// Writes pet-*.png next to the source sheet and keeps the sheet itself.
// For each crop it also checks the 1px ring just outside the box: opaque pixels there mean
// the sprite was cut off or a neighbouring object touches the box.
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const source = resolve(process.argv[2] ?? 'src/assets/characters/Furnitures.png');
const CROPS = {
  'pet-bed.png': { left: 202, top: 137, width: 110, height: 82 },
  'pet-tree.png': { left: 191, top: 16, width: 64, height: 110 },
  'pet-scratcher.png': { left: 197, top: 331, width: 55, height: 77 },
  'pet-bowl.png': { left: 266, top: 335, width: 43, height: 37 },
};

const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alpha = (x, y) => (x < 0 || y < 0 || x >= info.width || y >= info.height ? 0 : data[(y * info.width + x) * 4 + 3]);

let ok = true;
for (const [file, box] of Object.entries(CROPS)) {
  const right = box.left + box.width - 1;
  const bottom = box.top + box.height - 1;
  const ring = [];
  for (let x = box.left - 1; x <= right + 1; x++) ring.push([x, box.top - 1], [x, bottom + 1]);
  for (let y = box.top; y <= bottom; y++) ring.push([box.left - 1, y], [right + 1, y]);
  const leaks = ring.filter(([x, y]) => alpha(x, y) > 0).length;

  // Tight bounds of opaque pixels inside the box, to report the padding on each side.
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  for (let y = box.top; y <= bottom; y++) for (let x = box.left; x <= right; x++) {
    if (alpha(x, y) > 0) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  const padding = `padding L${minX - box.left} T${minY - box.top} R${right - maxX} B${bottom - maxY}`;

  await sharp(source).extract(box).png().toFile(join(dirname(source), file));
  console.log(`${leaks === 0 ? '✓' : '✗'} ${file} ${box.width}x${box.height}, ${padding}, opaque pixels outside box: ${leaks}`);
  if (leaks > 0) ok = false;
}
if (!ok) process.exitCode = 1;
