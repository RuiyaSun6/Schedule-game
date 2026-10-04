import { useState } from 'react';
import PixelModal from './PixelModal';
import BuildingCard from './BuildingCard';
import { BUILDINGS, SHOP_BUILDINGS, getBuilding } from '../data/buildingCatalog';
import BuildingUpgradeModal from './BuildingUpgradeModal';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import { usePlayer } from '../services/PlayerContext';
import type { BuildingId } from '../types/building';

// Buys whole buildings (the Furniture Shop on /shop sells furniture; the two never mix).
// BUILD hands a purchase to placement mode; PLACE re-places a stored one; UPGRADE keeps the shop open.
export default function BuildingShopModal({ open, onClose, onStartPlacing }: { open: boolean; onClose: () => void; onStartPlacing: (id: BuildingId) => void }) {
  const player = usePlayer();
  const buildings = useWorldBuildings();
  const [error, setError] = useState('');
  const [upgradeId, setUpgradeId] = useState<BuildingId | null>(null);
  const [notice, setNotice] = useState('');
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
  return <><PixelModal open={open} onClose={() => { setError(''); setNotice(''); setUpgradeId(null); onClose(); }} titleId="building-shop-title">
    <div className="building-shop">
      <span className="eyebrow">GROW YOUR LITTLE TOWN</span>
      <h2 id="building-shop-title">BUILDING SHOP</h2>
      <p>Buy, place, and upgrade your buildings. Step inside to decorate them.</p>
      <p className="building-inventory" role="status">You have: <strong>{player.coins} coins</strong></p>
      <p className="building-inventory" aria-label="Building inventory">
        <strong>Your buildings:</strong> Home{placed.map((b) => `, ${b.name}`).join('')}
        {stored.length > 0 && <> · <strong>Stored:</strong> {stored.map((b) => b.name).join(', ')}</>}
      </p>
      {error && <p role="alert" className="shop-feedback is-error">{error}</p>}
      {notice && <p role="status" className="shop-feedback is-success">{notice}</p>}
      <div className="building-grid">
        {BUILDINGS.map((building) => <BuildingCard key={building.id} building={building} status={building.id === 'home' ? 'placed' : buildings.status(building.id)}
          coins={player.coins} busy={false} level={buildings.level(building.id)} onBuild={() => build(building.id)} onPlace={() => onStartPlacing(building.id)}
          onUpgrade={() => { setNotice(''); setUpgradeId(building.id); }} />)}
      </div>
    </div>
  </PixelModal>
    {open && upgradeId && <BuildingUpgradeModal key={upgradeId} id={upgradeId} open onClose={() => setUpgradeId(null)} onUpgraded={() => {
      setNotice(`${getBuilding(upgradeId)!.name} is now Lv.${buildings.level(upgradeId)}!`);
      setUpgradeId(null);
    }} />}
  </>;
}
