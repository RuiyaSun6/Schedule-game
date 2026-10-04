export type AreaId = 'home' | 'garden' | 'cafe' | 'studio' | 'town';

export interface WorldArea {
  id: AreaId;
  name: string;
  requiredLevel: number;
  buildCost: number | null;
}

export type AreaStatus = 'locked' | 'available' | 'built';

// Level permits building; ownership alone determines whether an area exists.
export function getAreaStatus(area: WorldArea, level: number, builtAreas: readonly AreaId[]): AreaStatus {
  if (level < area.requiredLevel) return 'locked';
  if (builtAreas.includes(area.id)) return 'built';
  return level >= area.requiredLevel ? 'available' : 'locked';
}
