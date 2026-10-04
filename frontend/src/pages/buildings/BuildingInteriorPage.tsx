import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import GameTopBar from '../../components/GameTopBar';
import PixelModal from '../../components/PixelModal';
import Backpack from '../../components/Backpack';
import WorldDoor from '../../components/WorldDoor';
import PlacedFurnitureLayer from '../../components/PlacedFurnitureLayer';
import { MoveModeScene } from '../../components/MoveModeScene';
import { useCatalog } from '../../services/useCatalog';
import { useRoomPlacement } from '../../services/RoomPlacementContext';
import { defaultFurnitureSpot } from '../../services/furnitureLocation';
import { useWorldBuildings } from '../../hooks/useWorldBuildings';
import { getBuilding } from '../../data/buildingCatalog';
import { getItemArt, itemFamily } from '../../data/shopAssets';
import FarmFieldBackground from '../../components/farm/FarmFieldBackground';
import { cellKey, cellToPosition, tilledCells, useFieldGrid } from '../../components/farm/farmGrid';
import '../../components/farm/FarmField.css';
import type { Item } from '../../types';
import '../../scenes/RoomSlots.css';
import './BuildingInteriorPage.css';

// One reusable interior for every bought building (/building/:buildingId). It starts empty:
// plain walls and floor from the catalog, an exit door, and whatever furniture the player places.
export default function BuildingInteriorPage() {
  const { buildingId } = useParams();
  const building = getBuilding(buildingId);
  const buildings = useWorldBuildings();
  const catalog = useCatalog();
  const room = useRoomPlacement();
  const sceneRef = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const [backpackOpen, setBackpackOpen] = useState(false);
  // Field interiors (the Farm): tiled background, crops snap to tilled tiles.
  const grid = useFieldGrid(sceneRef, building?.interior.field);
  const [hint, setHint] = useState('');
  useEffect(() => {
    if (!hint) return;
    const timeout = setTimeout(() => setHint(''), 2400);
    return () => clearTimeout(timeout);
  }, [hint]);

  if (!building) return <Navigate to="/world" replace />;
  if (building.id === 'home') return <Navigate to="/home" replace />;
  if (buildings.status(building.id) !== 'placed') {
    return <section className="accepted-quests-page" aria-label={building.name}>
      <GameTopBar />
      <h1>{building.name.toUpperCase()}</h1>
      <p>You haven’t built and placed the {building.name} yet. Buy it in the Building Shop and choose a spot in your world first.</p>
      <Link className="accepted-quests-link" to="/world">← Back to the world</Link>
    </section>;
  }

  const id = building.id;
  function placeFromBackpack(item: Item) {
    const art = getItemArt(item.id);
    if (grid && art && itemFamily(item.id) === 'crop') {
      // Crops go on the first free tilled tile.
      const taken = new Set(room.placed.filter((p) => p.locationId === id && p.cell).map((p) => cellKey(p.cell!)));
      const cell = tilledCells(grid).find((c) => !taken.has(cellKey(c)));
      if (!cell) { setHint('All the tilled soil is planted. Store a crop to make room.'); setBackpackOpen(false); return; }
      const spot = cellToPosition(grid, cell, art);
      if (!room.placeItem(item.id, id, spot.x, spot.y, { stackable: item.stackable, cell })) setHint('No unplaced copies left. Buy another in the Shop.');
      setBackpackOpen(false);
      setEditing(true);
      return;
    }
    const scene = sceneRef.current;
    const spot = defaultFurnitureSpot({ width: scene?.clientWidth ?? 360, height: scene?.clientHeight ?? 600 }, room.placed.filter((p) => p.locationId === id).length);
    if (!room.placeItem(item.id, id, spot.x, spot.y, { stackable: item.stackable })) setHint('No unplaced copies left. Buy another in the Shop.');
    setBackpackOpen(false);
    setEditing(true);
  }
  const colours = {
    '--interior-wall': building.interior.wall, '--interior-floor': building.interior.floor,
    // On a field, items use the field's scale so crops line up with the tiles.
    ...(grid ? { '--room-scale': grid.scale } : {}),
  } as CSSProperties;

  return (
    <section ref={sceneRef} className={`home-game building-interior-game interior-${building.interiorType}`} style={colours} aria-label={`Inside the ${building.name}`}>
      <MoveModeScene className="bedroom building-interior" label={`${building.name} interior`} editing={editing} onEditingChange={setEditing} floorOnly={!building.interior.field}>
        {building.interior.field ? <FarmFieldBackground grid={grid} /> : <>
          <div className="room-wall" aria-hidden="true" />
          <div className="room-floor" aria-hidden="true" />
          <WorldDoor className="bedroom-door" to="/world" prompt={`EXIT ${building.name.toUpperCase()}`} />
        </>}
        <PlacedFurnitureLayer locationId={id} items={catalog.items} grid={grid} onHint={setHint} />
      </MoveModeScene>
      <GameTopBar />
      {hint && <p className="farm-hint pixel-panel" role="status">{hint}</p>}
      <Link className="interior-exit pixel-panel" to="/world" aria-label={`Exit the ${building.name}`}>EXIT</Link>
      <button type="button" className="home-backpack-shortcut interior-backpack pixel-panel" onClick={() => setBackpackOpen(true)} aria-label="Open Backpack" title="Backpack">
        <svg width="30" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
          <path fill="#75624c" d="M5 1h6v3h2v2h1v9H2V6h1V4h2z" />
          <path fill="#fff8e5" d="M6 2h4v2H6z" />
          <path fill="#9caf84" d="M4 5h8v8H4z" />
          <path fill="#637c4e" d="M5 9h6v4H5z" />
          <path fill="#edcd74" d="M7 8h2v2H7z" />
        </svg>
      </button>
      <div className="room-caption"><span>{building.interior.caption}</span><p>Open the Backpack to place furniture, then use MOVE OBJECTS to arrange it.</p></div>
      <PixelModal open={backpackOpen} onClose={() => setBackpackOpen(false)} titleId="backpack-title">
        <Backpack items={catalog.items} loading={catalog.loading} error={catalog.error} onRetry={catalog.retry} locationId={id} onPlace={placeFromBackpack} />
      </PixelModal>
    </section>
  );
}
