import { useEffect, useState, type RefObject } from 'react';
import type { FieldConfig } from '../../types/building';

// Geometry of a tiled field (the Farm) inside its scene. The background image is drawn at a
// whole-number scale, centred; grass colour fills any space around it (the image edges are grass).
// Crops sit on tilled tiles: positions are stored as tiles and turned into pixels here.
export interface FieldGrid {
  field: FieldConfig;
  scale: number;
  /** Tile size on screen (tileSize * scale). */
  cell: number;
  /** Scene pixel position of the image's top-left corner. */
  originX: number;
  originY: number;
}

export interface Cell { col: number; row: number }
export interface ArtSize { width: number; height: number }

/** Largest whole scale (2-4) at which the tilled area fits comfortably in the scene. */
export function fieldScale(field: FieldConfig, width: number, height: number) {
  const tilledCols = Math.max(...field.tilled.map((t) => t.col + t.cols)) - Math.min(...field.tilled.map((t) => t.col));
  const tilledRows = Math.max(...field.tilled.map((t) => t.row + t.rows)) - Math.min(...field.tilled.map((t) => t.row));
  const fit = Math.floor(Math.min((width * 0.9) / (tilledCols * field.tileSize), (height * 0.55) / (tilledRows * field.tileSize)));
  return Math.max(2, Math.min(4, fit));
}

export function makeGrid(field: FieldConfig, width: number, height: number): FieldGrid {
  const scale = fieldScale(field, width, height);
  const cell = field.tileSize * scale;
  return { field, scale, cell, originX: Math.round((width - field.cols * cell) / 2), originY: Math.round((height - field.rows * cell) / 2) };
}

/** Tracks the scene size and returns the grid (null until measured, or when there is no field). */
export function useFieldGrid(sceneRef: RefObject<HTMLElement | null>, field: FieldConfig | undefined) {
  const [grid, setGrid] = useState<FieldGrid | null>(null);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !field) { setGrid(null); return; }
    const update = () => setGrid(makeGrid(field, scene.clientWidth, scene.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scene);
    return () => observer.disconnect();
  }, [sceneRef, field]);
  return grid;
}

export const cellKey = (cell: Cell) => `${cell.col},${cell.row}`;

export function isTilled(grid: FieldGrid, cell: Cell) {
  return grid.field.tilled.some((t) => cell.col >= t.col && cell.col < t.col + t.cols && cell.row >= t.row && cell.row < t.row + t.rows);
}

/** All tilled tiles, row by row. */
export function tilledCells(grid: FieldGrid): Cell[] {
  return grid.field.tilled.flatMap((t) => Array.from({ length: t.rows * t.cols }, (_, i) => ({ col: t.col + (i % t.cols), row: t.row + Math.floor(i / t.cols) })));
}

/** Top-left pixel position of a crop standing on a tile: centred, feet on the tile's bottom edge. */
export function cellToPosition(grid: FieldGrid, cell: Cell, art: ArtSize) {
  return {
    x: grid.originX + cell.col * grid.cell + Math.round((grid.cell - art.width * grid.scale) / 2),
    y: grid.originY + (cell.row + 1) * grid.cell - art.height * grid.scale,
  };
}

/** The tile under a crop's feet (bottom centre) for a top-left pixel position. */
export function positionToCell(grid: FieldGrid, position: { x: number; y: number }, art: ArtSize): Cell {
  const footX = position.x + (art.width * grid.scale) / 2;
  const footY = position.y + art.height * grid.scale - 1;
  return { col: Math.floor((footX - grid.originX) / grid.cell), row: Math.floor((footY - grid.originY) / grid.cell) };
}

/** Nearest tilled tile to a cell (used to keep dragged crops on the soil). */
export function nearestTilled(grid: FieldGrid, cell: Cell): Cell {
  let best = tilledCells(grid)[0];
  let bestDistance = Infinity;
  for (const candidate of tilledCells(grid)) {
    const distance = (candidate.col - cell.col) ** 2 + (candidate.row - cell.row) ** 2;
    if (distance < bestDistance) { best = candidate; bestDistance = distance; }
  }
  return best;
}
