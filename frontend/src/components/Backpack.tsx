import type { Item } from '../types';
import ItemArtwork from './ItemArtwork';
import PixelButton from './PixelButton';
import { usePlayer } from '../services/PlayerContext';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import { availableCopies, fitsLocation, furnitureState } from '../services/furnitureLocation';
import { itemFamily, ownedCount } from '../data/shopAssets';
import { getBuilding } from '../data/buildingCatalog';
import { isWallpaper } from '../data/shopAssets';
import { isAnimal } from '../data/animals';
import { isElectronics } from './RoomTV';
import { isBedColor } from './BedColors';
import { WallpaperPicker } from './Wallpaper';
import type { LocationId } from '../types/building';

// The one furniture Backpack, shared by Home and every building. Ownership is global:
// a regular item placed somewhere is not in the Backpack until it is stored again; stackable
// items (farm) list how many copies are still unplaced.
export default function Backpack({ items, loading, error, onRetry, locationId, onPlace }: {
  items: Item[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  /** Where PLACE puts an item (the room or building the Backpack was opened in). */
  locationId: LocationId;
  onPlace: (item: Item) => void;
}) {
  const player = usePlayer();
  const room = useRoomPlacement();
  const owned = items.filter((item) => item.type !== 'clothing' && !isWallpaper(item.id) && !isAnimal(item.id) && !isElectronics(item.id) && !isBedColor(item.id) && player.ownedItems?.includes(item.id));
  const listed = owned.filter((item) => item.stackable || furnitureState(item.id, player.ownedItems, room).kind === 'backpack');
  const here = locationId === 'home-upstairs' ? 'Home second floor' : getBuilding(locationId)?.name ?? 'here';
  return <div className="backpack-view">
    <h2 id="backpack-title">BACKPACK</h2>
    <p>Everything you own but haven’t placed. Place an item here in the {here}, or store furniture with MOVE OBJECTS to bring it back.</p>
    {locationId === 'home' && !loading && !error && <WallpaperPicker items={items} />}
    {loading && <p role="status">Opening your backpack…</p>}
    {error && <div role="alert"><p>{error}</p><PixelButton onClick={onRetry}>RETRY CATALOG</PixelButton></div>}
    {!loading && !error && listed.length === 0 && <p>Nothing stored right now. Visit the Shop, or store something with MOVE OBJECTS.</p>}
    <div className="item-grid">{listed.map((item) => {
      const fits = fitsLocation(item.id, locationId);
      const total = ownedCount(player, item.id);
      const available = item.stackable ? availableCopies(item.id, total, room) : 1;
      return <article className="item-card pixel-panel" key={item.id}>
        <div className="item-card-art"><ItemArtwork item={item} /></div><h3>{item.name}</h3>
        {item.stackable && <p className="backpack-count">Available {available} · Owned {total}</p>}
        <p>{itemFamily(item.id) === 'world-decoration' ? 'Displayed in your World' : !fits ? `Doesn’t fit in the ${here}` : available < 1 ? 'All placed' : `Ready to place in the ${here}`}</p>
        <PixelButton disabled={!fits || available < 1} onClick={() => onPlace(item)}>PLACE HERE</PixelButton>
      </article>;
    })}</div>
    <small>Starter furniture and the pet corner always stay home. Farm items only fit on the Farm. Use MOVE OBJECTS to rearrange.</small>
  </div>;
}
