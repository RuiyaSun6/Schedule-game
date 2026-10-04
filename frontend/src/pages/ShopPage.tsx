import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Item } from '../types';
import GameTopBar from '../components/GameTopBar';
import ItemCard from '../components/ItemCard';
import PixelButton from '../components/PixelButton';
import { usePlayer, usePlayerActions } from '../services/PlayerContext';
import { useCatalog } from '../services/useCatalog';
import { buyItem } from '../services/shop';
import { SHOP_CATEGORIES, ownedCount, shopCategory } from '../data/shopAssets';
import { useRoomPlacement } from '../services/RoomPlacementContext';

export default function ShopPage({ embedded = false }: { embedded?: boolean }) {
  const player = usePlayer();
  const actions = usePlayerActions();
  const catalog = useCatalog();
  const room = useRoomPlacement();
  const [category, setCategory] = useState<string>('All');
  const [buying, setBuying] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const categories = SHOP_CATEGORIES.filter((name) => catalog.items.some((item) => shopCategory(item) === name));
  // A tab can disappear (e.g. after a catalog update); fall back to All instead of an empty view.
  const activeCategory = category === 'All' || (categories as readonly string[]).includes(category) ? category : 'All';
  // Only items with a shop tab are sold; anything else (retired items) is skipped safely.
  const sellable = catalog.items.filter((item) => shopCategory(item) !== null);
  const shown = sellable.filter((item) => activeCategory === 'All' || shopCategory(item) === activeCategory);

  async function buy(item: Item) {
    if (!actions.beginMutation()) { setError('Another update is in progress. Please wait.'); return; }
    setBuying(item.id); setError(''); setNotice('');
    try {
      const result = await buyItem(player, item);
      // The returned player is authoritative: coins and ownership update everywhere at once.
      actions.updatePlayer(result.player);
      // New regular furniture waits in Backpack instead of filling a bedroom slot.
      // Existing placed items and stackable copies keep their current placements.
      if (result.item.type !== 'clothing' && !result.item.stackable && !player.ownedItems?.includes(result.item.id)) room.storeItem(result.item.id);
      setNotice(`${result.item.name} is yours! −${result.item.price} coins.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Purchase failed. Please try again.');
    } finally {
      actions.endMutation();
      setBuying(null);
    }
  }

  return <section className={embedded ? 'furniture-shop-content' : 'inventory-page accepted-quests-page'}>
    {!embedded && <GameTopBar />}<h1 id="furniture-shop-title">SHOP</h1>
    <div className="shop-categories" aria-label="Shop categories">
      {['All', ...categories].map((name) => <PixelButton key={name} aria-pressed={name === activeCategory} onClick={() => setCategory(name)}>{name.toUpperCase()}</PixelButton>)}
    </div>
    {catalog.loading && <p className="loading-feedback" role="status">Loading little treasures…</p>}
    {catalog.demo && <p className="planner-notice">Offline catalog preview · purchases need the backend.</p>}
    {catalog.error && <div role="alert"><p>{catalog.error}</p><PixelButton onClick={catalog.retry}>RETRY</PixelButton></div>}
    <p role="status" className={`shop-feedback ${notice ? 'is-success' : ''}`}>{notice}</p>
    {error && <p role="alert" className="shop-feedback is-error">{error}</p>}
    {!catalog.loading && !catalog.error && <div className="item-grid shop-item-grid" tabIndex={0} aria-label="Shop items">
      {shown.map((item) => <ItemCard key={item.id} item={item} coins={player.coins} owned={player.ownedItems?.includes(item.id) ?? false} count={ownedCount(player, item.id)}
        busy={buying !== null || catalog.demo} buying={buying === item.id} onBuy={() => void buy(item)} />)}
    </div>}
    {!catalog.loading && !catalog.error && shown.length === 0 && <p>No items in this category yet.</p>}
    {!embedded && <div className="inventory-links"><Link to="/home">← Bedroom</Link><Link to="/wardrobe">Wardrobe →</Link></div>}
  </section>;
}
