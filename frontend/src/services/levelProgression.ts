// Match the server's levelService: XP is cumulative and each threshold is per level.
const XP_TO_NEXT_LEVEL = [300, 500, 800, 1200] as const;

export function xpRequiredForLevel(level: number): number {
  if (level < 1 || !Number.isInteger(level)) throw new RangeError('Level must be a positive integer');
  return XP_TO_NEXT_LEVEL[level - 1] ?? 1200 + (level - 4) * 400;
}

export function xpAtLevel(level: number): number {
  let xp = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel++) xp += xpRequiredForLevel(currentLevel);
  return xp;
}

export function calculateLevel(xp: number): number {
  let level = 1;
  let remainingXp = xp;
  let needed = xpRequiredForLevel(level);
  while (remainingXp >= needed) {
    remainingXp -= needed;
    level++;
    needed = xpRequiredForLevel(level);
  }
  return level;
}
