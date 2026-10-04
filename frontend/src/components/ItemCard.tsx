import './ShopCard.css';
import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
import { shopCategory } from '../data/shopAssets';

interface ItemCardProps {
  item: Item;
  owned: boolean;
  coins: number;
  /** Another purchase is in flight; every Buy button waits. */
  busy: boolean;
  buying: boolean;
  onBuy: () => void;
}

// The one shop card: single sprite, name, price, ownership, and a direct Buy button.
export default function ItemCard({ item, owned, coins, busy, buying, onBuy }: ItemCardProps) {
  const shortBy = item.price - coins;
  const status = owned ? '✓ Owned' : shortBy > 0 ? `Need ${shortBy} more coins` : '';
  return <article className={`item-card pixel-panel ${owned ? 'item-owned' : ''}`} aria-label={item.name}>
    {shopCategory(item) === 'Pets' && <span className="item-pet-tag">PET</span>}
    <div className="item-card-art"><ItemArtwork item={item} /></div>
    <h2>{item.name}</h2>
    <p className="item-card-price">{item.price} coins</p>
    <p className={`item-card-status ${owned ? 'is-owned' : shortBy > 0 ? 'is-short' : ''}`}>{status}</p>
    <PixelButton aria-busy={buying} disabled={owned || shortBy > 0 || busy} onClick={onBuy}>
      {owned ? 'OWNED' : buying ? 'BUYING…' : shortBy > 0 ? 'NOT ENOUGH COINS' : 'BUY'}
    </PixelButton>
  </article>;
}
