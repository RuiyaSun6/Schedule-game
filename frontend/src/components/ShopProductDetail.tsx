import { useState } from 'react';
import type { Item } from '../types';
import { getFurnitureVariant } from '../data/shopAssets';
import { useDemoShop } from '../services/DemoShopContext';
import { usePlayer, usePlayerActions } from '../services/PlayerContext';
import { buyItem } from '../services/shop';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
export interface DisplayProduct { id: string; name: string; category: string; styles: { id: string; name: string; variants: Item[] }[]; }
export default function ShopProductDetail({ product, demoMode, onBack }: { product: DisplayProduct; demoMode: boolean; onBack: () => void }) {
  const player = usePlayer();
  const actions = usePlayerActions();
  const demo = useDemoShop();
  const [styleId, setStyleId] = useState(product.styles[0].id);
  const selectedStyle = product.styles.find((style) => style.id === styleId) ?? product.styles[0];
  const [variantId, setVariantId] = useState(selectedStyle.variants[0].id);
  const variant = selectedStyle.variants.find((entry) => entry.id === variantId) ?? selectedStyle.variants[0];
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const count = demoMode ? demo.quantities[variant.id] ?? 0 : player.ownedItems?.includes(variant.id) ? 1 : 0;
  const balance = demoMode ? demo.coins : player.coins;
  const total = variant.price * quantity;
  const insufficient = balance < total;
  async function purchase() {
    setError(''); setNotice('');
    if (insufficient) { setError('Not enough coins'); return; }
    if (demoMode) {
      const reason = demo.buy(variant.id, quantity);
      if (reason) setError(reason);
      else setNotice(`${quantity} × ${variant.name} added to Backpack.`);
      return;
    }
    if (count > 0 || busy) return;
    if (!actions.beginMutation()) { setError('Another update is in progress. Please wait.'); return; }
    setBusy(true);
    try {
      const result = await buyItem(player, variant);
      actions.updatePlayer(result.player);
      setNotice(`${result.item.name} added to Backpack.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Purchase failed.'); }
    finally { actions.endMutation(); setBusy(false); }
  }
  return <section className="shop-product-detail pixel-panel" aria-label={`${product.name} options`}>
    <button type="button" className="shop-back" onClick={onBack}>← Product families</button>
    <h2>{product.name}</h2>
    <div className="shop-product-preview"><ItemArtwork key={variant.id} item={variant} /></div>
    <fieldset disabled={busy}><legend>Style</legend>
      <div className="shop-option-list">{product.styles.map((style) => <button key={style.id} type="button" aria-pressed={style.id === selectedStyle.id}
        onClick={() => { setStyleId(style.id); setVariantId(style.variants[0].id); setError(''); setNotice(''); }}>{style.name}</button>)}</div>
    </fieldset>
    <fieldset disabled={busy}><legend>Color / variant</legend>
      <div className="shop-option-list">{selectedStyle.variants.map((item) => <button key={item.id} type="button" aria-pressed={item.id === variant.id}
        onClick={() => { setVariantId(item.id); setError(''); setNotice(''); }}>{getFurnitureVariant(item.id)?.color ?? getFurnitureVariant(item.id)?.variant ?? item.name}</button>)}</div>
    </fieldset>
    <p>{variant.name}</p><p>Owned: {count}</p>
    {demoMode ? <div className="shop-quantity"><span id="quantity-label">Quantity</span>
      <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
      <input type="number" min="1" max="10" step="1" aria-labelledby="quantity-label" value={quantity}
        onChange={(event) => setQuantity(Math.max(1, Math.min(10, Math.floor(Number(event.target.value) || 1))))} />
      <button type="button" aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))}>+</button>
    </div> : <p className="shop-purchase-note">Live purchases support one copy per item. Multiple copies are available in Furniture Demo.</p>}
    <p>Each: {variant.price} {demoMode ? 'demo coins' : 'coins'} · Total: {total}</p>
    {insufficient && <p className="shop-insufficient" role="status">Not enough coins</p>}
    <PixelButton disabled={busy || insufficient || (!demoMode && count > 0)} aria-busy={busy} onClick={() => void purchase()}>
      {busy ? 'BUYING…' : !demoMode && count > 0 ? 'OWNED' : count > 0 ? 'BUY MORE' : demoMode ? 'BUY DEMO' : 'BUY'}
    </PixelButton>
    {error && <p className="planner-error" role="alert">{error}</p>}
    <p className="planner-notice" role="status">{notice}</p>
  </section>;
}
