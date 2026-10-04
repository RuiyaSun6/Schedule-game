import { useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildingRoute, getBuilding } from '../data/buildingCatalog';
import type { BuildingId } from '../types/building';

/** Enter on a normal click/tap; editing and pointer drags never navigate. */
export default function BuildingEntryButton({ id, editing, className, children }: {
  id: BuildingId;
  editing: boolean;
  className: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  function trackMovement(x: number, y: number) {
    const start = gesture.current;
    if (start && Math.hypot(x - start.x, y - start.y) > 8) start.moved = true;
  }
  return <button type="button" className={className} aria-label={`Enter ${getBuilding(id)!.name}`} aria-disabled={editing}
    onPointerDown={(event) => { gesture.current = { x: event.clientX, y: event.clientY, moved: false }; }}
    onPointerMove={(event) => trackMovement(event.clientX, event.clientY)}
    onPointerUp={(event) => trackMovement(event.clientX, event.clientY)}
    onPointerCancel={() => { if (gesture.current) gesture.current.moved = true; }}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') gesture.current = null; }}
    onClick={() => {
      if (!editing && !gesture.current?.moved) navigate(buildingRoute(id));
      gesture.current = null;
    }}>
    {children}
  </button>;
}
