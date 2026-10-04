import './ShopCard.css';
import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
import { shopCategory } from '../data/shopAssets';

interface ItemCardProps {
  item: Item;
  owned: boolean;
  /** Wallpapers: currently on the bedroom wall. */
  equipped?: boolean;
  /** How many the player owns; stackable items show it and stay buyable. */
  count: number;
  coins: number;
  /** Another purchase is in flight; every Buy button waits. */
  busy: boolean;
  buying: boolean;
  onBuy: () => void;
  /** Owned items that can be switched from the shop (bed colours): the button equips instead of saying OWNED. */
  onEquip?: () => void;
}

// The one shop card: single sprite, name, price, ownership, and a direct Buy button.
export default function ItemCard({ item, owned, count, coins, busy, buying, onBuy, onEquip, equipped = false }: ItemCardProps) {
  const shortBy = item.price - coins;
  // Stackable items never lock as "owned": every purchase adds one more.
  const locked = owned && !item.stackable;
  // Limited stackable items (chickens): always show "Owned n/max", and lock at the limit.
  const limit = item.stackable ? item.maxQuantity : undefined;
  const full = limit !== undefined && count >= limit;
  const ownedText = limit !== undefined ? `Owned ${count}/${limit}` : `Owned: ${count}`;
  const showOwned = limit !== undefined || (item.stackable && count > 0);
  const status = locked && equipped ? '★ Equipped' : locked ? '✓ Owned' : full ? `${ownedText} · Full` : shortBy > 0 ? `Need ${shortBy} more coins` : showOwned ? ownedText : '';
  return <article className={`item-card pixel-panel ${locked ? 'item-owned' : ''}`} aria-label={item.name}>
    {shopCategory(item) === 'Pets' && <span className="item-pet-tag">PET</span>}
    <div className="item-card-art"><ItemArtwork item={item} /></div>
    <h2>{item.name}</h2>
    <p className="item-card-price">{item.price === 0 ? 'Free' : `${item.price} coins`}</p>
    <p className={`item-card-status ${locked && equipped ? 'is-equipped' : locked || full || (showOwned && shortBy <= 0) ? 'is-owned' : shortBy > 0 ? 'is-short' : ''}`}>{status}</p>
    {showOwned && !full && shortBy > 0 && <p className="item-card-status is-owned">{ownedText}</p>}
    {locked && onEquip ? <PixelButton disabled={equipped} onClick={onEquip}>{equipped ? 'EQUIPPED' : 'EQUIP'}</PixelButton>
    : <PixelButton aria-busy={buying} disabled={locked || full || shortBy > 0 || busy} onClick={onBuy}>
      {locked ? 'OWNED' : full ? 'FULL' : buying ? 'BUYING…' : shortBy > 0 ? 'NOT ENOUGH COINS' : item.stackable && count > 0 ? 'BUY ANOTHER' : 'BUY'}
    </PixelButton>}
  </article>;
}
