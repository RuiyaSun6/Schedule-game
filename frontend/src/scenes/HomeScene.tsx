import ItemArtwork from '../components/ItemArtwork';
import { getCatalogItem, mockItems } from '../services/shop';
import { usePlayer } from '../services/PlayerContext';
import WorldDoor from '../components/WorldDoor';

interface HomeSceneProps {
  onOpenComputer: () => void;
}

// Source rectangles use the pack's original 16px grid. Public URLs keep the
// imported pack intact; SVG viewports crop sprites without resampling them.
const pack = `${import.meta.env.BASE_URL}assets/interior%20full/`;
const beds = `${pack}furniture/beds.png`;
const tables = `${pack}furniture/tables.png`;
const decorations = `${pack}furniture/decorations.png`;

interface SpriteProps {
  src: string;
  sheetWidth: number;
  sheetHeight: number;
  crop: [number, number, number, number];
  className?: string;
}

function Sprite({ src, sheetWidth, sheetHeight, crop, className }: SpriteProps) {
  return <svg className={`asset-sprite ${className ?? ''}`} viewBox={crop.join(' ')} aria-hidden="true">
    <image href={src} width={sheetWidth} height={sheetHeight} />
  </svg>;
}

export default function HomeScene({ onOpenComputer }: HomeSceneProps) {
  const player = usePlayer();
  return (
    <div className="bedroom" aria-label="A simple bedroom with a bed, desk, and computer">
      <div className="room-wall" aria-hidden="true" />
      <div className="room-floor" aria-hidden="true" />
      <WorldDoor className="bedroom-door" to="/world" prompt="GO OUTSIDE" />
      <div className="room-bed" aria-hidden="true">
        <Sprite src={beds} sheetWidth={1920} sheetHeight={784} crop={[0, 112, 32, 32]} />
        <Sprite className="bed-bedding" src={beds} sheetWidth={1920} sheetHeight={784} crop={[384, 240, 32, 32]} />
      </div>
      <Sprite className="room-desk" src={tables} sheetWidth={448} sheetHeight={352} crop={[64, 48, 32, 32]} />
      {mockItems.filter((item) => item.type === 'furniture' && player.ownedItems?.includes(item.id)).map((item) =>
        <div key={item.id} className={`room-owned-item slot-${item.id}`}><ItemArtwork item={getCatalogItem(item.id) ?? item} /></div>)}
      <button className="room-computer" onClick={onOpenComputer} aria-label="Open computer">
        <span className="computer-prompt">OPEN ME!</span>
        <Sprite src={decorations} sheetWidth={960} sheetHeight={624} crop={[544, 0, 16, 16]} />
      </button>
    </div>
  );
}
