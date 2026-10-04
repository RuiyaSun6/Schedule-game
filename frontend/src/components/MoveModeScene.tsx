import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

// Scene-relative pixels. Each entry can later be sent as { objectId, x, y }.
export interface WorldObjectPosition {
  objectId: string;
  x: number;
  y: number;
}

interface LayoutState {
  positions: Record<string, WorldObjectPosition>;
  setPosition: (position: WorldObjectPosition) => void;
}

const LayoutContext = createContext<LayoutState | null>(null);

export function WorldLayoutProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<Record<string, WorldObjectPosition>>({});
  function setPosition(position: WorldObjectPosition) {
    setPositions((current) => ({ ...current, [position.objectId]: position }));
  }
  return <LayoutContext.Provider value={{ positions, setPosition }}>{children}</LayoutContext.Provider>;
}

interface SceneState {
  container: React.RefObject<HTMLDivElement | null>;
  moveMode: boolean;
}

const SceneContext = createContext<SceneState | null>(null);

export function MoveModeScene({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [moveMode, setMoveMode] = useState(false);
  return <SceneContext.Provider value={{ container, moveMode }}>
    <div ref={container} className={`${className} move-mode-scene${moveMode ? ' is-editing' : ''}`} aria-label={label}>
      {children}
      <button className="move-mode-toggle" type="button" aria-pressed={moveMode}
        onClick={() => setMoveMode((current) => !current)}>
        {moveMode ? 'DONE MOVING' : 'MOVE OBJECTS'}
      </button>
    </div>
  </SceneContext.Provider>;
}

interface MovableObjectProps {
  objectId: string;
  className: string;
  movable?: boolean;
  children: ReactNode | ((moveMode: boolean) => ReactNode);
}

interface DragStart {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
}

export function MovableObject({ objectId, className, movable = true, children }: MovableObjectProps) {
  const layout = useContext(LayoutContext);
  const scene = useContext(SceneContext);
  if (!layout || !scene) throw new Error('MovableObject requires a world layout and scene');

  const drag = useRef<DragStart | null>(null);
  const objectRef = useRef<HTMLDivElement>(null);
  const position = layout.positions[objectId];
  const hasPosition = Boolean(position);
  const canMove = movable && scene.moveMode;

  useEffect(() => {
    if (!hasPosition) return;
    const container = scene.container.current;
    const object = objectRef.current;
    if (!container || !object) return;
    const keepInsideScene = () => {
      const x = Math.max(0, Math.min(object.offsetLeft, container.clientWidth - object.offsetWidth));
      const y = Math.max(0, Math.min(object.offsetTop, container.clientHeight - object.offsetHeight));
      if (x !== object.offsetLeft || y !== object.offsetTop) layout.setPosition({ objectId, x, y });
    };
    const observer = new ResizeObserver(keepInsideScene);
    observer.observe(container);
    observer.observe(object);
    return () => observer.disconnect();
  }, [hasPosition, objectId]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canMove || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const container = scene!.container.current;
    if (!container) return;
    const object = event.currentTarget;
    const bounds = object.getBoundingClientRect();
    const sceneBounds = container.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: bounds.left - sceneBounds.left - container.clientLeft,
      y: bounds.top - sceneBounds.top - container.clientTop,
    };
    object.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const container = scene!.container.current;
    if (!canMove || !start || !container || event.pointerId !== start.pointerId) return;
    const object = event.currentTarget;
    const x = Math.max(0, Math.min(container.clientWidth - object.offsetWidth, start.x + event.clientX - start.pointerX));
    const y = Math.max(0, Math.min(container.clientHeight - object.offsetHeight, start.y + event.clientY - start.pointerY));
    layout!.setPosition({ objectId, x: Math.round(x), y: Math.round(y) });
    event.preventDefault();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <div ref={objectRef} className={`${className} movable-object${canMove ? ' can-move' : ''}`}
    style={position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove}
    onPointerUp={endDrag} onPointerCancel={endDrag}
    onLostPointerCapture={() => { drag.current = null; }}
    onDragStart={canMove ? (event) => event.preventDefault() : undefined}>
    {typeof children === 'function' ? children(scene.moveMode) : children}
  </div>;
}
