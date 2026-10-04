export interface TutorialStep {
  title: string;
  text: string;
  detail?: string;
  target?: string;
  route: '/home' | '/world';
  computerTab?: 'plan' | 'quests' | 'calendar';
}

export const tutorialSteps: readonly TutorialStep[] = [
  { title: 'Welcome to LifeQuest!', text: 'Turn your real-life plans into quests, complete them, and grow your world.', route: '/home' },
  { title: 'Plan with AI', text: 'Tell LifeQuest what you need to do. Your plans can be turned into quests with dates and times automatically.', detail: 'Try: “Study math tomorrow from 5 PM to 7 PM.”', target: 'ai-plan', route: '/home', computerTab: 'plan' },
  { title: 'Your Quests', text: 'Your plans become quests. Complete them to earn XP and coins. XP helps you level up; spend coins on items.', target: 'quests', route: '/home', computerTab: 'quests' },
  { title: 'Calendar', text: 'Scheduled quests appear here automatically, so you can see what you need to do each day.', target: 'calendar', route: '/home', computerTab: 'calendar' },
  { title: 'Your World', text: 'Head outside to your personal world. As you progress, you can explore and customize it.', target: 'world', route: '/home' },
  { title: 'Explore the Map', text: 'Click and drag empty ground to move around your world. There are nine regions beyond your starting view. Try dragging now!', target: 'world-viewport', route: '/world' },
  { title: 'Move Buildings', text: 'Normal dragging moves the camera. Use Move Buildings mode when you want to reposition buildings instead.', target: 'move-buildings', route: '/world' },
  { title: 'Return Home', text: 'Explored too far? Press this house button to return to your starting area.', target: 'home', route: '/world' },
  { title: 'Shop', text: 'Use this Shop shortcut to spend the coins you earn from quests on items and decorations.', target: 'shop', route: '/home' },
  { title: "You're Ready!", text: 'Plan your day, complete quests, earn rewards, and build your world.', route: '/home' },
];

export function tutorialStorageKey(playerId: string): string {
  return `lifequest:tutorial:v1:${playerId}`;
}

export function hasCompletedTutorial(storage: Pick<Storage, 'getItem'>, playerId: string): boolean {
  return storage.getItem(tutorialStorageKey(playerId)) === 'done';
}

export function markTutorialComplete(storage: Pick<Storage, 'setItem'>, playerId: string): void {
  storage.setItem(tutorialStorageKey(playerId), 'done');
}
