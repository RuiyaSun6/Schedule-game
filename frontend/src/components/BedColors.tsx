import { useEffect, useState } from 'react';
import './BedColors.css';

// Bed colours: the bedroom bed is two crops of furniture/beds.png, a wooden frame (with a cream
// mattress) and a bedding overlay. Only the bedding is green, in 4 shades. A colour swaps those 4
// shades one-to-one (lightest to darkest) on a canvas, pixel by pixel, so the wood, outlines and the
// two soft shadow pixels stay exactly as drawn. Results are cached as data URLs (one per colour).
//
// Forest Green is the original art: free for everyone and the default. Other colours are shop items.

const pack = `${import.meta.env.BASE_URL}assets/interior%20full/`;
export const BEDS_SHEET = { src: `${pack}furniture/beds.png`, width: 1920, height: 784 };
/** [x, y, width, height] in beds.png. */
export const BED_FRAME_CROP = [0, 112, 32, 32] as const;
export const BED_BEDDING_CROP = [384, 240, 32, 32] as const;

/** The bedding's greens, lightest first (pixel counts 464, 74, 56, 47). */
const FOREST_GREEN = ['#4b8053', '#497a58', '#447252', '#426e50'] as const;

export const DEFAULT_BED_COLOR = 'bed-forest-green';
export interface BedColor { id: string; name: string; palette: readonly string[] }
// Each palette: the lightest shade is the colour's base; the darker three use the same brightness
// ratios as the original greens (1, 0.962, 0.898, 0.868), so the shading reads the same.
export const BED_COLORS: readonly BedColor[] = [
  { id: DEFAULT_BED_COLOR, name: 'Forest Green', palette: FOREST_GREEN },
  { id: 'bed-dusty-rose', name: 'Dusty Rose', palette: ['#c49290', '#bc8c8a', '#b08381', '#aa7f7d'] },
  { id: 'bed-navy-blue', name: 'Navy Blue', palette: ['#52668a', '#4f6285', '#4a5c7c', '#475978'] },
  { id: 'bed-mustard-yellow', name: 'Mustard Yellow', palette: ['#cca652', '#c4a04f', '#b7954a', '#b19047'] },
  { id: 'bed-lavender', name: 'Lavender', palette: ['#aa9ac4', '#a394bc', '#998ab0', '#9486aa'] },
  { id: 'bed-cream-white', name: 'Cream White', palette: ['#ece2cc', '#e3d9c4', '#d4cbb7', '#cdc4b1'] },
];
export const bedColor = (id: string | null | undefined) => BED_COLORS.find((color) => color.id === id);
export const isBedColor = (id: string) => bedColor(id) !== undefined;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

let sheet: Promise<HTMLImageElement> | null = null;
function loadSheet() {
  sheet ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { sheet = null; reject(new Error('beds.png failed to load')); };
    image.src = BEDS_SHEET.src;
  });
  return sheet;
}

const done = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/** The recoloured bedding as a 32x32 PNG data URL (cached). Forest Green needs no recolouring. */
function recolor(color: BedColor): Promise<string> {
  const cached = done.get(color.id);
  if (cached) return Promise.resolve(cached);
  let job = pending.get(color.id);
  if (!job) {
    job = loadSheet().then((image) => {
      const [x, y, width, height] = BED_BEDDING_CROP;
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('No 2D canvas');
      context.drawImage(image, x, y, width, height, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      // Exact colour lookup: original green -> new shade at the same depth. Anything else is untouched.
      const swap = new Map(FOREST_GREEN.map((green, i) => [rgb(green).join(','), rgb(color.palette[i])]));
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        const next = swap.get(`${data[i]},${data[i + 1]},${data[i + 2]}`);
        if (next) [data[i], data[i + 1], data[i + 2]] = next;
      }
      context.putImageData(pixels, 0, 0);
      const url = canvas.toDataURL('image/png');
      done.set(color.id, url);
      return url;
    }).finally(() => pending.delete(color.id));
    pending.set(color.id, job);
  }
  return job;
}

/** Bedding image for a colour: { src, crop, sheet size } ready for an SVG crop, or null while it is being made. */
export function useBedding(colorId: string | null | undefined) {
  const color = bedColor(colorId) ?? bedColor(DEFAULT_BED_COLOR)!;
  const original = color.id === DEFAULT_BED_COLOR;
  const [url, setUrl] = useState(() => original ? null : done.get(color.id) ?? null);
  useEffect(() => {
    if (original) return;
    let live = true;
    setUrl(done.get(color.id) ?? null);
    recolor(color).then((next) => { if (live) setUrl(next); }).catch(() => { /* Keep the bed without bedding rather than crash. */ });
    return () => { live = false; };
  }, [color, original]);
  if (original) return { src: BEDS_SHEET.src, sheetWidth: BEDS_SHEET.width, sheetHeight: BEDS_SHEET.height, crop: [...BED_BEDDING_CROP] as [number, number, number, number] };
  return url ? { src: url, sheetWidth: 32, sheetHeight: 32, crop: [0, 0, 32, 32] as [number, number, number, number] } : null;
}

function Crop({ src, sheetWidth, sheetHeight, crop, className }: { src: string; sheetWidth: number; sheetHeight: number; crop: readonly number[]; className?: string }) {
  return <svg className={`asset-sprite ${className ?? ''}`} viewBox={crop.join(' ')} aria-hidden="true">
    <image href={src} width={sheetWidth} height={sheetHeight} />
  </svg>;
}

/** Shop thumbnail: the whole bed (frame + recoloured bedding) at 3x, crisp pixels. */
export function BedPreview({ colorId, label }: { colorId: string; label: string }) {
  const bedding = useBedding(colorId);
  return <span className="bed-preview" role="img" aria-label={label}>
    <Crop src={BEDS_SHEET.src} sheetWidth={BEDS_SHEET.width} sheetHeight={BEDS_SHEET.height} crop={BED_FRAME_CROP} />
    {bedding && <Crop {...bedding} />}
  </span>;
}
