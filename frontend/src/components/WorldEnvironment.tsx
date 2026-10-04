import { useEffect, useState, type RefObject } from 'react';
import { WORLD_BUILDING_SCALE, getBuilding } from '../data/buildingCatalog';
import type { PlacedBuilding } from '../types/building';

type Point = readonly [number, number];

// Trees are scattered across the grass around the open village clearing.
const trees: Point[] = [
  [5, 18], [19, 17], [32, 16], [61, 16], [72, 22],
  [9, 37], [29, 53], [66, 42],
  [4, 59], [23, 62], [39, 58], [60, 54], [73, 63],
  [11, 78], [31, 76], [43, 82], [70, 85],
  [19, 95],
];
const bushes: Point[] = [
  [6, 26], [19, 25], [5, 44], [64, 25], [70, 48], [7, 65], [19, 69],
  [67, 69], [6, 86], [23, 86], [62, 86], [72, 90],
];
const flowers: Point[] = [
  [12, 28], [16, 27], [6, 47], [11, 49], [28, 38], [31, 42], [65, 33],
  [69, 52], [8, 69], [13, 68], [29, 65], [33, 68], [62, 63], [66, 66],
  [24, 78], [28, 81], [37, 90], [41, 93], [63, 89], [67, 91],
];
const tufts: Point[] = [
  [5, 28], [24, 24], [27, 26], [60, 24], [69, 28], [13, 43], [26, 35],
  [62, 39], [72, 52], [5, 51], [19, 51], [23, 54], [59, 57], [63, 60],
  [12, 72], [27, 72], [32, 75], [58, 76], [9, 89], [31, 87], [34, 90], [68, 93],
];
const rocks: Point[] = [[25, 25], [73, 33], [7, 52], [65, 64], [18, 79], [72, 76], [35, 95]];
const ripples: Point[] = [[84, 15], [79, 34], [91, 54], [81, 73], [88, 91]];

export default function WorldEnvironment({ sceneRef, placed }: {
  sceneRef: RefObject<HTMLElement | null>;
  placed: PlacedBuilding[];
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const measure = () => setSize({ width: scene.clientWidth, height: scene.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    return () => observer.disconnect();
  }, [sceneRef]);

  const buildingBounds = placed.flatMap((building) => {
    const exterior = getBuilding(building.buildingId)?.exteriorSize;
    return exterior ? [{
      left: building.x - 20, top: building.y - 26,
      right: building.x + exterior.width * WORLD_BUILDING_SCALE + 20,
      bottom: building.y + exterior.height * WORLD_BUILDING_SCALE + 24,
    }] : [];
  });
  // Keep trees and details clear of saved buildings, Home, and controls.
  const visible = ([x, y]: Point, radius = 15) => {
    if (!size.width) return false;
    const px = size.width * x / 100;
    const py = size.height * y / 100;
    if (px > size.width * .76 || py < 110) return false;
    if (Math.abs(px - size.width / 2) < 116 + radius && py > 126 && py < 455) return false;
    if (Math.abs(px - size.width / 2) < 26 + radius && py >= 455) return false;
    if (px > size.width - 170 && py > size.height - 84) return false;
    if (px < 88 && py > size.height - 90) return false;
    const onBranch = placed.some((building) => {
      const exterior = getBuilding(building.buildingId)?.exteriorSize;
      if (!exterior) return false;
      const doorX = building.x + exterior.width * WORLD_BUILDING_SCALE / 2;
      const doorY = building.y + exterior.height * WORLD_BUILDING_SCALE - 8;
      const junction = Math.max(466, Math.min(size.height - 90, doorY - 38));
      const between = px >= Math.min(size.width / 2, doorX) - radius - 22
        && px <= Math.max(size.width / 2, doorX) + radius + 22;
      return (between && Math.abs(py - junction) < radius + 24)
        || (Math.abs(px - doorX) < radius + 24 && py >= junction && py <= doorY);
    });
    if (onBranch) return false;
    return !buildingBounds.some((bounds) => px + radius > bounds.left && px - radius < bounds.right
      && py + radius > bounds.top && py - radius < bounds.bottom);
  };

  return <div className="world-environment" aria-hidden="true">
    <div className="world-river-bank" />
    <div className="world-river" />
    {ripples.map(([x, y], index) => <span key={`ripple-${index}`} className={`river-ripple ripple-${index % 3}`}
      style={{ left: `${x}%`, top: `${y}%` }} />)}
    {tufts.filter((point) => visible(point, 12)).map(([x, y], index) => <span key={`tuft-${index}`} className={`world-tuft tuft-${index % 3}`}
      style={{ left: `${x}%`, top: `${y}%` }} />)}
    {flowers.filter((point) => visible(point, 18)).map(([x, y], index) => <span key={`flower-${index}`} className={`world-flower flower-${index % 4}`}
      style={{ left: `${x}%`, top: `${y}%` }} />)}
    {rocks.filter((point) => visible(point, 18)).map(([x, y], index) => <span key={`rock-${index}`} className="world-rock"
      style={{ left: `${x}%`, top: `${y}%` }} />)}
    {bushes.filter((point) => visible(point, 24)).map(([x, y], index) => <span key={`bush-${index}`} className={`world-bush bush-${index % 2}`}
      style={{ left: `${x}%`, top: `${y}%` }} />)}
    {trees.filter((point) => visible(point, 39)).map(([x, y], index) => <span key={`tree-${index}`} className={`world-tree tree-${index % 4}`}
      style={{ left: `${x}%`, top: `${y}%` }} />)}
  </div>;
}
