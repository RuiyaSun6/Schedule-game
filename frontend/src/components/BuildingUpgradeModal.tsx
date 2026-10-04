import { useState } from 'react';
import PixelModal from './PixelModal';
import PixelButton from './PixelButton';
import { getBuilding, nextBuildingUpgrade } from '../data/buildingCatalog';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import { usePlayer } from '../services/PlayerContext';
import type { BuildingId } from '../types/building';
import './BuildingUpgrades.css';

export default function BuildingUpgradeModal({ id, open, onClose, onUpgraded }: { id: BuildingId; open: boolean; onClose: () => void; onUpgraded: () => void }) {
  const player = usePlayer();
  const buildings = useWorldBuildings();
  const [error, setError] = useState('');
  const level = buildings.level(id);
  const building = getBuilding(id)!;
  const next = nextBuildingUpgrade(id, level);
  const affordable = next && player.coins >= next.price;
  function upgrade() {
    try { buildings.upgrade(id, level); setError(''); onUpgraded(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not upgrade.'); }
  }
  return <PixelModal open={open} onClose={onClose} titleId="building-upgrade-title" className="building-upgrade-modal">
    <div className="building-upgrade-view">
      <h2 id="building-upgrade-title">UPGRADE {building.name.toUpperCase()}?</h2>
      <p>Current: {building.name} Lv.{level}</p>
      {next ? <>
        <h3>{next.name.toUpperCase()}</h3><p>{next.description}</p>
        <p>Cost: <strong>{next.price} coins</strong><br />You have: <strong>{player.coins} coins</strong></p>
        {!affordable && <p>Need {next.price - player.coins} more coins.</p>}
        <div className="building-upgrade-confirm-actions">
          <button type="button" className="placement-later" onClick={onClose}>CANCEL</button>
          <PixelButton disabled={!affordable} onClick={upgrade}>{affordable ? 'UPGRADE' : 'NOT ENOUGH COINS'}</PixelButton>
        </div>
      </> : <p className="building-max-level">MAX LEVEL · More upgrades coming soon.</p>}
      {error && <p role="alert">{error}</p>}
      <small>Building progress is saved on this device, using the existing shared Coins balance.</small>
    </div>
  </PixelModal>;
}
