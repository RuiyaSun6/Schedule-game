import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import GameTopBar from '../components/GameTopBar';
import PixelButton from '../components/PixelButton';
import BuildingShopButton from '../components/BuildingShopButton';
import BuildingShopModal from '../components/BuildingShopModal';
import WorldBuildingsLayer, { buildingDisplaySize } from '../components/WorldBuildingsLayer';
import WorldEnvironment from '../components/WorldEnvironment';
import WorldOuterRegions from '../components/WorldOuterRegions';
import { MoveModeScene } from '../components/MoveModeScene';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import { getBuilding } from '../data/buildingCatalog';
import type { BuildingId } from '../types/building';
import { cameraTranslation, clampCamera, HOME_CAMERA, viewportToWorld, WORLD_TILES_PER_SIDE, type WorldPoint } from '../services/worldCamera';
import './WorldPage.css';

interface PanStart { pointerId: number; x: number; y: number; camera: WorldPoint }

// The viewport shows one region of a three-by-three world; the village is the center region.
export default function WorldPage() {
  const buildings = useWorldBuildings();
  const sceneRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [camera, setCameraState] = useState<WorldPoint>(HOME_CAMERA);
  const cameraRef = useRef(camera);
  const recenterFrame = useRef<number | null>(null);
  const pan = useRef<PanStart | null>(null);
  const [dragging, setDragging] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  // Placement mode: a just-bought (or stored) building waiting for the player to choose its spot.
  const [placing, setPlacing] = useState<{ id: BuildingId; x: number; y: number } | null>(null);

  function updateCamera(next: WorldPoint) {
    cameraRef.current = next;
    setCameraState(next);
  }

  function stopRecentering() {
    if (recenterFrame.current !== null) cancelAnimationFrame(recenterFrame.current);
    recenterFrame.current = null;
  }

  function returnHome() {
    stopRecentering();
    const from = cameraRef.current;
    if (from.x === HOME_CAMERA.x && from.y === HOME_CAMERA.y) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateCamera(HOME_CAMERA);
      return;
    }
    const start = performance.now();
    const duration = 220;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      if (progress < 1) {
        updateCamera({
          x: from.x + (HOME_CAMERA.x - from.x) * eased,
          y: from.y + (HOME_CAMERA.y - from.y) * eased,
        });
        recenterFrame.current = requestAnimationFrame(animate);
      } else {
        updateCamera(HOME_CAMERA);
        recenterFrame.current = null;
      }
    };
    recenterFrame.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const measure = () => {
      const size = { width: scene.clientWidth, height: scene.clientHeight };
      setViewport(size);
      stopRecentering();
      updateCamera(clampCamera(cameraRef.current, size));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    return () => { observer.disconnect(); stopRecentering(); };
  }, []);

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (placing || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea, [role="button"], .world-building, .placement-catcher')) return;
    stopRecentering();
    pan.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera: cameraRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    event.preventDefault();
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const start = pan.current;
    if (!start || event.pointerId !== start.pointerId) return;
    updateCamera(clampCamera({
      x: start.camera.x + event.clientX - start.x,
      y: start.camera.y + event.clientY - start.y,
    }, viewport));
    event.preventDefault();
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    if (pan.current?.pointerId !== event.pointerId) return;
    pan.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function startPlacing(id: BuildingId) {
    const size = buildingDisplaySize(id);
    const width = viewport.width || 360;
    const height = viewport.height || 800;
    const spot = viewportToWorld({
      x: (width - size.width) / 2,
      y: Math.min(height - size.height - 90, height * 0.55),
    }, cameraRef.current, { width, height });
    setShopOpen(false);
    setEditing(false);
    setPlacing({ id, ...spot });
  }
  function confirmPlacement() {
    if (!placing) return;
    buildings.place(placing.id, placing.x - viewport.width, placing.y - viewport.height);
    setPlacing(null);
  }
  const placingName = placing ? getBuilding(placing.id)!.name : '';
  const translation = cameraTranslation(camera, viewport);
  const worldSize = `${WORLD_TILES_PER_SIDE * 100}%`;

  return (
    <section ref={sceneRef} className={`home-game outdoor-game world-field${placing ? ' is-placing' : ''}`} aria-label="Your world">
      <MoveModeScene className="world-scene" label="Your world" toggleLabel="MOVE BUILDINGS"
        editing={editing || placing !== null} onEditingChange={(value) => { if (!placing) setEditing(value); }}
        objectContainerRef={canvasRef} tutorialTarget="world-viewport" toggleTutorialTarget="move-buildings">
        <div ref={canvasRef} className={`world-canvas${dragging ? ' is-dragging' : ''}`}
          style={{ width: worldSize, height: worldSize,
            ...(viewport.width ? { transform: `translate3d(${translation.x}px, ${translation.y}px, 0)` } : {}) }}
          onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}
          onLostPointerCapture={() => { pan.current = null; setDragging(false); }}
          onDragStart={(event) => event.preventDefault()}>
          <WorldOuterRegions />
          <div className="world-region world-region-center" style={{ gridColumn: 2, gridRow: 2 }}>
            <WorldEnvironment sceneRef={sceneRef} placed={buildings.placed} />
            <Link className="outdoor-home" to="/home" aria-label="Enter Home">
              <img className="outdoor-home-image" src={getBuilding('home')!.exteriorAsset} alt="" width={96} height={128} />
              <span className="home-entry" aria-hidden="true">
                <span className="door-prompt">ENTER HOME</span>
              </span>
            </Link>
          </div>
          {viewport.width > 0 && <WorldBuildingsLayer placing={placing} tileOrigin={{ x: viewport.width, y: viewport.height }}
            onDraftMove={(x, y) => setPlacing((current) => current && { ...current, x, y })} />}
        </div>
      </MoveModeScene>
      <GameTopBar />
      <BuildingShopButton onClick={() => setShopOpen(true)} />
      <button type="button" className="world-home-button pixel-panel" title="Return Home" aria-label="Return Home" data-tutorial="home"
        onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); returnHome(); }}>
        <svg width="28" height="28" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
          <path fill="#6b4a33" d="M7 1h2v1h2v2h2v2h2v2h-2v7H3V8H1V6h2V4h2V2h2z" />
          <path fill="#b75b47" d="M7 2h2v1h2v2h2v2H3V5h2V3h2z" />
          <path fill="#f1dfbf" d="M4 8h8v6H4z" />
          <path fill="#78533a" d="M7 10h2v4H7z" />
          <path fill="#bfe0e8" d="M5 9h1v2H5zM10 9h1v2h-1z" />
        </svg>
      </button>
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
