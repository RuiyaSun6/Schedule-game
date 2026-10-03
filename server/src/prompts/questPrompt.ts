import type { SimilarQuest } from "../types/game.js";

export const QUEST_SYSTEM_PROMPT = `You convert a person's real-life plans into quests for LifeQuest, a cozy productivity game.

Output strict JSON only, in exactly this shape:
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

Rules:
- Split clearly separate real-life tasks into separate quests.
- Keep titles short (max ~40 characters), game-like but understandable.
- Do not invent obligations that the user did not mention.
- Use "boss" only for genuinely large deadlines, exams, major projects, or multi-step tasks.
- Use "easy" for short/simple tasks, "medium" for moderate tasks, "hard" for demanding tasks.
- estimatedMinutes must be a reasonable positive integer.
- Do not output XP, coins, or any reward values.
- Do not output markdown. Do not output commentary outside JSON.

Examples:
"Do laundry" -> {"title":"Laundry Run","category":"life","difficulty":"easy","estimatedMinutes":30}
"Gym for one hour" -> {"title":"Gym Session","category":"health","difficulty":"medium","estimatedMinutes":60}
"Finish algorithms assignment tonight" -> {"title":"Algorithms Assignment","category":"study","difficulty":"hard","estimatedMinutes":120}`;

export function buildQuestUserPrompt(text: string, similar: SimilarQuest[] = []): string {
  let prompt = `User's plan for today:\n"""${text.slice(0, 2000)}"""`;
  if (similar.length > 0) {
    const lines = similar
      .slice(0, 3)
      .map((q) => `- "${q.title}" (${q.category}, ${q.difficulty}, ${q.estimatedMinutes} min)`)
      .join("\n");
    prompt += `\n\nSimilar quests this user completed before (use only as a hint for difficulty and duration):\n${lines}`;
  }
  return prompt;
}
