const XP_PER_LEVEL = 100;

const AREA_UNLOCKS = [
  { level: 1, area: "village" },
  { level: 2, area: "forest" },
  { level: 3, area: "mountains" },
  { level: 5, area: "castle" },
] as const;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getUnlockedAreas(level: number): string[] {
  return AREA_UNLOCKS.filter((unlock) => level >= unlock.level).map(
    (unlock) => unlock.area,
  );
}
