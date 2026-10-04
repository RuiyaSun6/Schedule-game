import { MovableObject } from './MoveModeScene';
import BuildingEntryButton from './BuildingEntryButton';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import { WORLD_BUILDING_SCALE, buildingExterior, getBuilding } from '../data/buildingCatalog';
import type { BuildingId } from '../types/building';

export function buildingDisplaySize(id: BuildingId) {
  const { width, height } = getBuilding(id)!.exteriorSize;
  return { width: width * WORLD_BUILDING_SCALE, height: height * WORLD_BUILDING_SCALE };
}

function BuildingArt({ id }: { id: BuildingId }) {
  const size = buildingDisplaySize(id);
  const buildings = useWorldBuildings();
  return <img className="world-building-art" src={buildingExterior(id, buildings.level(id))} alt="" width={size.width} height={size.height} draggable={false} />;
}

// Placed buildings in the world (enter on click; drag/store in MOVE BUILDINGS mode), plus the
// draft building during placement mode. Must render inside the World's MoveModeScene.
export default function WorldBuildingsLayer({ placing, onDraftMove, tileOrigin }: {
  placing: { id: BuildingId; x: number; y: number } | null;
  onDraftMove: (x: number, y: number) => void;
  tileOrigin: { x: number; y: number };
}) {
  const buildings = useWorldBuildings();
  return <>
    {buildings.placed.filter((p) => p.buildingId !== placing?.id).map((p) => {
      const building = getBuilding(p.buildingId)!;
      return <MovableObject key={p.instanceId} objectId={p.instanceId} className={`world-building world-building-${p.buildingId}`} name={building.name}
        position={{ objectId: p.instanceId, x: p.x + tileOrigin.x, y: p.y + tileOrigin.y }}
        onPositionChange={(pos) => buildings.move(p.instanceId, pos.x - tileOrigin.x, pos.y - tileOrigin.y)}
        onStore={() => buildings.store(p.instanceId)}>
        {(moveMode) => <BuildingEntryButton id={p.buildingId} className="world-building-button" editing={moveMode || placing !== null}>
          <span className="door-prompt">ENTER {building.name.toUpperCase()}</span>
          <BuildingArt id={p.buildingId} />
          {buildings.level(p.buildingId) > 1 && <span className="building-level-badge">Lv.{buildings.level(p.buildingId)}</span>}
        </BuildingEntryButton>}
      </MovableObject>;
    })}
    {placing && <>
      {/* Tap anywhere on the field to move the draft building there. */}
      <div className="placement-catcher" aria-hidden="true" onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const size = buildingDisplaySize(placing.id);
        const x = Math.max(0, Math.min(rect.width - size.width, event.clientX - rect.left - size.width / 2));
        const y = Math.max(0, Math.min(rect.height - size.height, event.clientY - rect.top - size.height / 2));
        onDraftMove(x, y);
      }} />
      <MovableObject objectId="placement-draft" className="world-building world-building-draft"
        position={{ objectId: 'placement-draft', x: placing.x, y: placing.y }} onPositionChange={(pos) => onDraftMove(pos.x, pos.y)}>
        <BuildingArt id={placing.id} />
      </MovableObject>
    </>}
  </>;
}
