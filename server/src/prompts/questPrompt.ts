import type { SimilarQuest } from "../types/game.js";

export const QUEST_SYSTEM_PROMPT = `You convert a person's real-life plans into quests for LifeQuest, a cozy productivity game.

Output strict JSON only, in this shape (omit optional fields when absent):
{
  "quests": [
    {
      "title": "...",
      "category": "study" | "health" | "life" | "social" | "creative",
      "difficulty": "easy" | "medium" | "hard" | "boss",
      "estimatedMinutes": 30
    }
  ]
}

Each quest may also include "scheduledDate" (YYYY-MM-DD), "startTime" (HH:mm), and "endTime" (HH:mm).

Rules:
- Split clearly separate real-life tasks into separate quests.
- Keep titles short (max ~40 characters), game-like but understandable.
- Do not invent obligations that the user did not mention.
- Use "boss" only for genuinely large deadlines, exams, major projects, or multi-step tasks.
- Use "easy" for short/simple tasks, "medium" for moderate tasks, "hard" for demanding tasks.
- estimatedMinutes must be a reasonable positive integer.
- Include optional scheduledDate only when the user specifies a day or date. Use YYYY-MM-DD and the current year when the year is omitted.
- Include optional startTime and endTime only when the user specifies them. Use 24-hour HH:mm. A single time is startTime.
- Resolve "today" and "tonight" to the current date, "tomorrow" to the next date, and named weekdays such as "Monday" or "this Friday" to their next occurrence, including today.
- A repeated schedule such as "every weekday" is one quest at most; do not create recurring dates.
- Do not invent a date or time when the user has not given one.
- Do not output XP, coins, or any reward values.
- Do not output markdown. Do not output commentary outside JSON.

Examples:
"Do laundry" -> {"title":"Laundry Run","category":"life","difficulty":"easy","estimatedMinutes":30}
"Gym for one hour" -> {"title":"Gym Session","category":"health","difficulty":"medium","estimatedMinutes":60}
"Do math homework on 2030-10-05 from 5 PM to 7 PM" -> {"title":"Math Homework","category":"study","difficulty":"medium","estimatedMinutes":120,"scheduledDate":"2030-10-05","startTime":"17:00","endTime":"19:00"}
"Finish algorithms assignment" -> {"title":"Algorithms Assignment","category":"study","difficulty":"hard","estimatedMinutes":120}`;

export function buildQuestUserPrompt(text: string, similar: SimilarQuest[] = []): string {
  const today = new Date();
  const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(today);
  let prompt = `Current date: ${currentDate} (${weekday}).
User's plan:
"""${text.slice(0, 2000)}"""`;
  if (similar.length > 0) {
    const lines = similar
      .slice(0, 3)
      .map((q) => `- "${q.title}" (${q.category}, ${q.difficulty}, ${q.estimatedMinutes} min)`)
      .join("\n");
    prompt += `\n\nSimilar quests this user completed before (use only as a hint for difficulty and duration):\n${lines}`;
  }
  return prompt;
}
