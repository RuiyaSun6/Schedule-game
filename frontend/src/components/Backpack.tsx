import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
import { isDisplayed } from '../data/shopAssets';
import { usePlayer } from '../services/PlayerContext';

// Owned items that are not on display. Furniture, garden items, and pet items appear in their
// scene slots automatically (newest variant per slot), so they are listed here only when a newer
// variant has taken their slot, plus clothing.
export default function Backpack({ items, loading, error, onRetry }: { items: Item[]; loading: boolean; error: string; onRetry: () => void }) {
  const player = usePlayer();
  const stored = items.filter((item) => player.ownedItems?.includes(item.id) && !isDisplayed(player.ownedItems, item.id));
  return <div className="backpack-view">
    <h2 id="backpack-title">BACKPACK</h2>
    <p>New furniture and garden items appear in their spot right away. When you buy another colour of the same kind, the newest one is shown and the older one waits here.</p>
    {loading && <p role="status">Opening your backpack…</p>}
    {error && <div role="alert"><p>{error}</p><PixelButton onClick={onRetry}>RETRY CATALOG</PixelButton></div>}
    {!loading && !error && stored.length === 0 && <p>Nothing stored right now. Everything you own is out on display.</p>}
    <div className="item-grid">{stored.map((item) => <article className="item-card pixel-panel" key={item.id}>
      <div className="item-card-art"><ItemArtwork item={item} /></div><h3>{item.name}</h3>
      <p>{item.type === 'clothing' ? 'Wear it from the Wardrobe' : 'Stored · a newer one is on display'}</p>
    </article>)}</div>
    <small>Use MOVE OBJECTS in the room to rearrange furniture and the pet corner.</small>
  </div>;
}
