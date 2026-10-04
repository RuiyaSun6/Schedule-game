import { useEffect, useRef, type RefObject } from 'react';
import { ANIMALS, type AnimalAction, type AnimalSpec } from '../../data/animals';
import { framePosition, spriteStyle } from './AnimalSprite';
import './FarmAnimals.css';

// Farm animals wandering the open ground: walk a bit -> stop to peck, stand, or sit -> walk again.
// One requestAnimationFrame loop drives every animal and writes styles straight to the DOM, so
// React only re-renders when the number of animals changes. The loop stops when the Farm unmounts.

export interface Rect { x: number; y: number; width: number; height: number }

/** HUD pieces drawn over the farm; animals never stop underneath them. */
const HUD_SELECTOR = '.game-top-bar, .game-hud-actions, .room-caption, .interior-exit, .move-mode-toggle, .farm-hint, .interior-expansion-hint';

type Mode = 'walk' | 'run' | 'peck' | 'stand' | 'sit' | 'rise';

interface Walker {
  spec: AnimalSpec;
  x: number;
  y: number;
  tx: number;
  ty: number;
  mode: Mode;
  /** When the current mode started and (for pauses) ends, in rAF time (ms). */
  since: number;
  until: number;
  flipped: boolean;
  /** Last values written to the DOM, to skip identical writes. */
  drawn: string;
}

interface Elements { root: HTMLButtonElement; hop: HTMLSpanElement; sprite: HTMLSpanElement }

const random = (min: number, max: number) => min + Math.random() * (max - min);
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export default function FarmAnimals({ animals, scale, areaRef, avoid = [], interactive = true }: {
  /** Shop item id and how many the player owns. */
  animals: { id: string; count: number }[];
  /** Whole-number display scale. */
  scale: number;
  /** The element the animals walk on (absolute coordinates inside it). */
  areaRef: RefObject<HTMLElement | null>;
  /** Areas to keep off, in area coordinates (e.g. tilled soil). */
  avoid?: Rect[];
  /** false while furniture is being moved: animals let pointer events through. */
  interactive?: boolean;
}) {
  const entries = animals.flatMap(({ id, count }) => {
    const spec = ANIMALS[id];
    return spec ? Array.from({ length: count }, (_, index) => ({ key: `${id}:${index}`, spec, index })) : [];
  });
  const elements = useRef(new Map<string, Elements>());
  const walkers = useRef(new Map<string, Walker>());
  const pokes = useRef(new Set<string>());
  // The loop reads the latest props through a ref instead of restarting.
  const latest = useRef({ scale, avoid });
  latest.current = { scale, avoid };

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frame = 0;
    let last = performance.now();

    function obstacles(area: HTMLElement): Rect[] {
      const origin = area.getBoundingClientRect();
      const scene = area.closest('.home-game') ?? document.body;
      const hud = [...scene.querySelectorAll<HTMLElement>(HUD_SELECTOR)].map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ x: r.left - origin.left - 6, y: r.top - origin.top - 6, width: r.width + 12, height: r.height + 12 }));
      // Placed furniture (trees, haystacks, fences): walk around it rather than over it.
      const placed = [...area.querySelectorAll<HTMLElement>('.placed-furniture')].map((el) => el.getBoundingClientRect())
        .map((r) => ({ x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height }));
      return [...latest.current.avoid, ...hud, ...placed];
    }

    /** The part of the frame the animal actually covers (its art has a little empty border). */
    function body(spec: AnimalSpec, x: number, y: number): Rect {
      const s = latest.current.scale;
      return { x: x + 2 * s, y: y + 2 * s, width: (spec.frameWidth - 4) * s, height: (spec.frameHeight - 4) * s };
    }

    function bounds(area: HTMLElement, spec: AnimalSpec) {
      const s = latest.current.scale;
      return { maxX: Math.max(0, area.clientWidth - spec.frameWidth * s), maxY: Math.max(0, area.clientHeight - spec.frameHeight * s) };
    }

    /** A free spot reachable in a straight line from (fromX, fromY), or null. */
    function pickTarget(area: HTMLElement, spec: AnimalSpec, blocked: Rect[], from?: { x: number; y: number }, reach = 70) {
      const { maxX, maxY } = bounds(area, spec);
      const s = latest.current.scale;
      for (let attempt = 0; attempt < 16; attempt++) {
        let x: number; let y: number;
        if (from) {
          const angle = random(0, Math.PI * 2);
          const distance = random(16, reach) * s;
          x = from.x + Math.cos(angle) * distance;
          y = from.y + Math.sin(angle) * distance * 0.7;
        } else {
          x = random(0, maxX); y = random(0, maxY);
        }
        x = Math.round(Math.min(maxX, Math.max(0, x)));
        y = Math.round(Math.min(maxY, Math.max(0, y)));
        // Stuck under something (e.g. the HUD moved after a resize): only the destination must be free.
        const stuck = from && blocked.some((rect) => overlaps(body(spec, from.x, from.y), rect));
        const path = from && !stuck ? [0.25, 0.5, 0.75, 1] : [1];
        const clear = path.every((t) => {
          const box = body(spec, from ? from.x + (x - from.x) * t : x, from ? from.y + (y - from.y) * t : y);
          return blocked.every((rect) => !overlaps(box, rect));
        });
        if (clear) return { x, y };
      }
      return null;
    }

    function pause(walker: Walker, now: number) {
      const roll = Math.random();
      const fpsMs = 1000 / walker.spec.fps;
      walker.since = now;
      if (roll < 0.45) { walker.mode = 'peck'; walker.until = now + walker.spec.framesPerRow * fpsMs * Math.ceil(random(1, 3)); }
      else if (roll < 0.8) { walker.mode = 'stand'; walker.until = now + random(900, 2600); }
      else { walker.mode = 'sit'; walker.until = now + random(2200, 4500); }
    }

    function walkOn(walker: Walker, area: HTMLElement, now: number, run = false) {
      const target = reduceMotion ? null : pickTarget(area, walker.spec, obstacles(area), walker, run ? 90 : 70);
      if (!target) { walker.mode = 'stand'; walker.since = now; walker.until = now + random(800, 1600); return; }
      walker.tx = target.x; walker.ty = target.y;
      walker.mode = run ? 'run' : 'walk';
      walker.since = now;
      // The art faces one way; moving the other way flips it.
      if (target.x !== walker.x) walker.flipped = (target.x > walker.x) === (walker.spec.facing === 'left');
    }

    function step(walker: Walker, area: HTMLElement, now: number, dt: number) {
      const s = latest.current.scale;
      // The area can shrink (window resize): stay inside it.
      const { maxX, maxY } = bounds(area, walker.spec);
      walker.x = Math.min(maxX, walker.x); walker.y = Math.min(maxY, walker.y);
      if (walker.mode === 'walk' || walker.mode === 'run') {
        const speed = walker.spec.speed * s * (walker.mode === 'run' ? 2.6 : 1);
        const dx = walker.tx - walker.x; const dy = walker.ty - walker.y;
        const distance = Math.hypot(dx, dy);
        const move = speed * dt / 1000;
        if (distance <= move) { walker.x = walker.tx; walker.y = walker.ty; pause(walker, now); }
        else { walker.x += dx / distance * move; walker.y += dy / distance * move; }
      } else if (now >= walker.until) {
        if (walker.mode === 'sit') { walker.mode = 'rise'; walker.since = now; walker.until = now + walker.spec.framesPerRow * 1000 / walker.spec.fps; }
        else walkOn(walker, area, now);
      }
    }

    /** Sheet row and frame for the current mode. */
    function pose(walker: Walker, now: number): [AnimalAction, number] {
      const spec = walker.spec;
      const tick = Math.floor((now - walker.since) * spec.fps / 1000);
      const last = spec.framesPerRow - 1;
      switch (walker.mode) {
        case 'walk': return ['walk', tick % spec.framesPerRow];
        case 'run': return ['run', 1 + (Math.floor(tick * 1.6) % last)];
        case 'peck': return ['peck', tick % spec.framesPerRow];
        case 'sit': return ['sit', Math.min(tick, last)];
        case 'rise': return ['sit', Math.max(0, last - tick)];
        default: return ['walk', 0];
      }
    }

    function draw(walker: Walker, els: Elements, now: number) {
      const s = latest.current.scale;
      const [action, index] = pose(walker, now);
      const x = Math.round(walker.x); const y = Math.round(walker.y);
      const drawn = `${x},${y},${action},${index},${walker.flipped},${s}`;
      if (drawn === walker.drawn) return;
      walker.drawn = drawn;
      els.root.style.transform = `translate(${x}px, ${y}px)`;
      // Lower on screen = in front.
      els.root.style.zIndex = String(y + walker.spec.frameHeight * s);
      els.root.style.visibility = 'visible';
      els.sprite.style.backgroundPosition = framePosition(walker.spec, walker.spec.rows[action], index, s);
      els.sprite.style.transform = walker.flipped ? 'scaleX(-1)' : '';
    }

    function tick(now: number) {
      const dt = Math.min(100, now - last);
      last = now;
      const area = areaRef.current;
      if (area && area.clientWidth > 0) {
        for (const [key, els] of elements.current) {
          let walker = walkers.current.get(key);
          if (!walker) {
            // New animal (just bought, or the Farm just opened): a random free spot.
            const spec = ANIMALS[els.root.dataset.animal ?? ''];
            if (!spec) continue;
            const spot = pickTarget(area, spec, obstacles(area)) ?? { x: Math.round(random(0, bounds(area, spec).maxX)), y: Math.round(random(0, bounds(area, spec).maxY)) };
            walker = { spec, ...spot, tx: spot.x, ty: spot.y, mode: 'stand', since: now, until: now + random(200, 1800), flipped: Math.random() < 0.5, drawn: '' };
            walkers.current.set(key, walker);
          }
          if (pokes.current.delete(key) && walker.mode !== 'run') walkOn(walker, area, now, true);
          step(walker, area, now, dt);
          draw(walker, els, now);
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [areaRef]);

  // Forget animals that are gone (fewer owned) so a later one spawns fresh.
  useEffect(() => {
    const keys = new Set(entries.map((entry) => entry.key));
    for (const key of walkers.current.keys()) if (!keys.has(key)) walkers.current.delete(key);
  });

  function poke(key: string) {
    const els = elements.current.get(key);
    // A little hop, then a short dash away.
    els?.hop.animate?.([{ transform: 'translateY(0)' }, { transform: `translateY(${-6 * scale}px)` }, { transform: 'translateY(0)' }], { duration: 320, easing: 'ease-out' });
    pokes.current.add(key);
  }

  if (entries.length === 0) return null;
  return <div className={`farm-animals${interactive ? '' : ' is-passive'}`}>
    {entries.map(({ key, spec, index }) => <button key={key} type="button" className="farm-animal" data-animal={key.split(':')[0]}
      aria-label={`${spec.name} ${index + 1}`} title={spec.name} onClick={() => poke(key)}
      style={{ width: spec.frameWidth * scale, height: spec.frameHeight * scale }}
      ref={(root) => {
        if (!root) { elements.current.delete(key); return; }
        elements.current.set(key, { root, hop: root.firstElementChild as HTMLSpanElement, sprite: root.firstElementChild!.firstElementChild as HTMLSpanElement });
        // Redraw on the next frame (e.g. after a scale change re-rendered the sprite).
        const walker = walkers.current.get(key);
        if (walker) walker.drawn = '';
      }}>
      <span className="farm-animal-hop"><span className="animal-sprite" style={spriteStyle(spec, scale, index)} /></span>
    </button>)}
  </div>;
}
