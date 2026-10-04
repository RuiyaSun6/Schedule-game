import PixelButton from './PixelButton';
import type { BuildingDefinition, BuildingStatus } from '../types/building';
import { buildingExterior, nextBuildingUpgrade } from '../data/buildingCatalog';

const STATUS_TEXT: Record<BuildingStatus, string> = {
  locked: 'LOCKED',
  available: 'AVAILABLE',
  'not-enough-coins': 'NOT ENOUGH COINS',
  stored: 'OWNED · STORED',
  placed: 'PLACED',
};

// One Building Shop card: preview, name, description, unlock level, price, status, and action.
export default function BuildingCard({ building, status, coins, busy, onBuild, onPlace, onUpgrade, level = 1 }: {
  building: BuildingDefinition;
  status: BuildingStatus;
  coins: number;
  busy: boolean;
  level?: number;
  onBuild: () => void;
  onPlace: () => void;
  onUpgrade: () => void;
}) {
  const short = building.price - coins;
  const home = building.id === 'home';
  const owned = home || status === 'stored' || status === 'placed';
  const upgrade = owned ? nextBuildingUpgrade(building.id, level) : undefined;
  return <article className={`building-card pixel-panel is-${status}`} aria-label={`${building.name}, ${STATUS_TEXT[status].toLowerCase()}`}>
    <div className="building-card-art">
      <img src={buildingExterior(building.id, level)} alt="" width={building.exteriorSize.width} height={building.exteriorSize.height} />
    </div>
    <h3>{building.name}</h3>
    <p className="building-card-meta">Building Lv.{level}</p>
    <p className="building-card-description">{building.description}</p>
    {home ? <p className="building-card-meta">Owned from the beginning</p> : !owned && <p className="building-card-meta">Unlocks at Lv. {building.requiredLevel} · {building.price} coins</p>}
    <p className="building-card-status">
      {home ? '✓ OWNED' : status === 'placed' ? '✓ PLACED' : status === 'locked' ? `🔒 Unlocks at Lv. ${building.requiredLevel}` : status === 'not-enough-coins' ? `Need ${short} more coins` : STATUS_TEXT[status]}
    </p>
    {owned ? <>
      {!home && status === 'stored' && <PixelButton disabled={busy} onClick={onPlace}>PLACE</PixelButton>}
      <div className="building-card-upgrade">
        {upgrade ? <>
          <span className="eyebrow">NEXT UPGRADE</span><h4>{upgrade.name}</h4><p>{upgrade.price} coins</p>
          {coins < upgrade.price && <p className="building-card-meta">{upgrade.price} coins required · You have {coins}</p>}
          <PixelButton disabled={busy || coins < upgrade.price} onClick={onUpgrade}>{coins < upgrade.price ? 'NOT ENOUGH COINS' : 'UPGRADE'}</PixelButton>
        </> : <PixelButton disabled>MAX LEVEL</PixelButton>}
      </div>
    </> : status === 'available' ? <PixelButton disabled={busy} onClick={onBuild}>BUILD · {building.price}</PixelButton>
      : <PixelButton disabled>{status === 'locked' ? 'LOCKED' : 'NOT ENOUGH COINS'}</PixelButton>}
  </article>;
}
