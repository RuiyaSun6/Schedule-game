import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GameTopBar from '../components/GameTopBar';
import PixelButton from '../components/PixelButton';
import BuildingShopButton from '../components/BuildingShopButton';
import BuildingShopModal from '../components/BuildingShopModal';
import WorldBuildingsLayer, { buildingDisplaySize } from '../components/WorldBuildingsLayer';
import { MoveModeScene } from '../components/MoveModeScene';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import { getBuilding } from '../data/buildingCatalog';
import type { BuildingId } from '../types/building';
import './WorldPage.css';

// The outdoor world: a clean green field with Home, plus whatever buildings the player bought and placed.
export default function WorldPage() {
  const buildings = useWorldBuildings();
  const sceneRef = useRef<HTMLElement>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  // Placement mode: a just-bought (or stored) building waiting for the player to choose its spot.
  const [placing, setPlacing] = useState<{ id: BuildingId; x: number; y: number } | null>(null);

  function startPlacing(id: BuildingId) {
    const scene = sceneRef.current;
    const size = buildingDisplaySize(id);
    const width = scene?.clientWidth ?? 360;
    const height = scene?.clientHeight ?? 800;
    setShopOpen(false);
    setEditing(false);
    setPlacing({ id, x: (width - size.width) / 2, y: Math.min(height - size.height - 90, height * 0.55) });
  }
  function confirmPlacement() {
    if (!placing) return;
    buildings.place(placing.id, placing.x, placing.y);
    setPlacing(null);
  }
  const placingName = placing ? getBuilding(placing.id)!.name : '';

  return (
    <section ref={sceneRef} className={`home-game outdoor-game world-field${placing ? ' is-placing' : ''}`} aria-label="Your world">
      <MoveModeScene className="world-scene" label="Your world" toggleLabel="MOVE BUILDINGS"
        editing={editing || placing !== null} onEditingChange={(value) => { if (!placing) setEditing(value); }}>
        <Link className="outdoor-home" to="/home" aria-label="Enter Home">
          <img className="outdoor-home-image" src={getBuilding('home')!.exteriorAsset} alt="" width={96} height={128} />
          <span className="home-entry" aria-hidden="true">
            <span className="door-prompt">ENTER HOME</span>
          </span>
        </Link>
        <WorldBuildingsLayer placing={placing} onDraftMove={(x, y) => setPlacing((current) => current && { ...current, x, y })} />
      </MoveModeScene>
      <GameTopBar />
      <BuildingShopButton onClick={() => setShopOpen(true)} />
      {placing && <div className="placement-banner pixel-panel" role="status">
        <p>Drag the {placingName}, or tap where it should go.</p>
        <div className="placement-actions">
          <PixelButton onClick={confirmPlacement}>PLACE HERE</PixelButton>
          <button type="button" className="placement-later" onClick={() => setPlacing(null)}>LATER</button>
        </div>
      </div>}
      <BuildingShopModal open={shopOpen} onClose={() => setShopOpen(false)} onStartPlacing={startPlacing} />
    </section>
  );
}
