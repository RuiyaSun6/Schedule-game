import ItemArtwork from '../components/ItemArtwork';
import PetCorner from '../components/PetCorner';
import PetBird, { PET_BIRD_ID } from '../components/PetBird';
import RoomTV, { TV_ITEMS } from '../components/RoomTV';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import { usePlayer } from '../services/PlayerContext';
import { HOME_SLOTS, latestOwned } from '../data/shopAssets';
import { furnitureState } from '../services/furnitureLocation';
import PlacedFurnitureLayer from '../components/PlacedFurnitureLayer';
import { wallpaperStyle } from '../components/Wallpaper';
import type { Item } from '../types';
import './RoomSlots.css';
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
  const player = usePlayer();
  const placement = (objectId: string) => ({ position: room.positions[objectId], onPositionChange: room.setPosition });
  return (
    <MoveModeScene className="bedroom" label="A simple bedroom with a bed, desk, and computer" editing={editing} onEditingChange={onEditingChange} floorOnly>
      {/* The equipped wallpaper tiles across the wall at the room's pixel scale. */}
      <div className="room-wall" aria-hidden="true" style={wallpaperStyle(room.wallpaper, 'var(--room-scale)')} />
      <div className="room-floor" aria-hidden="true" />
      <WorldDoor className="bedroom-door" to="/world" prompt="GO OUTSIDE" tutorialTarget="world" />
      <MovableObject objectId="home-bed" className="room-bed" name="Bed" {...placement('home-bed')}>
        <Sprite src={beds} sheetWidth={1920} sheetHeight={784} crop={[0, 112, 32, 32]} />
        <Sprite className="bed-bedding" src={beds} sheetWidth={1920} sheetHeight={784} crop={[384, 240, 32, 32]} />
      </MovableObject>
      <MovableObject objectId="home-desk" className="room-desk" name="Desk" {...placement('home-desk')}>
        <Sprite src={tables} sheetWidth={448} sheetHeight={352} crop={[64, 48, 32, 32]} />
      </MovableObject>
      {/* One fixed slot per kind of furniture, showing the newest variant bought, unless the player
          moved it to another building or stored it. */}
      {HOME_SLOTS.map((family) => {
        const id = latestOwned(player.ownedItems, family);
        if (!id || furnitureState(id, player.ownedItems, room).kind !== 'home-slot') return null;
        const item = items.find((entry) => entry.id === id) ?? { id, name: id, type: 'furniture' as const, price: 0, asset: '' };
        return <MovableObject key={family} objectId={`home-slot-${family}`} className={`room-owned-item room-slot room-slot-${family}`} name={item.name}
          {...placement(`home-slot-${family}`)} onStore={() => room.storeItem(id)}>
          <ItemArtwork item={item} fit={null} />
        </MovableObject>;
      })}
      <PlacedFurnitureLayer locationId="home" items={items} />
      <MovableObject objectId="home-pet-corner" className="room-owned-item room-slot pet-corner-slot" name="Pet corner" {...placement('home-pet-corner')}>
        <PetCorner />
      </MovableObject>
      {/* The pet bird, once bought: its own movable spot, like the pet corner. */}
      {player.ownedItems?.includes(PET_BIRD_ID) && <MovableObject objectId="home-pet-bird" className="room-owned-item room-slot pet-bird-slot" name="Bird" {...placement('home-pet-bird')}>
        {(moveMode) => <PetBird moveMode={moveMode} />}
      </MovableObject>}
      {/* TVs (Electronics), once bought: each has its own movable spot in the bedroom. */}
      {Object.keys(TV_ITEMS).filter((id) => player.ownedItems?.includes(id)).map((id) => <MovableObject key={id} objectId={`home-${id}`} className={`room-owned-item room-slot room-tv-slot room-tv-slot-${id}`} name={TV_ITEMS[id]!.name} {...placement(`home-${id}`)}>
        {(moveMode) => <RoomTV itemId={id} moveMode={moveMode} />}
      </MovableObject>)}
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
