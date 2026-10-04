import { Link } from 'react-router-dom';
import GameTopBar from '../components/GameTopBar';
import PlayerAvatar from '../components/PlayerAvatar';
import ItemArtwork from '../components/ItemArtwork';
import AreaAccessNotice from '../components/AreaAccessNotice';
import { usePlayer } from '../services/PlayerContext';
import { useAreas } from '../services/AreaContext';
import { worldAreas } from '../services/worldAreas';
import { getAreaStatus } from '../types/world';
import { useCatalog } from '../services/useCatalog';
import { mockItems } from '../services/shop';
import { MovableObject, MoveModeScene } from '../components/MoveModeScene';

function GardenScene() {
  const player = usePlayer();
  const catalog = useCatalog();
  const supported = ['flowers', 'tree', 'bench', 'fountain'];
  const items = (catalog.items.length ? catalog.items : mockItems).filter((item) => item.type === 'garden' && supported.includes(item.id) && player.ownedItems?.includes(item.id));
  return <section className="home-game garden-game" aria-label="Your Garden">
    <MoveModeScene className="garden-stage" label="Garden decorations">
      <div className="garden-soil" aria-hidden="true" />
      {items.map((item) => <MovableObject key={item.id} objectId={`garden-${item.id}`} className={`garden-item garden-slot-${item.id}`}>
        <ItemArtwork item={item} /><span>{item.name}</span>
      </MovableObject>)}
      <div className="garden-player"><PlayerAvatar /></div>
    </MoveModeScene>
    <GameTopBar />
    <div className="room-caption"><span>GARDEN · A QUIET PLACE TO GROW</span>
      <p>Your own little patch of possibility.</p>
      <div className="room-inventory-links"><Link to="/world">← Outside</Link><Link to="/shop">Visit Shop →</Link></div>
      {catalog.error && <p role="status">Item art is unavailable. Showing starter placeholders.</p>}
    </div>
  </section>;
}

export default function GardenPage() {
  const player = usePlayer();
  const { builtAreas } = useAreas();
  const garden = worldAreas.find((area) => area.id === 'garden')!;
  const status = getAreaStatus(garden, player.level, builtAreas);
  return status === 'built' ? <GardenScene /> : <AreaAccessNotice name="Garden" requiredLevel={2} locked={status === 'locked'} />;
}
