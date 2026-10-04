// One-off: crop Tiny Wonder Farm sprites into public/assets/farm/ and build the farm background.
// Usage (from frontend/): node scripts/split-farm-sprites.mjs [--preview items.png background.png] [--dry]
//
// The pack is drawn on a 16px grid. Each entry below names a grid region; the sprite is the tight
// bounding box of opaque pixels inside it (several objects touch, e.g. haystack, rock, and farmhouse,
// so whole-sheet connected components would merge them). Near-identical sprites are dropped.
// Plants: plants free.png has one crop per row, growth stages left to right (seed -> mature);
// the mature stage is the shop sprite, the earlier stages go to public/assets/farm/stages/.
// Output files are lower-case-with-hyphens. Source sheets are never modified.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const SRC = 'public/assets/Tiny Wonder Farm Free/objects&items/';
const OUT = 'public/assets/farm/';
const TILE = 16;

// [id, name, category, suggested price, sheet, [x, y, w, h] region]
const ITEMS = [
  // Crops: mature stage (column 4) of plants free.png. Peas are a two-tile climbing plant.
  ['crop-pumpkin', 'Pumpkin', 'crop', 12, 'plants free.png', [64, 0, 16, 16]],
  ['crop-carrot', 'Carrot', 'crop', 5, 'plants free.png', [64, 16, 16, 16]],
  ['crop-potato', 'Potato', 'crop', 5, 'plants free.png', [64, 32, 16, 16]],
  ['crop-tomato', 'Tomato', 'crop', 8, 'plants free.png', [64, 48, 16, 16]],
  ['crop-pea', 'Peas', 'crop', 8, 'plants free.png', [64, 64, 16, 32]],
  // Farm decor from farm objects free.png.
  ['fence-wood', 'Wooden Fence', 'farm-decor', 10, 'farm objects free.png', [0, 48, 32, 16]],
  ['fence-post', 'Fence Post', 'farm-decor', 5, 'farm objects free.png', [16, 16, 16, 16]],
  // The second birch at (96, 0) differs only by a few pixels of branch showing through the leaves; not kept.
  ['tree-birch', 'Birch Tree', 'farm-decor', 20, 'farm objects free.png', [48, 0, 48, 64]],
  ['tree-stump', 'Tree Stump', 'farm-decor', 8, 'farm objects free.png', [96, 64, 48, 16]],
  ['chest', 'Chest', 'farm-decor', 15, 'farm objects free.png', [16, 64, 16, 16]],
  ['chest-open', 'Open Chest', 'farm-decor', 15, 'farm objects free.png', [16, 80, 16, 16]],
  ['flowers-white', 'White Flowers', 'farm-decor', 6, 'farm objects free.png', [32, 64, 16, 16]],
  ['flowers-red', 'Red Tulips', 'farm-decor', 6, 'farm objects free.png', [48, 64, 16, 16]],
  ['rock', 'Rock', 'farm-decor', 5, 'farm objects free.png', [32, 80, 16, 16]],
  ['bush-clover', 'Clover Bush', 'farm-decor', 6, 'farm objects free.png', [48, 80, 16, 16]],
  ['haystack', 'Haystack', 'farm-decor', 15, 'farm objects free.png', [64, 64, 32, 32]],
];

// Earlier growth stages (columns 0-3), saved for later; not shop items.
const STAGE_ROWS = [['crop-pumpkin', 0], ['crop-carrot', 16], ['crop-potato', 32], ['crop-tomato', 48]];
const STAGES = [
  ...STAGE_ROWS.flatMap(([id, y]) => [0, 1, 2, 3].map((col) => [`${id}-stage-${col}`, 'plants free.png', [col * 16, y, 16, 16]])),
  // Peas: seeds and sprout are one tile (row 5); stages 2-3 are two tiles tall (rows 4-5).
  ['crop-pea-stage-0', 'plants free.png', [0, 80, 16, 16]],
  ['crop-pea-stage-1', 'plants free.png', [16, 80, 16, 16]],
  ['crop-pea-stage-2', 'plants free.png', [32, 64, 16, 32]],
  ['crop-pea-stage-3', 'plants free.png', [48, 64, 16, 32]],
];

// Icons that are not placeable (harvest produce, seed packets, misc); saved to icons/, not items.
const ICONS = [
  ['icon-pumpkin', [0, 0]], ['icon-potato', [16, 0]], ['icon-carrot', [32, 0]], ['icon-tomato', [48, 0]], ['icon-pea', [64, 0]],
  ['icon-seeds-pumpkin', [0, 16]], ['icon-seeds-potato', [16, 16]], ['icon-seeds-carrot', [32, 16]], ['icon-seeds-tomato', [48, 16]], ['icon-seeds-pea', [64, 16]],
  ['icon-sack', [0, 32]], ['icon-leaves', [16, 32]], ['icon-flower', [32, 32]],
].map(([id, [x, y]]) => [id, 'items free.png', [x, y, 16, 16]]);

// Not cropped at all: building parts in farm objects free.png.
const SKIPPED = [
  ['farmhouse', '(8, 96, 81, 92)', 'already the Farm exterior (public/assets/buildings/farm.png)'],
  ['door (small, arched)', '(0, 64, 16, 16)', 'door of the farmhouse'],
  ['doors (closed / open)', '(102, 113, 21, 27) and (102, 145, 21, 28)', 'building doors'],
  ['fence corner / end pieces', '(0, 0, 48, 48)', 'autotile pieces that only look right joined to other fence tiles'],
  ['second birch tree', '(102, 0, 35, 60)', 'same as tree-birch except a few pixels of branch (manual duplicate)'],
];

// ---------- farm background ----------
// spring farm tilemap.png, 16x16 tiles: plain grass at cell (3, 1); tilled soil is a 3x3 autotile
// at cells (5..7, 11..13) (corners, edges, plain centre).
const GRASS = [3, 1];
const SOIL = { tl: [5, 11], t: [6, 11], tr: [7, 11], l: [5, 12], c: [6, 12], r: [7, 12], bl: [5, 13], b: [6, 13], br: [7, 13] };
export const BACKGROUND = { cols: 20, rows: 14, tilled: [{ col: 6, row: 5, cols: 8, rows: 4 }] };

// ---------- helpers ----------
const sheets = new Map();
async function sheet(file) {
  if (!sheets.has(file)) {
    const { data, info } = await sharp(SRC + file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    sheets.set(file, { data, width: info.width, height: info.height });
  }
  return sheets.get(file);
}
const alphaAt = (s, x, y) => (x < 0 || y < 0 || x >= s.width || y >= s.height ? 0 : s.data[(y * s.width + x) * 4 + 3]);

/** Tight box of opaque pixels inside a region, its pixels, and whether opaque pixels touch the region's edge from outside. */
async function cropRegion(file, [rx, ry, rw, rh]) {
  const s = await sheet(file);
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
    if (!alphaAt(s, x, y)) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < 0) throw new Error(`${file}: empty region ${[rx, ry, rw, rh]}`);
  const box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const pixels = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) {
    const src = ((box.y + y) * s.width + box.x + x) * 4;
    s.data.copy(pixels, (y * box.w + x) * 4, src, src + 4);
  }
  // Opaque pixels right outside the region next to opaque pixels inside it: the sprite may continue there.
  let touches = 0;
  for (let x = rx; x < rx + rw; x++) {
    if (alphaAt(s, x, ry) && alphaAt(s, x, ry - 1)) touches++;
    if (alphaAt(s, x, ry + rh - 1) && alphaAt(s, x, ry + rh)) touches++;
  }
  for (let y = ry; y < ry + rh; y++) {
    if (alphaAt(s, rx, y) && alphaAt(s, rx - 1, y)) touches++;
    if (alphaAt(s, rx + rw - 1, y) && alphaAt(s, rx + rw, y)) touches++;
  }
  return { box, pixels, touches };
}

function difference(a, b) {
  if (a.box.w !== b.box.w || a.box.h !== b.box.h) return null;
  let differing = 0, opaque = 0, colour = 0;
  for (let i = 0; i < a.pixels.length; i += 4) {
    const aa = a.pixels[i + 3], ba = b.pixels[i + 3];
    if (!aa && !ba) continue;
    opaque++;
    if (!aa || !ba) { differing++; continue; }
    const d = Math.abs(a.pixels[i] - b.pixels[i]) + Math.abs(a.pixels[i + 1] - b.pixels[i + 1]) + Math.abs(a.pixels[i + 2] - b.pixels[i + 2]);
    colour += d / 3;
    if (d > 36) differing++;
  }
  return { differingShare: differing / opaque, meanColourDiff: colour / opaque };
}
// Same rule as split-shop-sprites.mjs: duplicate only if almost no pixel changes visibly AND the colour barely shifts.
const isDuplicate = (d) => d && d.differingShare < 0.015 && d.meanColourDiff < 7;

const save = (file, crop) => sharp(crop.pixels, { raw: { width: crop.box.w, height: crop.box.h, channels: 4 } }).png().toFile(file);

// ---------- main ----------
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const previewAt = args.indexOf('--preview');
const [previewItems, previewBackground] = previewAt >= 0 ? [args[previewAt + 1], args[previewAt + 2]] : [];
if (!dry) for (const dir of ['', 'stages', 'icons']) mkdirSync(OUT + dir, { recursive: true });

const kept = [];
const report = { duplicates: [], touching: [] };
for (const [id, name, category, price, file, region] of ITEMS) {
  const crop = await cropRegion(file, region);
  const twin = kept.find((k) => isDuplicate(difference(k, crop)));
  if (twin) {
    const d = difference(twin, crop);
    report.duplicates.push(`${id} ~ ${twin.id} (differing ${(d.differingShare * 100).toFixed(1)}%, colour diff ${d.meanColourDiff.toFixed(1)}) -> dropped`);
    continue;
  }
  if (crop.touches) report.touching.push(`${id}: ${crop.touches} edge pixels continue outside its 16px region (grid-joined piece)`);
  kept.push({ id, name, category, price, file, ...crop });
  if (!dry) await save(`${OUT}${id}.png`, crop);
}
for (const [id, file, region] of [...STAGES, ...ICONS]) {
  const crop = await cropRegion(file, region);
  if (!dry) await save(`${OUT}${id.startsWith('icon-') ? 'icons' : 'stages'}/${id}.png`, crop);
}

// Background: grass everywhere, tilled patches drawn from the 3x3 soil autotile.
const tilemap = 'spring farm tilemap.png';
const tile = async ([cx, cy]) => sharp(SRC + tilemap).extract({ left: cx * TILE, top: cy * TILE, width: TILE, height: TILE }).png().toBuffer();
const grass = await tile(GRASS);
const soil = Object.fromEntries(await Promise.all(Object.entries(SOIL).map(async ([k, cell]) => [k, await tile(cell)])));
const layers = [];
for (let row = 0; row < BACKGROUND.rows; row++) for (let col = 0; col < BACKGROUND.cols; col++) layers.push({ input: grass, left: col * TILE, top: row * TILE });
for (const patch of BACKGROUND.tilled) {
  for (let r = 0; r < patch.rows; r++) for (let c = 0; c < patch.cols; c++) {
    const v = r === 0 ? 't' : r === patch.rows - 1 ? 'b' : '';
    const h = c === 0 ? 'l' : c === patch.cols - 1 ? 'r' : '';
    layers.push({ input: soil[v + h || 'c'], left: (patch.col + c) * TILE, top: (patch.row + r) * TILE });
  }
}
const background = sharp({ create: { width: BACKGROUND.cols * TILE, height: BACKGROUND.rows * TILE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).png();
if (!dry) await background.clone().toFile(`${OUT}farm-background.png`);

// Frontend data module: item art + suggested catalog values, and the background layout.
const rows = kept.map((k) => `  ${JSON.stringify(k.id)}: { name: ${JSON.stringify(k.name)}, category: ${JSON.stringify(k.category)}, price: ${k.price}, width: ${k.box.w}, height: ${k.box.h}, source: ${JSON.stringify(`${k.file} ${k.box.x} ${k.box.y} ${k.box.w} ${k.box.h}`)} },`);
if (!dry) writeFileSync(resolve('src/data/farmSprites.ts'), `// Generated by scripts/split-farm-sprites.mjs. Do not edit by hand; rerun the script instead.
// Images: public/assets/farm/<id>.png. source = sheet x y width height. price is the suggested shop price.
export type FarmCategory = 'crop' | 'farm-decor';
export interface FarmSprite { name: string; category: FarmCategory; price: number; width: number; height: number; source: string }

export const FARM_SPRITES: Record<string, FarmSprite> = {
${rows.join('\n')}
};

/** public/assets/farm/farm-background.png: ${BACKGROUND.cols}x${BACKGROUND.rows} tiles of ${TILE}px; crops may only go on the tilled patches. */
export const FARM_BACKGROUND = ${JSON.stringify({ src: '/assets/farm/farm-background.png', tileSize: TILE, ...BACKGROUND })} as const;
`);

console.log(`${kept.length} items, ${STAGES.length} growth stages, ${ICONS.length} icons, background ${BACKGROUND.cols}x${BACKGROUND.rows} tiles`);
for (const k of kept) console.log(`${k.id.padEnd(16)} ${k.name.padEnd(15)} ${k.category.padEnd(11)} ${String(k.price).padStart(3)} coins  ${k.file} (${k.box.x}, ${k.box.y}, ${k.box.w}, ${k.box.h})`);
console.log(`\nDuplicates dropped: ${report.duplicates.length ? '' : 'none'}`); report.duplicates.forEach((l) => console.log(`  ${l}`));
console.log(`Grid-joined pieces: ${report.touching.length ? '' : 'none'}`); report.touching.forEach((l) => console.log(`  ${l}`));
console.log('Not items (saved to icons/):'); ICONS.forEach(([id, file, r]) => console.log(`  ${id} ${file} (${r.join(', ')})`));
console.log('Not cropped:'); SKIPPED.forEach(([what, where, why]) => console.log(`  ${what} ${where}: ${why}`));

if (previewItems) {
  const SCALE = 4, CW = 150, CH = 170, COLS = 6;
  const all = kept;
  const W = COLS * CW, H = Math.ceil(all.length / COLS) * CH;
  const comps = [];
  for (const [i, k] of all.entries()) {
    const s = k.box.w > 32 || k.box.h > 32 ? 2 : SCALE;
    const img = await sharp(k.pixels, { raw: { width: k.box.w, height: k.box.h, channels: 4 } }).resize(k.box.w * s, k.box.h * s, { kernel: 'nearest' }).png().toBuffer();
    const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH;
    comps.push({ input: img, left: cx + Math.round((CW - k.box.w * s) / 2), top: cy + 8 + Math.max(0, 128 - k.box.h * s) });
    comps.push({ input: Buffer.from(`<svg width="${CW}" height="28"><text x="${CW / 2}" y="12" font-family="monospace" font-size="12" text-anchor="middle" fill="#2f2a20">${k.id}</text><text x="${CW / 2}" y="25" font-family="monospace" font-size="10" text-anchor="middle" fill="#6b5b3e">${k.category} · ${k.price}c</text></svg>`), left: cx, top: cy + 140 });
  }
  const bg = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) bg.set((Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [244, 240, 228, 255] : [232, 228, 214, 255], (y * W + x) * 4);
  await sharp(bg, { raw: { width: W, height: H, channels: 4 } }).composite(comps).png().toFile(previewItems);
  const bgBuf = await background.toBuffer();
  await sharp(bgBuf).resize(BACKGROUND.cols * TILE * 3, BACKGROUND.rows * TILE * 3, { kernel: 'nearest' }).png().toFile(previewBackground);
  console.log(`\nPreviews: ${previewItems}, ${previewBackground}`);
}
