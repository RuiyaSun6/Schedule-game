import { useState } from 'react';
import { Link } from 'react-router-dom';
import { shopProducts, shopCategory } from '../data/shopAssets';
import { useDemoShop } from '../services/DemoShopContext';
import GameTopBar from '../components/GameTopBar';
import ItemArtwork from '../components/ItemArtwork';
import PixelButton from '../components/PixelButton';
import ShopProductDetail, { type DisplayProduct } from '../components/ShopProductDetail';
import { useCatalog } from '../services/useCatalog';

export default function ShopPage() {
  const catalog = useCatalog();
  const demo = useDemoShop();
  const [mode, setMode] = useState<'shop' | 'demo'>('shop');
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const products: DisplayProduct[] = mode === 'demo' ? shopProducts : catalog.items.map((item) => ({ id: item.id, name: item.name, category: shopCategory(item), styles: [{ id: 'standard', name: 'Standard', variants: [item] }] }));
  const categories = [...new Set(products.map((product) => product.category))];
  const selected = products.find((product) => product.id === selectedId);
  function changeMode(next: 'shop' | 'demo') { setMode(next); setCategory('All'); setSelectedId(null); }
  return <section className="inventory-page accepted-quests-page">
    <GameTopBar /><h1>SHOP</h1>
    <div className="shop-mode" aria-label="Shop mode">
      <PixelButton aria-pressed={mode === 'shop'} onClick={() => changeMode('shop')}>SHOP</PixelButton>
      <PixelButton aria-pressed={mode === 'demo'} onClick={() => changeMode('demo')}>FURNITURE DEMO</PixelButton>
    </div>
    {mode === 'demo' && <p className="planner-notice">Local furniture demo · {demo.coins} demo coins. Multiple copies stay on this device and use a separate balance from player coins.</p>}
    {mode === 'shop' && catalog.loading && <p className="loading-feedback" role="status">Loading little treasures…</p>}
    {mode === 'shop' && catalog.demo && <p className="planner-notice">Offline catalog preview · purchases require the backend. Furniture Demo supports local purchases.</p>}
    {mode === 'shop' && catalog.error && <div role="alert"><p>{catalog.error}</p><PixelButton onClick={catalog.retry}>RETRY</PixelButton></div>}
    {selected ? <ShopProductDetail key={`${mode}-${selected.id}`} product={selected} demoMode={mode === 'demo'} onBack={() => setSelectedId(null)} /> : <>
      <div className="shop-categories" aria-label="Furniture categories">{['All', ...categories].map((name) => <PixelButton key={name} aria-pressed={name === category} onClick={() => setCategory(name)}>{name.toUpperCase()}</PixelButton>)}</div>
      {(mode === 'demo' || (!catalog.loading && !catalog.error)) && <div className="item-grid shop-item-grid" tabIndex={0} aria-label="Product families">
        {products.filter((product) => category === 'All' || product.category === category).map((product) => <article className="item-card pixel-panel" key={product.id}>
          <ItemArtwork item={product.styles[0].variants[0]} /><h2>{product.name}</h2>
          <p>{product.styles.length} {product.styles.length === 1 ? 'style' : 'styles'} · {product.styles.reduce((count, style) => count + style.variants.length, 0)} variants</p>
          <PixelButton onClick={() => setSelectedId(product.id)}>EXPLORE</PixelButton>
        </article>)}
      </div>}
    </>}
    <div className="inventory-links"><Link to="/home">← Bedroom</Link><Link to="/wardrobe">Wardrobe →</Link></div>
  </section>;
}
