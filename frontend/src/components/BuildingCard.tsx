import PixelButton from './PixelButton';
import type { BuildingDefinition, BuildingStatus } from '../types/building';

const STATUS_TEXT: Record<BuildingStatus, string> = {
  locked: 'LOCKED',
  available: 'AVAILABLE',
  'not-enough-coins': 'NOT ENOUGH COINS',
  stored: 'OWNED · STORED',
  placed: 'PLACED',
};

// One Building Shop card: preview, name, description, unlock level, price, status, and action.
export default function BuildingCard({ building, status, coins, busy, onBuild, onPlace }: {
  building: BuildingDefinition;
  status: BuildingStatus;
  coins: number;
  busy: boolean;
  onBuild: () => void;
  onPlace: () => void;
}) {
  const short = building.price - coins;
  return <article className={`building-card pixel-panel is-${status}`} aria-label={`${building.name}, ${STATUS_TEXT[status].toLowerCase()}`}>
    <div className="building-card-art">
      <img src={building.exteriorAsset} alt="" width={building.exteriorSize.width} height={building.exteriorSize.height} />
    </div>
    <h3>{building.name}</h3>
    <p className="building-card-description">{building.description}</p>
    <p className="building-card-meta">Unlocks at Lv. {building.requiredLevel} · {building.price} coins</p>
    <p className="building-card-status">
      {status === 'locked' ? `🔒 Unlocks at Lv. ${building.requiredLevel}` : status === 'not-enough-coins' ? `Need ${short} more coins` : STATUS_TEXT[status]}
    </p>
    {status === 'stored' ? <PixelButton disabled={busy} onClick={onPlace}>PLACE</PixelButton>
      : status === 'available' ? <PixelButton disabled={busy} onClick={onBuild}>BUILD · {building.price}</PixelButton>
      : <PixelButton disabled>{status === 'placed' ? 'PLACED' : status === 'locked' ? 'LOCKED' : 'NOT ENOUGH COINS'}</PixelButton>}
  </article>;
}
