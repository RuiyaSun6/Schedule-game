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
  { title: 'Plan Your Week', text: 'Tell LifeQuest what you need to do this week. Your plan will become quests that you can complete for rewards.', target: 'weekly-plan', route: '/home', computerTab: 'plan' },
  { title: 'Generate Quests', text: 'Turn your weekly plan into quests with dates, times, XP, and coin rewards.', target: 'generate-quests', route: '/home', computerTab: 'plan' },
  { title: 'Build Habits', text: 'Create habits you want to maintain over time. Check them off as you make progress.', target: 'long-term-habits', route: '/home', computerTab: 'plan' },
  { title: 'Your Quests', text: 'See your active quests here and complete them when you finish the real-life task.', target: 'quests', route: '/home', computerTab: 'quests' },
  { title: 'Your Calendar', text: 'Your scheduled quests appear on the calendar so you can see what you need to do each day.', target: 'calendar', route: '/home', computerTab: 'calendar' },
  { title: 'Your World', text: 'Use this door to go outside to your world.', target: 'world', route: '/home' },
  { title: 'Explore Your World', text: 'Drag the map to explore your world. Your home starts in the center, and your world can grow as you progress.', target: 'world-viewport', route: '/world' },
  { title: 'Furniture Shop', text: 'Open the Furniture Shop to buy furniture and decorations for your rooms.', target: 'furniture-shop', route: '/world' },
  { title: 'Building Shop', text: 'Open the Building Shop to discover buildings you can add to your world.', target: 'building-shop', route: '/world' },
  { title: 'Move Buildings', text: 'Want to redesign your world? Turn on Move Buildings, then reposition your buildings.', target: 'move-buildings', route: '/world' },
  { title: 'Return Home', text: 'Lost while exploring? Press this button to move the camera back to your home area. It does not enter the house.', target: 'return-home', route: '/world' },
  { title: 'Your Home', text: 'Click your house to go inside. Your home is where you can plan, decorate, and view your rewards.', target: 'home', route: '/world' },
  { title: 'Personal Computer', text: 'Use your computer to plan your week, generate quests, check your calendar, and manage long-term habits.', target: 'computer', route: '/home' },
  { title: 'Reward Board', text: 'Build habits to unlock milestones and achievements. Come here to claim rewards and collect badges.', target: 'reward-board', route: '/home' },
  { title: 'Backpack', text: 'Open your Backpack to see the items you own and place furniture in your room.', target: 'backpack', route: '/home' },
  { title: 'Decorate Your Home', text: 'Turn on Move Objects to rearrange furniture and make your room your own.', target: 'move-objects', route: '/home' },
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
