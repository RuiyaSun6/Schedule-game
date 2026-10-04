import './ShopCard.css';
import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
import { shopCategory } from '../data/shopAssets';

interface ItemCardProps {
  item: Item;
  owned: boolean;
  /** How many the player owns; stackable items show it and stay buyable. */
  count: number;
  coins: number;
  /** Another purchase is in flight; every Buy button waits. */
  busy: boolean;
  buying: boolean;
  onBuy: () => void;
}

// The one shop card: single sprite, name, price, ownership, and a direct Buy button.
export default function ItemCard({ item, owned, count, coins, busy, buying, onBuy }: ItemCardProps) {
  const shortBy = item.price - coins;
  // Stackable items never lock as "owned": every purchase adds one more.
  const locked = owned && !item.stackable;
  const status = locked ? '✓ Owned' : shortBy > 0 ? `Need ${shortBy} more coins` : item.stackable && count > 0 ? `Owned: ${count}` : '';
  return <article className={`item-card pixel-panel ${locked ? 'item-owned' : ''}`} aria-label={item.name}>
    {shopCategory(item) === 'Pets' && <span className="item-pet-tag">PET</span>}
    <div className="item-card-art"><ItemArtwork item={item} /></div>
    <h2>{item.name}</h2>
    <p className="item-card-price">{item.price} coins</p>
    <p className={`item-card-status ${locked || (item.stackable && count > 0) ? 'is-owned' : shortBy > 0 ? 'is-short' : ''}`}>{status}</p>
    {item.stackable && count > 0 && shortBy > 0 && <p className="item-card-status is-owned">Owned: {count}</p>}
    <PixelButton aria-busy={buying} disabled={locked || shortBy > 0 || busy} onClick={onBuy}>
      {locked ? 'OWNED' : buying ? 'BUYING…' : shortBy > 0 ? 'NOT ENOUGH COINS' : item.stackable && count > 0 ? 'BUY ANOTHER' : 'BUY'}
    </PixelButton>
  </article>;
}
