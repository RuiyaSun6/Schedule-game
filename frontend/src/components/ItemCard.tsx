import { getFurnitureVariant } from '../data/shopAssets';
import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';

export default function ItemCard({ item, owned, affordable, busy, buying, onBuy }: { item: Item; owned: boolean; affordable: boolean; busy: boolean; buying: boolean; onBuy: () => void }) {
  return <article className={`item-card pixel-panel ${owned ? 'item-owned' : ''}`}>
    <ItemArtwork item={item} /><h2>{item.name}</h2><p>{item.price} {getFurnitureVariant(item.id) ? 'demo coins' : 'coins'}</p>
    <PixelButton aria-busy={buying} disabled={owned || !affordable || busy} onClick={onBuy}>{owned ? 'OWNED' : buying ? 'BUYING…' : !affordable ? 'NEED MORE COINS' : getFurnitureVariant(item.id) ? 'BUY DEMO' : 'BUY'}</PixelButton>
  </article>;
}
