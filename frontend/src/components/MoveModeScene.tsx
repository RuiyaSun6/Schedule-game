import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode, RefObject } from 'react';

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
  floorOnly: boolean;
}

const SceneContext = createContext<SceneState | null>(null);

export function MoveModeScene({ className, label, children, editing, onEditingChange, floorOnly = false, toggleLabel = 'MOVE OBJECTS', objectContainerRef, tutorialTarget, toggleTutorialTarget }: { className: string; label: string; children: ReactNode; editing?: boolean; onEditingChange?: (value: boolean) => void; floorOnly?: boolean; toggleLabel?: string; objectContainerRef?: RefObject<HTMLDivElement | null>; tutorialTarget?: string; toggleTutorialTarget?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [localMoveMode, setLocalMoveMode] = useState(false);
  const moveMode = editing ?? localMoveMode;
  const setMoveMode = onEditingChange ?? setLocalMoveMode;
  return <SceneContext.Provider value={{ container: objectContainerRef ?? container, moveMode, floorOnly }}>
    <div ref={container} className={`${className} move-mode-scene${moveMode ? ' is-editing' : ''}`} aria-label={label} data-tutorial={tutorialTarget}>
      {children}
      <button className="move-mode-toggle" type="button" aria-pressed={moveMode} data-tutorial={toggleTutorialTarget}
        onClick={() => setMoveMode(!moveMode)}>
        {moveMode ? (editing === undefined ? 'DONE MOVING' : 'DONE') : toggleLabel}
      </button>
    </div>
  </SceneContext.Provider>;
}

interface MovableObjectProps {
  objectId: string;
  className: string;
  movable?: boolean;
  position?: WorldObjectPosition;
  onPositionChange?: (position: WorldObjectPosition) => void;
  onStore?: () => void;
  name?: string;
  children: ReactNode | ((moveMode: boolean) => ReactNode);
}

interface DragStart {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
}

export function MovableObject({ objectId, className, movable = true, children, position: suppliedPosition, onPositionChange, onStore, name }: MovableObjectProps) {
  const layout = useContext(LayoutContext);
  const scene = useContext(SceneContext);
  if (!layout || !scene) throw new Error('MovableObject requires a world layout and scene');

  const drag = useRef<DragStart | null>(null);
  const objectRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(false);
  const position = suppliedPosition ?? (onPositionChange ? undefined : layout.positions[objectId]);
  const setPosition = onPositionChange ?? layout.setPosition;
  function clamp(x: number, y: number, container: HTMLDivElement, object: HTMLDivElement) {
    const minY = scene!.floorOnly ? container.clientHeight * .36 : 0;
    const maxY = Math.max(minY, container.clientHeight - object.offsetHeight - (scene!.floorOnly ? 88 : 0));
    return { objectId, x: Math.round(Math.max(0, Math.min(x, Math.max(0, container.clientWidth - object.offsetWidth)))), y: Math.round(Math.max(minY, Math.min(y, maxY))) };
  }
  const hasPosition = Boolean(position);
  const canMove = movable && scene.moveMode;

  useEffect(() => {
    if (!hasPosition && !scene.floorOnly) return;
    const container = scene.container.current;
    const object = objectRef.current;
    if (!container || !object) return;
    const keepInsideScene = () => {
      const next = clamp(object.offsetLeft, object.offsetTop, container, object);
      if (next.x !== object.offsetLeft || next.y !== object.offsetTop) setPosition(next);
    };
    keepInsideScene();
    const observer = new ResizeObserver(keepInsideScene);
    observer.observe(container);
    observer.observe(object);
    return () => observer.disconnect();
  }, [hasPosition, objectId]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canMove || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const container = scene!.container.current;
    if (!container) return;
    setSelected(true);
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
    setPosition(clamp(start.x + event.clientX - start.pointerX, start.y + event.clientY - start.pointerY, container, object));
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
    {canMove && name && <button type="button" className="room-object-select" aria-label={`Select ${name}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => setSelected((current) => !current)}>⋯</button>}
    {canMove && selected && name && <div className="room-object-actions" onPointerDown={(event) => event.stopPropagation()}>
      <span>{name}</span>
      {onStore ? <button type="button" onClick={onStore}>STORE</button> : <small>STARTER · MOVE ONLY</small>}
    </div>}
  </div>;
}
