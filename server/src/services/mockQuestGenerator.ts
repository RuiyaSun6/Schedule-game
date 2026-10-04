import type { QuestDraft } from "../types/game.js";
import { randomCompletionLine } from "./completionLine.js";

interface Rule {
  pattern: RegExp;
  draft: Omit<QuestDraft, "completionLine">;
}

// Keyword rules used when Gemini is unavailable, so the demo never breaks.
const RULES: Rule[] = [
  { pattern: /exam|final|midterm|thesis|project/i, draft: { title: "Boss Battle: Big Project", category: "study", difficulty: "boss", estimatedMinutes: 240 } },
  { pattern: /assignment|homework|algorithm|essay|study|lecture|problem set/i, draft: { title: "Algorithms Assignment", category: "study", difficulty: "hard", estimatedMinutes: 120 } },
  { pattern: /gym|work ?out|run|exercise|yoga|swim/i, draft: { title: "Workout Session", category: "health", difficulty: "medium", estimatedMinutes: 60 } },
  { pattern: /clean|tidy|laundry|dishes|groceries|cook/i, draft: { title: "Tidy Up Home Base", category: "life", difficulty: "easy", estimatedMinutes: 30 } },
  { pattern: /call|text|meet|friend|family|mom|dad/i, draft: { title: "Check In With a Friend", category: "social", difficulty: "easy", estimatedMinutes: 20 } },
  { pattern: /draw|paint|write|music|guitar|piano|design/i, draft: { title: "Creative Session", category: "creative", difficulty: "medium", estimatedMinutes: 45 } },
];

export function generateMockQuestDrafts(text: string): QuestDraft[] {
  const matches = RULES.filter((r) => r.pattern.test(text)).map((r) => ({ ...r.draft, completionLine: randomCompletionLine(r.draft.title) }));
  if (matches.length > 0) return matches;
  const title = text.trim().slice(0, 40) || "Daily Quest";
  return [{ title, category: "life", difficulty: "medium", estimatedMinutes: 45, completionLine: randomCompletionLine(title) }];
}
