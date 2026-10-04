// One-off: split the shop's sprite sheets into one PNG per colour variant.
// Usage (from frontend/): node scripts/split-shop-sprites.mjs [--preview out.png] [--dry]
//
// For every family below, opaque pixels are grouped into connected objects (8-neighbour);
// objects whose centre falls in one of the family's cells are cropped to their tight bounding box.
// Near-identical variants (same shape, colours hard to tell apart) are dropped as duplicates.
// Source sheets are never modified. Writes src/assets/<folder>/<id>.png.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const SHEETS = {
  decorations: 'public/assets/interior full/furniture/decorations.png',
  chairs: 'public/assets/interior full/furniture/chairs.png',
  couches: 'public/assets/interior full/furniture/couches.png',
};

// cells: [x, y, w, h] areas that each hold one variant. names: one per cell, in order.
const cellsRow = (x0, y, w, h, step, count) => Array.from({ length: count }, (_, i) => [x0 + i * step, y, w, h]);
export const FAMILIES = [
  {
    family: 'plant', label: 'Plant', type: 'furniture', category: 'Plants', sheet: 'decorations', original: [0, 32, 16, 32],
    cells: cellsRow(0, 32, 16, 32, 16, 4),
    names: [['plant-red-pot', 'Plant (Red Pot)'], ['plant-brown-pot', 'Plant (Brown Pot)'], ['plant-blue-pot', 'Plant (Blue Pot)'], ['plant-grey-pot', 'Plant (Grey Pot)']],
  },
  {
    family: 'lamp', label: 'Lamp', type: 'furniture', category: 'Lighting', sheet: 'decorations', original: [304, 112, 16, 32],
    cells: cellsRow(304, 112, 16, 32, 16, 8),
    names: [
      ['lamp-black', 'Black Lamp'], ['lamp-gold', 'Gold Lamp'], ['lamp-copper', 'Copper Lamp'], ['lamp-grey', 'Grey Lamp'],
      ['lamp-tan-black', 'Tan Shade Black Lamp'], ['lamp-tan-gold', 'Tan Shade Gold Lamp'], ['lamp-tan-copper', 'Tan Shade Copper Lamp'], ['lamp-tan-grey', 'Tan Shade Grey Lamp'],
    ],
  },
  {
    // Front view only: each colour block is 64px wide (front, side, back, side).
    family: 'chair', label: 'Chair', type: 'furniture', category: 'Seating', sheet: 'chairs', original: [0, 0, 16, 32],
    cells: cellsRow(0, 0, 16, 32, 64, 10),
    names: [
      ['chair-cream', 'Cream Chair'], ['chair-caramel', 'Caramel Chair'], ['chair-dark-brown', 'Dark Brown Chair'], ['chair-walnut', 'Walnut Chair'],
      ['chair-chestnut', 'Chestnut Chair'], ['chair-grey', 'Grey Chair'], ['chair-black', 'Black Chair'], ['chair-green', 'Green Chair'],
      ['chair-teal', 'Teal Chair'], ['chair-pink', 'Pink Chair'],
    ],
  },
  {
    // Rounded sofa, front view: colour blocks are 192px wide, three rows of four colours.
    family: 'sofa', label: 'Sofa', type: 'furniture', category: 'Seating', sheet: 'couches', original: [0, 112, 32, 32],
    cells: [112, 144, 176].flatMap((y) => cellsRow(0, y, 32, 32, 192, 4)),
    names: [
      ['sofa-beige', 'Beige Sofa'], ['sofa-slate', 'Slate Sofa'], ['sofa-charcoal', 'Charcoal Sofa'], ['sofa-brown', 'Brown Sofa'],
      ['sofa-red', 'Red Sofa'], ['sofa-coral', 'Coral Sofa'], ['sofa-orange', 'Orange Sofa'], ['sofa-green', 'Green Sofa'],
      ['sofa-teal', 'Teal Sofa'], ['sofa-navy', 'Navy Sofa'], ['sofa-purple', 'Purple Sofa'], ['sofa-rosewood', 'Rosewood Sofa'],
    ],
  },
  {
    family: 'flowers', label: 'Flowers', type: 'garden', category: 'Garden', sheet: 'decorations', original: [0, 64, 16, 32],
    cells: cellsRow(0, 64, 16, 32, 16, 4),
    names: [['flowers-red-pot', 'Flowers (Red Pot)'], ['flowers-brown-pot', 'Flowers (Brown Pot)'], ['flowers-blue-pot', 'Flowers (Blue Pot)'], ['flowers-grey-pot', 'Flowers (Grey Pot)']],
  },
  {
    family: 'tree', label: 'Tree', type: 'garden', category: 'Garden', sheet: 'decorations', original: [16, 0, 16, 32],
    cells: cellsRow(0, 0, 16, 32, 16, 4),
    names: [['tree-red-pot', 'Tree (Red Pot)'], ['tree-brown-pot', 'Tree (Brown Pot)'], ['tree-blue-pot', 'Tree (Blue Pot)'], ['tree-grey-pot', 'Tree (Grey Pot)']],
  },
  {
    // The "bench" art is the cushioned armchair row; front view only.
    family: 'bench', label: 'Bench', type: 'garden', category: 'Garden', sheet: 'chairs', original: [0, 96, 32, 32],
    cells: cellsRow(0, 96, 16, 32, 64, 10),
    names: [
      ['bench-cream', 'Cream Bench'], ['bench-caramel', 'Caramel Bench'], ['bench-dark-brown', 'Dark Brown Bench'], ['bench-walnut', 'Walnut Bench'],
      ['bench-chestnut', 'Chestnut Bench'], ['bench-grey', 'Grey Bench'], ['bench-black', 'Black Bench'], ['bench-green', 'Green Bench'],
      ['bench-teal', 'Teal Bench'], ['bench-pink', 'Pink Bench'],
    ],
  },
];

// ---------- image helpers ----------
async function loadSheet(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { file, data, width: info.width, height: info.height };
}
const alphaAt = (s, x, y) => (x < 0 || y < 0 || x >= s.width || y >= s.height ? 0 : s.data[(y * s.width + x) * 4 + 3]);

/** Labels 8-connected opaque regions; returns label map and per-label bounding boxes. */
function components(sheet) {
  const { width, height } = sheet;
  const labels = new Int32Array(width * height);
  const boxes = [null];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (labels[y * width + x] || !alphaAt(sheet, x, y)) continue;
    const id = boxes.length;
    const box = { id, x0: x, y0: y, x1: x, y1: y, pixels: 0 };
    const stack = [[x, y]];
    labels[y * width + x] = id;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      box.pixels++;
      box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx); box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const i = ny * width + nx;
        if (!labels[i] && alphaAt(sheet, nx, ny)) { labels[i] = id; stack.push([nx, ny]); }
      }
    }
    boxes.push(box);
  }
  return { labels, boxes };
}

const inside = ([x, y, w, h], px, py) => px >= x && px < x + w && py >= y && py < y + h;
const centre = (b) => [(b.x0 + b.x1 + 1) / 2, (b.y0 + b.y1 + 1) / 2];

/** RGBA pixels of a crop, with pixels from other objects cleared (keeps crops clean). */
function cropPixels(sheet, comp, ids, box) {
  const { x, y, w, h } = box;
  const out = Buffer.alloc(w * h * 4);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const src = ((y + yy) * sheet.width + (x + xx)) * 4;
    if (!ids.has(comp.labels[(y + yy) * sheet.width + (x + xx)])) continue;
    sheet.data.copy(out, (yy * w + xx) * 4, src, src + 4);
  }
  return out;
}

/** Compares two same-size crops: share of differing pixels and mean colour difference. */
function difference(a, b) {
  if (a.w !== b.w || a.h !== b.h) return null;
  let differing = 0, opaque = 0, colourDiff = 0;
  for (let i = 0; i < a.pixels.length; i += 4) {
    const aa = a.pixels[i + 3], ba = b.pixels[i + 3];
    if (!aa && !ba) continue;
    opaque++;
    if (!aa || !ba) { differing++; continue; }
    const d = Math.abs(a.pixels[i] - b.pixels[i]) + Math.abs(a.pixels[i + 1] - b.pixels[i + 1]) + Math.abs(a.pixels[i + 2] - b.pixels[i + 2]);
    colourDiff += d / 3;
    if (d > 36) differing++;
  }
  return { differingShare: differing / opaque, meanColourDiff: colourDiff / opaque };
}
// "Looks the same" needs both: almost no pixel changes visibly (local recolours such as a
// different pot stay distinct) and the overall colour barely shifts (whole-object recolours stay distinct).
const isDuplicate = (d) => d && d.differingShare < 0.015 && d.meanColourDiff < 7;

// ---------- main ----------
const args = process.argv.slice(2);
const previewPath = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const dry = args.includes('--dry');

const sheets = {};
for (const [key, file] of Object.entries(SHEETS)) {
  const sheet = await loadSheet(resolve(file));
  sheets[key] = { sheet, comp: components(sheet) };
}

const kept = [];
const report = { duplicates: [], leaks: [], ignored: [] };
for (const fam of FAMILIES) {
  const { sheet, comp } = sheets[fam.sheet];
  const famKept = [];
  const usedIds = new Set();
  fam.cells.forEach((cell, index) => {
    const parts = comp.boxes.filter((b) => b && inside(cell, ...centre(b)));
    if (!parts.length) throw new Error(`${fam.family}: no object in cell ${cell}`);
    const ids = new Set(parts.map((b) => b.id));
    parts.forEach((b) => usedIds.add(b.id));
    const box = { x: Math.min(...parts.map((b) => b.x0)), y: Math.min(...parts.map((b) => b.y0)) };
    box.w = Math.max(...parts.map((b) => b.x1)) + 1 - box.x;
    box.h = Math.max(...parts.map((b) => b.y1)) + 1 - box.y;
    // Pixels of other objects inside the crop box would be cleared; report them.
    let foreign = 0;
    for (let yy = box.y; yy < box.y + box.h; yy++) for (let xx = box.x; xx < box.x + box.w; xx++) {
      const label = comp.labels[yy * sheet.width + xx];
      if (label && !ids.has(label)) foreign++;
    }
    if (foreign) report.leaks.push(`${fam.names[index][0]}: ${foreign} pixels of a neighbouring object inside the box (cleared)`);
    const candidate = { id: fam.names[index][0], name: fam.names[index][1], family: fam.family, type: fam.type, category: fam.category,
      sheet: SHEETS[fam.sheet], box, w: box.w, h: box.h, pixels: cropPixels(sheet, comp, ids, box) };
    const twin = famKept.find((k) => isDuplicate(difference(k, candidate)));
    if (twin) {
      const d = difference(twin, candidate);
      report.duplicates.push(`${candidate.id} ~ ${twin.id} (differing ${(d.differingShare * 100).toFixed(1)}%, mean colour diff ${d.meanColourDiff.toFixed(1)}) -> dropped`);
      return;
    }
    famKept.push(candidate);
  });
  // Objects visible in the old card (the SVG showed ~43px either side of the crop) that are not variants.
  const [ox, oy, ow, oh] = fam.original;
  const window = [ox + ow / 2 - 43, oy, 86, oh];
  for (const b of comp.boxes) {
    if (!b || usedIds.has(b.id) || b.pixels < 6 || !inside(window, ...centre(b))) continue;
    if (fam.cells.some((c) => inside(c, ...centre(b)))) continue;
    report.ignored.push(`${fam.family}: object at (${b.x0}, ${b.y0}, ${b.x1 - b.x0 + 1}, ${b.y1 - b.y0 + 1}) shown in the old card, not a ${fam.label.toLowerCase()} variant`);
  }
  kept.push(...famKept);
}

if (!dry) {
  for (const item of kept) {
    const out = resolve('src/assets', item.type, `${item.id}.png`);
    mkdirSync(dirname(out), { recursive: true });
    await sharp(item.pixels, { raw: { width: item.w, height: item.h, channels: 4 } }).png().toFile(out);
  }
}

console.log(`${kept.length} variants kept`);
for (const item of kept) {
  console.log(`${item.id.padEnd(20)} ${item.name.padEnd(24)} ${item.type.padEnd(9)} ${item.category.padEnd(9)} ${item.sheet.split('/').pop()} (${item.box.x}, ${item.box.y}, ${item.w}, ${item.h})`);
}
for (const [title, lines] of [['Duplicates dropped', report.duplicates], ['Neighbour pixels', report.leaks], ['Not shop items (seen in old cards)', report.ignored]]) {
  console.log(`\n${title}: ${lines.length ? '' : 'none'}`);
  lines.forEach((line) => console.log(`  ${line}`));
}

// Frontend data module: art size + family per variant (prices stay on the backend).
const rows = kept.map((item) => `  ${JSON.stringify(item.id)}: { name: ${JSON.stringify(item.name)}, family: ${JSON.stringify(item.family)}, type: ${JSON.stringify(item.type)}, width: ${item.w}, height: ${item.h}, source: ${JSON.stringify(`${item.sheet.split('/').pop()} ${item.box.x} ${item.box.y} ${item.w} ${item.h}`)} },`);
if (!dry) writeFileSync(resolve('src/data/shopSprites.ts'), `// Generated by scripts/split-shop-sprites.mjs. Do not edit by hand; rerun the script instead.
// Each entry is one cropped PNG in src/assets/<type>/<id>.png. source = sheet x y width height.
export interface ShopSprite { name: string; family: string; type: 'furniture' | 'garden' | 'clothing'; width: number; height: number; source: string }

export const SHOP_SPRITES: Record<string, ShopSprite> = {
${rows.join('\n')}
};
`);

if (previewPath) {
  // Grid preview: each sprite at 3x on a checkerboard, ID underneath.
  const SCALE = 3, CELL_W = 150, CELL_H = 140, COLS = 8;
  const rows = Math.ceil(kept.length / COLS);
  const W = COLS * CELL_W, H = rows * CELL_H;
  const composites = [];
  for (const [i, item] of kept.entries()) {
    const cx = (i % COLS) * CELL_W, cy = Math.floor(i / COLS) * CELL_H;
    const img = await sharp(item.pixels, { raw: { width: item.w, height: item.h, channels: 4 } })
      .resize(item.w * SCALE, item.h * SCALE, { kernel: 'nearest' }).png().toBuffer();
    composites.push({ input: img, left: cx + Math.round((CELL_W - item.w * SCALE) / 2), top: cy + 8 + Math.max(0, 96 - item.h * SCALE) });
    const label = `<svg width="${CELL_W}" height="24"><text x="${CELL_W / 2}" y="16" font-family="monospace" font-size="12" text-anchor="middle" fill="#3b3226">${item.id}</text></svg>`;
    composites.push({ input: Buffer.from(label), left: cx, top: cy + 110 });
  }
  const bg = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) ? 244 : 232;
    bg.set([c, c - 4, c - 14, 255], (y * W + x) * 4);
  }
  await sharp(bg, { raw: { width: W, height: H, channels: 4 } }).composite(composites).png().toFile(previewPath);
  console.log(`\nPreview: ${previewPath}`);
}
