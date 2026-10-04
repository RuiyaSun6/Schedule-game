export interface WorldPoint { x: number; y: number }
export interface WorldSize { width: number; height: number }

export const WORLD_TILES_PER_SIDE = 3;
export const HOME_CAMERA: Readonly<WorldPoint> = { x: 0, y: 0 };

// Camera offset is measured from the centered village view. One tile of travel
// in either direction reaches the edge of a three-tile-wide world.
export function clampCamera(offset: WorldPoint, viewport: WorldSize): WorldPoint {
  return {
    x: Math.max(-viewport.width, Math.min(viewport.width, offset.x)),
    y: Math.max(-viewport.height, Math.min(viewport.height, offset.y)),
  };
}

export function cameraTranslation(offset: WorldPoint, viewport: WorldSize): WorldPoint {
  return { x: offset.x - viewport.width, y: offset.y - viewport.height };
}

export function viewportToWorld(point: WorldPoint, offset: WorldPoint, viewport: WorldSize): WorldPoint {
  const translation = cameraTranslation(offset, viewport);
  return { x: point.x - translation.x, y: point.y - translation.y };
}
