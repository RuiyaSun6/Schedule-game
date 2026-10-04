import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Item } from '../types';
import GameTopBar from '../components/GameTopBar';
import ItemCard from '../components/ItemCard';
import PixelButton from '../components/PixelButton';
import { usePlayer, usePlayerActions } from '../services/PlayerContext';
import { useCatalog } from '../services/useCatalog';
import { buyItem } from '../services/shop';
import { SHOP_CATEGORIES, shopCategory } from '../data/shopAssets';

export default function ShopPage() {
  const player = usePlayer();
  const actions = usePlayerActions();
  const catalog = useCatalog();
  const [category, setCategory] = useState<string>('All');
  const [buying, setBuying] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const categories = SHOP_CATEGORIES.filter((name) => catalog.items.some((item) => shopCategory(item) === name));
  const shown = catalog.items.filter((item) => category === 'All' || shopCategory(item) === category);

  async function buy(item: Item) {
    if (!actions.beginMutation()) { setError('Another update is in progress. Please wait.'); return; }
    setBuying(item.id); setError(''); setNotice('');
    try {
      const result = await buyItem(player, item);
      // The returned player is authoritative: coins and ownership update everywhere at once.
      actions.updatePlayer(result.player);
      setNotice(`${result.item.name} is yours! −${result.item.price} coins.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Purchase failed. Please try again.');
    } finally {
      actions.endMutation();
      setBuying(null);
    }
  }

  return <section className="inventory-page accepted-quests-page">
    <GameTopBar /><h1>SHOP</h1>
    <div className="shop-categories" aria-label="Shop categories">
      {['All', ...categories].map((name) => <PixelButton key={name} aria-pressed={name === category} onClick={() => setCategory(name)}>{name.toUpperCase()}</PixelButton>)}
    </div>
    {catalog.loading && <p className="loading-feedback" role="status">Loading little treasures…</p>}
    {catalog.demo && <p className="planner-notice">Offline catalog preview · purchases need the backend.</p>}
    {catalog.error && <div role="alert"><p>{catalog.error}</p><PixelButton onClick={catalog.retry}>RETRY</PixelButton></div>}
    <p role="status" className={`shop-feedback ${notice ? 'is-success' : ''}`}>{notice}</p>
    {error && <p role="alert" className="shop-feedback is-error">{error}</p>}
    {!catalog.loading && !catalog.error && <div className="item-grid shop-item-grid" tabIndex={0} aria-label="Shop items">
      {shown.map((item) => <ItemCard key={item.id} item={item} coins={player.coins} owned={player.ownedItems?.includes(item.id) ?? false}
        busy={buying !== null || catalog.demo} buying={buying === item.id} onBuy={() => void buy(item)} />)}
    </div>}
    {!catalog.loading && !catalog.error && shown.length === 0 && <p>No items in this category yet.</p>}
    <div className="inventory-links"><Link to="/home">← Bedroom</Link><Link to="/wardrobe">Wardrobe →</Link></div>
  </section>;
}
