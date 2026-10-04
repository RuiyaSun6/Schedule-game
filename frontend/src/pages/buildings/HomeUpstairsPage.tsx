import { useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import GameTopBar from '../../components/GameTopBar';
import GameHudActions from '../../components/GameHudActions';
import PixelModal from '../../components/PixelModal';
import Backpack from '../../components/Backpack';
import PlacedFurnitureLayer from '../../components/PlacedFurnitureLayer';
import WorldDoor from '../../components/WorldDoor';
import { MoveModeScene } from '../../components/MoveModeScene';
import { useCatalog } from '../../services/useCatalog';
import { useRoomPlacement } from '../../services/RoomPlacementContext';
import { defaultFurnitureSpot } from '../../services/furnitureLocation';
import { useWorldBuildings } from '../../hooks/useWorldBuildings';
import type { Item } from '../../types';
import './BuildingInteriorPage.css';
import '../../components/BuildingUpgrades.css';

/** An empty additional Home room; all ownership stays in the shared Backpack. */
export default function HomeUpstairsPage() {
  const buildings = useWorldBuildings();
  const catalog = useCatalog();
  const room = useRoomPlacement();
  const sceneRef = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const [backpackOpen, setBackpackOpen] = useState(false);
  if (buildings.level('home') < 2) return <Navigate to="/home" replace />;
  function place(item: Item) {
    const spot = defaultFurnitureSpot({ width: sceneRef.current?.clientWidth ?? 360, height: sceneRef.current?.clientHeight ?? 600 }, room.placed.filter((p) => p.locationId === 'home-upstairs').length);
    if (room.placeItem(item.id, 'home-upstairs', spot.x, spot.y, { stackable: item.stackable })) { setBackpackOpen(false); setEditing(true); }
  }
  return <section ref={sceneRef} className="home-game" aria-label="Home second floor">
    <MoveModeScene className="bedroom" label="Home second floor decoration space" editing={editing} onEditingChange={setEditing} floorOnly>
      <div className="room-wall" aria-hidden="true" /><div className="room-floor" aria-hidden="true" />
      <WorldDoor className="bedroom-door" to="/home" prompt="DOWNSTAIRS" />
      <PlacedFurnitureLayer locationId="home-upstairs" items={catalog.items} />
    </MoveModeScene>
    <GameTopBar /><GameHudActions onOpenBackpack={() => setBackpackOpen(true)} />
    <Link className="home-upstairs-link pixel-panel" to="/home">↓ DOWNSTAIRS</Link>
    <div className="room-caption"><span>HOME · SECOND FLOOR</span><p>A little more room for your next chapter.</p></div>
    <PixelModal open={backpackOpen} onClose={() => setBackpackOpen(false)} titleId="backpack-title">
      <Backpack items={catalog.items} loading={catalog.loading} error={catalog.error} onRetry={catalog.retry} locationId="home-upstairs" onPlace={place} />
    </PixelModal>
  </section>;
}
