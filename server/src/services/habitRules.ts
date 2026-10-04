export type Period = "daily" | "weekly";
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  period: Period;
  targetCount: number;
  createdAt: string;
  completionDates: string[];
}
export interface Reward { xp: number; coins: number; badge: string; itemId?: string; itemName?: string }
export interface BoardEntry {
  id: string;
  name: string;
  description: string;
  progress: number;
  required: number;
  unit: string;
  reward: Reward;
  state: "locked" | "ready" | "claimed";
}
export interface HabitView extends Habit {
  currentProgress: number;
  periodTarget: number;
  totalCompletions: number;
  currentStreak: number;
  successfulWeeks: number;
  checkedToday: boolean;
}
export interface HabitBoard { habits: HabitView[]; milestones: { habitId: string; title: string; entries: BoardEntry[] }[]; achievements: BoardEntry[]; claimedIds: string[] }

export function dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
export function dayNumber(key: string): number {
  const date = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || dateKey(date) !== key) throw new RangeError("Invalid calendar date");
  return Math.floor(date.valueOf() / 86_400_000);
}
export function dayKey(number: number): string { return dateKey(new Date(number * 86_400_000)); }
export function weekStart(key: string): string {
  const day = dayNumber(key);
  const weekday = new Date(day * 86_400_000).getUTCDay();
  return dayKey(day - (weekday + 6) % 7);
}
export function countInWeek(dates: readonly string[], week: string): number {
  return dates.filter((date) => weekStart(date) === week).length;
}
export function periodTarget(habit: Habit): number { return habit.period === "daily" ? 7 : habit.targetCount; }
export function successfulWeeks(habit: Habit, today: string): number {
  const weeks = new Set(habit.completionDates.filter((date) => date <= today).map(weekStart));
  return [...weeks].filter((week) => countInWeek(habit.completionDates.filter((date) => date <= today), week) >= periodTarget(habit)).length;
}
export function currentStreak(dates: readonly string[], today: string): number {
  const days = new Set(dates.filter((date) => date <= today).map(dayNumber));
  let day = dayNumber(today);
  if (!days.has(day)) day--;
  let count = 0;
  while (days.has(day)) { count++; day--; }
  return count;
}
function maxStreak(dates: readonly string[]): number {
  const days = [...new Set(dates.map(dayNumber))].sort((a, b) => a - b);
  let best = 0, run = 0, previous = -Infinity;
  for (const day of days) { run = day === previous + 1 ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  return best;
}
function maxRollingDays(dates: readonly string[]): number {
  const days = [...new Set(dates.map(dayNumber))].sort((a, b) => a - b);
  let best = 0, left = 0;
  for (let right = 0; right < days.length; right++) {
    while (days[right] - days[left] >= 30) left++;
    best = Math.max(best, right - left + 1);
  }
  return best;
}

export function parseHabit(text: string): Pick<Habit, "title" | "description" | "period" | "targetCount"> {
  const description = text.trim().replace(/\s+/g, " ");
  if (!description || description.length > 200) throw new RangeError("Habit must be 1 to 200 characters.");
  const weekly = description.match(/\b(\d+)\s*(?:times?|days?|x)\s*(?:a|per|each|every|\/)\s*week\b/i);
  const daily = /\b(?:every\s*day|daily|each\s*day)\b/i.test(description);
  if (!weekly && !daily) throw new RangeError("Include a frequency, such as '3 times a week' or 'every day'.");
  const targetCount = weekly ? Number(weekly[1]) : 1;
  if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 7) throw new RangeError("Weekly target must be between 1 and 7 days.");
  const title = description.replace(/\b\d+\s*(?:times?|days?|x)\s*(?:a|per|each|every|\/)\s*week\b/ig, "")
    .replace(/\b(?:every\s*day|daily|each\s*day)\b/ig, "").replace(/\s+/g, " ").trim()
    .replace(/^(?:i\s+(?:want|plan|need)\s+to\s+|to\s+)/i, "").replace(/[.,;:!?]+$/, "").trim();
  if (!title) throw new RangeError("Describe the habit before its frequency.");
  return { title: title.charAt(0).toUpperCase() + title.slice(1), description, period: weekly ? "weekly" : "daily", targetCount };
}

const MILESTONES = [
  { id: "first-week", name: "🌱 First Week", description: "Meet this habit's weekly target once.", required: 1, unit: "successful weeks", reward: { xp: 50, coins: 25, badge: "First Week" } },
  { id: "consistent", name: "⭐ Consistent", description: "Meet this habit's target in two weeks.", required: 2, unit: "successful weeks", reward: { xp: 60, coins: 30, badge: "Consistent", itemId: "reward-seedling", itemName: "Consistency Plant" } },
  { id: "habit-builder", name: "🔥 Habit Builder", description: "Meet this habit's target in four weeks.", required: 4, unit: "successful weeks", reward: { xp: 150, coins: 75, badge: "Habit Builder", itemId: "reward-habit-planter", itemName: "Habit Builder Tree" } },
  { id: "long-term", name: "🏆 Long-Term Habit", description: "Keep this habit for 30 days and meet four weekly goals.", required: 30, unit: "days active", reward: { xp: 100, coins: 40, badge: "Long-Term Habit", itemId: "reward-month-lamp", itemName: "Monthly Glow Lamp" } },
] as const;
const ACHIEVEMENTS = [
  { id: "new-beginning", name: "🌱 New Beginning", description: "Create your first long-term habit.", required: 1, unit: "habits", reward: { xp: 0, coins: 20, badge: "New Beginning" } },
  { id: "dedicated", name: "🎯 Dedicated", description: "Record 10 habit check-ins.", required: 10, unit: "check-ins", reward: { xp: 0, coins: 50, badge: "Dedicated" } },
  { id: "on-fire", name: "🔥 On Fire", description: "Check in on seven consecutive days.", required: 7, unit: "consecutive days", reward: { xp: 70, coins: 0, badge: "On Fire" } },
  { id: "perfect-week", name: "🏆 Perfect Week", description: "Meet every active habit's goal in the same calendar week.", required: 1, unit: "perfect weeks", reward: { xp: 90, coins: 45, badge: "Perfect Week" } },
  { id: "balanced-life", name: "🌈 Balanced Life", description: "Check in with three different habits in one week.", required: 3, unit: "habits in a week", reward: { xp: 0, coins: 0, badge: "Balanced Life", itemId: "reward-balanced-plant", itemName: "Balanced Life Plant" } },
  { id: "never-give-up", name: "🌱 Never Give Up", description: "Be active on 20 days within any 30-day window.", required: 20, unit: "days in 30", reward: { xp: 0, coins: 0, badge: "Never Give Up", itemId: "reward-resilience-chair", itemName: "Resilience Chair" } },
  { id: "habit-master", name: "💯 Habit Master", description: "Record 50 habit check-ins.", required: 50, unit: "check-ins", reward: { xp: 0, coins: 0, badge: "Habit Master", itemId: "reward-master-sofa", itemName: "Master's Sofa" } },
  { id: "lifequest-master", name: "👑 LifeQuest Master", description: "Record 100 habit check-ins.", required: 100, unit: "check-ins", reward: { xp: 0, coins: 0, badge: "LifeQuest Master", itemId: "reward-world-crown", itemName: "World Crown Monument" } },
] as const;

function entry(definition: { id: string; name: string; description: string; required: number; unit: string; reward: Reward }, id: string, progress: number, claimed: Set<string>, ready = progress >= definition.required): BoardEntry {
  return { id, name: definition.name, description: definition.description, progress: Math.min(progress, definition.required), required: definition.required,
    unit: definition.unit, reward: definition.reward, state: claimed.has(id) ? "claimed" : ready ? "ready" : "locked" };
}
export function buildBoard(habits: Habit[], claimedIds: readonly string[], today: string): HabitBoard {
  dayNumber(today);
  const active = habits.map((habit) => ({ ...habit, completionDates: habit.completionDates.filter((date) => date <= today) }));
  const claimed = new Set(claimedIds);
  const week = weekStart(today);
  const views: HabitView[] = active.map((habit) => ({ ...habit,
    currentProgress: countInWeek(habit.completionDates, week), periodTarget: periodTarget(habit),
    totalCompletions: habit.completionDates.length, currentStreak: currentStreak(habit.completionDates, today),
    successfulWeeks: successfulWeeks(habit, today), checkedToday: habit.completionDates.includes(today),
  }));
  const milestones = views.map((habit) => ({ habitId: habit.id, title: habit.title, entries: MILESTONES.map((definition) => {
    const age = dayNumber(today) - dayNumber(habit.createdAt) + 1;
    const progress = definition.id === "long-term" ? age : habit.successfulWeeks;
    return entry(definition, `habit:${habit.id}:${definition.id}`, progress, claimed,
      definition.id === "long-term" ? age >= 30 && habit.successfulWeeks >= 4 : progress >= definition.required);
  }) }));
  const dates = active.flatMap((habit) => habit.completionDates);
  const weeks = new Set(active.flatMap((habit) => habit.completionDates.map(weekStart)));
  let perfect = 0, balanced = 0;
  for (const key of weeks) {
    const existing = active.filter((habit) => habit.createdAt <= dayKey(dayNumber(key) + 6));
    if (existing.length && existing.every((habit) => countInWeek(habit.completionDates, key) >= periodTarget(habit))) perfect++;
    balanced = Math.max(balanced, existing.filter((habit) => countInWeek(habit.completionDates, key) > 0).length);
  }
  const total = active.reduce((sum, habit) => sum + habit.completionDates.length, 0);
  const metrics: Record<string, number> = { "new-beginning": active.length, dedicated: total, "on-fire": maxStreak(dates), "perfect-week": perfect,
    "balanced-life": balanced, "never-give-up": maxRollingDays(dates), "habit-master": total, "lifequest-master": total };
  return { habits: views, milestones, achievements: ACHIEVEMENTS.map((definition) => entry(definition, `global:${definition.id}`, metrics[definition.id], claimed)), claimedIds: [...claimed] };
}
export function findReward(board: HabitBoard, id: string): BoardEntry | undefined {
  return [...board.achievements, ...board.milestones.flatMap((group) => group.entries)].find((reward) => reward.id === id);
}
