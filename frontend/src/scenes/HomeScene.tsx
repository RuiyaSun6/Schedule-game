import ItemArtwork from '../components/ItemArtwork';
import { getCatalogItem, mockItems } from '../services/shop';
import { usePlayer } from '../services/PlayerContext';
import WorldDoor from '../components/WorldDoor';
import { MovableObject, MoveModeScene } from '../components/MoveModeScene';

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
    <MoveModeScene className="bedroom" label="A simple bedroom with a bed, desk, and computer">
      <div className="room-wall" aria-hidden="true" />
      <div className="room-floor" aria-hidden="true" />
      <WorldDoor className="bedroom-door" to="/world" prompt="GO OUTSIDE" />
      <MovableObject objectId="home-bed" className="room-bed">
        <Sprite src={beds} sheetWidth={1920} sheetHeight={784} crop={[0, 112, 32, 32]} />
        <Sprite className="bed-bedding" src={beds} sheetWidth={1920} sheetHeight={784} crop={[384, 240, 32, 32]} />
      </MovableObject>
      <MovableObject objectId="home-desk" className="room-desk">
        <Sprite src={tables} sheetWidth={448} sheetHeight={352} crop={[64, 48, 32, 32]} />
      </MovableObject>
      {mockItems.filter((item) => item.type === 'furniture' && player.ownedItems?.includes(item.id)).map((item) =>
        <MovableObject key={item.id} objectId={`home-${item.id}`} className={`room-owned-item slot-${item.id}`}>
          <ItemArtwork item={getCatalogItem(item.id) ?? item} />
        </MovableObject>)}
      <MovableObject objectId="home-computer" className="room-computer">
        {(moveMode) => <button className="room-computer-button" type="button"
          onClick={() => { if (!moveMode) onOpenComputer(); }}
          aria-label={moveMode ? 'Drag computer' : 'Open computer'}>
          <span className="computer-prompt">OPEN ME!</span>
          <Sprite src={decorations} sheetWidth={960} sheetHeight={624} crop={[544, 0, 16, 16]} />
        </button>}
      </MovableObject>
    </MoveModeScene>
  );
}
