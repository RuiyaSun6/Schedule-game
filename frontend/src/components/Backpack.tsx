import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
import { getFurnitureVariant } from '../data/shopAssets';
import { useRoomPlacement } from '../services/RoomPlacementContext';

export default function Backpack({ items, onPlace, loading, error, onRetry }: { items: Item[]; onPlace: (id: string) => void; loading: boolean; error: string; onRetry: () => void }) {
  const room = useRoomPlacement();
  const available = items.filter((item) => room.availableQuantity(item.id) > 0);
  return <div className="backpack-view">
    <h2 id="backpack-title">BACKPACK</h2>
    <p>Your treasures stay yours. Place them, move them, or store them here.</p>
    {loading && <p role="status">Opening your backpack…</p>}
    {error && <div role="alert"><p>{error}</p><PixelButton onClick={onRetry}>RETRY CATALOG</PixelButton></div>}
    {!loading && available.length === 0 && <p>No items to place yet. Visit the Shop to find something cozy.</p>}
    <div className="item-grid">{available.map((item) => <article className="item-card pixel-panel" key={item.id}>
      <ItemArtwork item={item} /><h3>{item.name}</h3><p>{getFurnitureVariant(item.id)?.category ?? item.type}{getFurnitureVariant(item.id) ? ' · Demo' : ''}</p>
      <p>Available: x{room.availableQuantity(item.id)} · Owned: {room.ownedQuantity(item.id)}</p>
      <PixelButton onClick={() => onPlace(item.id)}>PLACE ONE</PixelButton>
    </article>)}</div>
    <small>Starter bed, desk, and computer always stay in the room. Use MOVE OBJECTS to reposition them.</small>
  </div>;
}
