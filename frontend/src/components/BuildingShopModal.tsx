import { useState } from 'react';
import PixelModal from './PixelModal';
import BuildingCard from './BuildingCard';
import { SHOP_BUILDINGS } from '../data/buildingCatalog';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import { usePlayer } from '../services/PlayerContext';
import type { BuildingId } from '../types/building';

// Buys whole buildings (the Furniture Shop on /shop sells furniture; the two never mix).
// BUILD charges the price and hands the building to placement mode; PLACE re-places a stored one.
export default function BuildingShopModal({ open, onClose, onStartPlacing }: { open: boolean; onClose: () => void; onStartPlacing: (id: BuildingId) => void }) {
  const player = usePlayer();
  const buildings = useWorldBuildings();
  const [error, setError] = useState('');
  const stored = SHOP_BUILDINGS.filter((b) => buildings.status(b.id) === 'stored');
  const placed = SHOP_BUILDINGS.filter((b) => buildings.status(b.id) === 'placed');

  function build(id: BuildingId) {
    try {
      buildings.buy(id);
      setError('');
      onStartPlacing(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Couldn’t build this. Please try again.');
    }
  }
  return <PixelModal open={open} onClose={() => { setError(''); onClose(); }} titleId="building-shop-title">
    <div className="building-shop">
      <span className="eyebrow">GROW YOUR LITTLE TOWN</span>
      <h2 id="building-shop-title">BUILDING SHOP</h2>
      <p>Buy a building, choose where it goes, then step inside to decorate it.</p>
      <p className="building-inventory" aria-label="Building inventory">
        <strong>Your buildings:</strong> Home{placed.map((b) => `, ${b.name}`).join('')}
        {stored.length > 0 && <> · <strong>Stored:</strong> {stored.map((b) => b.name).join(', ')}</>}
      </p>
      {error && <p role="alert" className="shop-feedback is-error">{error}</p>}
      <div className="building-grid">
        {SHOP_BUILDINGS.map((building) => <BuildingCard key={building.id} building={building} status={buildings.status(building.id)}
          coins={player.coins} busy={false} onBuild={() => build(building.id)} onPlace={() => onStartPlacing(building.id)} />)}
      </div>
    </div>
  </PixelModal>;
}
