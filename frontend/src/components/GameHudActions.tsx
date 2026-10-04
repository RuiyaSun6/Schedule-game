import { useEffect, useState } from 'react';
import ShopPage from '../pages/ShopPage';
import PixelModal from './PixelModal';
import BuildingShopButton from './BuildingShopButton';
import './GameHudActions.css';

/** Shared scene shortcuts. Inventory and purchases stay in the existing app providers. */
export default function GameHudActions({ onOpenBackpack, onOpenBuildings, onReturnHome, tutorialActive = false }: {
  onOpenBackpack?: () => void;
  onOpenBuildings?: () => void;
  onReturnHome?: () => void;
  tutorialActive?: boolean;
}) {
  const [shopOpen, setShopOpen] = useState(false);
  useEffect(() => { if (tutorialActive) setShopOpen(false); }, [tutorialActive]);
  return <>
    <div className={`game-hud-actions${onOpenBackpack || onOpenBuildings ? ' with-secondary' : ''}`} role="group" aria-label={onReturnHome ? 'World controls and shops' : 'Game shops and inventory'}>
      <button type="button" className="home-shop-shortcut pixel-panel" onClick={() => setShopOpen(true)}
        aria-label="Open Furniture Shop" title="Furniture Shop" data-tutorial="furniture-shop">
        <svg viewBox="40 28 16 16" width="32" height="32" aria-hidden="true" className="asset-sprite">
          <image href={`${import.meta.env.BASE_URL}assets/interior%20full/furniture/boxes.png`} width="448" height="112" />
        </svg>
      </button>
      {onOpenBackpack && <button type="button" className="home-backpack-shortcut pixel-panel" onClick={onOpenBackpack} aria-label="Open Backpack" title="Backpack" data-tutorial="backpack">
        <svg width="30" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
          <path fill="#75624c" d="M5 1h6v3h2v2h1v9H2V6h1V4h2z" />
          <path fill="#fff8e5" d="M6 2h4v2H6z" />
          <path fill="#9caf84" d="M4 5h8v8H4z" />
          <path fill="#637c4e" d="M5 9h6v4H5z" />
          <path fill="#edcd74" d="M7 8h2v2H7z" />
        </svg>
      </button>}
      {onOpenBuildings && <BuildingShopButton onClick={onOpenBuildings} />}
      {onReturnHome && <button type="button" className="world-home-button pixel-panel" onClick={onReturnHome}
        aria-label="Return to Home" title="Return to Home" data-tutorial="return-home">
        <svg width="28" height="28" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
          <path fill="#6b4a33" d="M7 1h2v1h2v2h2v2h2v2h-2v7H3V8H1V6h2V4h2V2h2z" />
          <path fill="#b75b47" d="M7 2h2v1h2v2h2v2H3V5h2V3h2z" />
          <path fill="#f1dfbf" d="M4 8h8v6H4z" />
          <path fill="#78533a" d="M7 10h2v4H7z" />
          <path fill="#bfe0e8" d="M5 9h1v2H5zM10 9h1v2h-1z" />
        </svg>
      </button>}
    </div>
    <PixelModal open={shopOpen} onClose={() => setShopOpen(false)} titleId="furniture-shop-title">
      {shopOpen && <ShopPage embedded />}
    </PixelModal>
  </>;
}
