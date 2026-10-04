import ItemArtwork from './ItemArtwork';
import { MovableObject } from './MoveModeScene';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import { getItemArt, itemFamily } from '../data/shopAssets';
import { cellKey, cellToPosition, isTilled, nearestTilled, positionToCell, type FieldGrid } from './farm/farmGrid';
import type { Item } from '../types';
import type { LocationId } from '../types/building';

// Furniture the player placed in one location (Home or a building). Each copy can be dragged
// in MOVE OBJECTS mode and stored back to the Backpack. Must render inside a MoveModeScene.
// With a field grid (the Farm), crops are drawn on their tile and snap to tilled tiles when dragged.
export default function PlacedFurnitureLayer({ locationId, items, grid, onHint }: {
  locationId: LocationId;
  items: Item[];
  grid?: FieldGrid | null;
  /** Explains why a crop could not go where it was dragged. */
  onHint?: (message: string) => void;
}) {
  const room = useRoomPlacement();
  const here = room.placed.filter((p) => p.locationId === locationId);
  const occupied = new Map(here.filter((p) => p.cell).map((p) => [cellKey(p.cell!), p.instanceId]));
  return <>{here.map((p) => {
    const item = items.find((entry) => entry.id === p.itemId) ?? { id: p.itemId, name: p.itemId, type: 'furniture' as const, price: 0, asset: '' };
    const art = getItemArt(p.itemId);
    const crop = Boolean(grid && p.cell && art && itemFamily(p.itemId) === 'crop');
    const position = crop ? cellToPosition(grid!, p.cell!, art!) : { x: p.x, y: p.y };
    function move(pos: { x: number; y: number }) {
      if (!crop) { room.moveItem(p.instanceId, pos.x, pos.y); return; }
      let cell = positionToCell(grid!, pos, art!);
      if (!isTilled(grid!, cell)) {
        cell = nearestTilled(grid!, cell);
        onHint?.('Crops only grow on the tilled soil.');
      }
      const taken = occupied.get(cellKey(cell));
      if (taken && taken !== p.instanceId) { onHint?.('That patch of soil already has a crop.'); return; }
      const snapped = cellToPosition(grid!, cell, art!);
      if (cell.col !== p.cell!.col || cell.row !== p.cell!.row) room.moveItem(p.instanceId, snapped.x, snapped.y, cell);
    }
    return <MovableObject key={p.instanceId} objectId={p.instanceId} className={`room-owned-item room-slot placed-furniture${crop ? ' is-crop' : ''}`} name={item.name}
      position={{ objectId: p.instanceId, ...position }} onPositionChange={move} onStore={() => room.storeInstance(p.instanceId)}>
      <ItemArtwork item={item} fit={null} />
    </MovableObject>;
  })}</>;
}
