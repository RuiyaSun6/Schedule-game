import ItemArtwork from '../components/ItemArtwork';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import type { Item } from '../types';
import WorldDoor from '../components/WorldDoor';
import { MovableObject, MoveModeScene } from '../components/MoveModeScene';

interface HomeSceneProps {
  onOpenComputer: () => void;
  items: Item[];
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
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

export default function HomeScene({ onOpenComputer, items, editing, onEditingChange }: HomeSceneProps) {
  const room = useRoomPlacement();
  const placement = (objectId: string) => ({ position: room.positions[objectId], onPositionChange: room.setPosition });
  return (
    <MoveModeScene className="bedroom" label="A simple bedroom with a bed, desk, and computer" editing={editing} onEditingChange={onEditingChange} floorOnly>
      <div className="room-wall" aria-hidden="true" />
      <div className="room-floor" aria-hidden="true" />
      <WorldDoor className="bedroom-door" to="/world" prompt="GO OUTSIDE" />
      <MovableObject objectId="home-bed" className="room-bed" name="Bed" {...placement('home-bed')}>
        <Sprite src={beds} sheetWidth={1920} sheetHeight={784} crop={[0, 112, 32, 32]} />
        <Sprite className="bed-bedding" src={beds} sheetWidth={1920} sheetHeight={784} crop={[384, 240, 32, 32]} />
      </MovableObject>
      <MovableObject objectId="home-desk" className="room-desk" name="Desk" {...placement('home-desk')}>
        <Sprite src={tables} sheetWidth={448} sheetHeight={352} crop={[64, 48, 32, 32]} />
      </MovableObject>
      {room.placedRoomItems.map((placed) => {
        const item = items.find((entry) => entry.id === placed.variantId);
        if (!item) return null;
        return <MovableObject key={placed.instanceId} objectId={placed.instanceId} className="room-owned-item home-placed-item" name={item.name}
          {...placement(placed.instanceId)} onStore={() => room.storeItem(placed.instanceId)}>
          <ItemArtwork item={item} />
        </MovableObject>;
      })}
      <MovableObject objectId="home-computer" className="room-computer" name="Computer" {...placement('home-computer')}>
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
