type Point = readonly [number, number];

interface OuterRegion {
  row: number;
  col: number;
  trees: readonly Point[];
  flowers: readonly Point[];
  bushes: readonly Point[];
  rocks: readonly Point[];
  tufts: readonly Point[];
}

// Fixed, sparse scenery. The middle region is the existing village and is rendered separately.
const regions: readonly OuterRegion[] = [
  { row: 0, col: 0, trees: [[12, 22], [57, 15], [78, 44], [25, 73]], flowers: [[34, 36], [69, 67]], bushes: [[17, 52], [84, 81]], rocks: [[48, 79]], tufts: [[47, 27], [8, 85], [63, 89]] },
  { row: 0, col: 1, trees: [[14, 30], [54, 18], [35, 67]], flowers: [[42, 39], [8, 82]], bushes: [[61, 76]], rocks: [[26, 87]], tufts: [[6, 51], [58, 52], [20, 13]] },
  { row: 0, col: 2, trees: [[45, 23], [83, 35], [61, 71]], flowers: [[68, 15], [93, 79]], bushes: [[47, 55]], rocks: [[81, 90]], tufts: [[56, 86], [94, 48]] },
  { row: 1, col: 0, trees: [[16, 19], [68, 30], [37, 58], [82, 79]], flowers: [[43, 16], [13, 72]], bushes: [[75, 55]], rocks: [[32, 89]], tufts: [[6, 44], [52, 83], [93, 8]] },
  { row: 1, col: 2, trees: [[49, 17], [79, 42], [61, 80]], flowers: [[69, 27], [89, 69]], bushes: [[43, 59]], rocks: [[85, 91]], tufts: [[55, 46], [95, 15]] },
  { row: 2, col: 0, trees: [[31, 16], [77, 28], [13, 62], [58, 83]], flowers: [[51, 45], [88, 74]], bushes: [[24, 90]], rocks: [[69, 59]], tufts: [[6, 32], [91, 10], [38, 69]] },
  { row: 2, col: 1, trees: [[11, 26], [48, 35], [27, 79], [65, 88]], flowers: [[36, 15], [8, 59]], bushes: [[55, 63]], rocks: [[19, 94]], tufts: [[60, 10], [31, 51], [6, 89]] },
  { row: 2, col: 2, trees: [[57, 18], [88, 42], [45, 73]], flowers: [[70, 63], [92, 87]], bushes: [[65, 92]], rocks: [[82, 14]], tufts: [[47, 43], [92, 25]] },
];

function details(points: readonly Point[], kind: string, variantCount = 1) {
  return points.map(([x, y], index) => <span key={`${kind}-${index}`}
    className={`world-${kind}${variantCount > 1 ? ` ${kind}-${index % variantCount}` : ''}`}
    style={{ left: `${x}%`, top: `${y}%` }} />);
}

export default function WorldOuterRegions() {
  return <>
    {regions.map(({ row, col, trees, flowers, bushes, rocks, tufts }) =>
      <div key={`${row}-${col}`} className={`world-region world-region-outer world-region-${col === 2 ? 'east-river' : col === 1 ? row === 0 ? 'upper-river' : 'lower-river' : 'grass'}`}
        style={{ gridColumn: col + 1, gridRow: row + 1 }} aria-hidden="true">
        {col > 0 && <><div className="world-outer-river-bank" /><div className="world-outer-river" /></>}
        {details(tufts, 'tuft', 3)}
        {details(flowers, 'flower', 4)}
        {details(rocks, 'rock')}
        {details(bushes, 'bush', 2)}
        {details(trees, 'tree', 4)}
      </div>)}
  </>;
}
