import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Item } from '../types';
import GameTopBar from '../components/GameTopBar';
import ItemCard from '../components/ItemCard';
import PixelButton from '../components/PixelButton';
import { usePlayer, usePlayerActions } from '../services/PlayerContext';
import { useCatalog } from '../services/useCatalog';
import { buyItem } from '../services/shop';

export default function ShopPage() {
  const player = usePlayer();
  const actions = usePlayerActions();
  const catalog = useCatalog();
  const [category, setCategory] = useState<Item['type']>('furniture');
  const [buying, setBuying] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function buy(item: Item) {
    if (!actions.beginMutation()) { setError('Another update is in progress. Please wait.'); return; }
    setBuying(item.id); setError(''); setNotice('');
    try {
      const result = await buyItem(player, item);
      actions.updatePlayer(result.player);
      setNotice(`${result.item.name} is yours!${result.demo ? ' Demo purchase — saved for this session only.' : ''}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Purchase failed.'); }
    finally { actions.endMutation(); setBuying(null); }
  }
  return <section className="inventory-page accepted-quests-page">
    <GameTopBar /><h1>SHOP</h1>
    <div className="shop-categories" aria-label="Shop categories">{(['furniture', 'garden', 'clothing'] as const).map((type) => <PixelButton key={type} aria-pressed={type === category} onClick={() => setCategory(type)}>{type === 'furniture' ? 'HOME' : type.toUpperCase()}</PixelButton>)}</div>
    {catalog.loading && <p className="loading-feedback" role="status">Loading little treasures…</p>}
    {catalog.demo && <p className="planner-notice">Demo catalog · progress lasts for this session.</p>}
    {catalog.error && <div role="alert"><p>{catalog.error}</p><PixelButton onClick={catalog.retry}>RETRY</PixelButton></div>}
    {error && <p role="alert" className="planner-error">{error}</p>}
    <p role="status" className="planner-notice">{notice}</p>
    {!catalog.loading && !catalog.error && <div className="item-grid">{catalog.items.filter((item) => item.type === category).map((item) => <ItemCard key={item.id} item={item} owned={player.ownedItems?.includes(item.id) ?? false} affordable={player.coins >= item.price} busy={buying !== null} buying={buying === item.id} onBuy={() => void buy(item)} />)}</div>}
    {!catalog.loading && !catalog.error && !catalog.items.some((item) => item.type === category) && <p>No items in this category yet.</p>}
    <div className="inventory-links"><Link to="/home">← Bedroom</Link><Link to="/wardrobe">Wardrobe →</Link></div>
  </section>;
}
