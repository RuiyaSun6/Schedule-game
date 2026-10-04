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

Splitting rules:
- Every distinct subject, object, or activity becomes its own quest, even when they share one verb.
  "prepare for X and Y" means two quests: one for X and one for Y.
- Items joined by "and", commas, "then", or "also" are separate quests when they name different things.
- Do not invent obligations that the user did not mention. Never add extra quests.

Title rules:
- Format: <specific content> + optional fun suffix, e.g. "Math Exam Prep: Equation Duel".
- The title MUST contain the key nouns the user mentioned (subject, object, place, person, duration).
- Fun words are decoration only; they never replace the specific content.
- Never use vague titles that hide what the task is, such as "Big Project", "Boss Battle", "Study Quest", "Daily Challenge".
- Keep titles within about 40 characters.

Good titles: "Math Exam Prep: Equation Duel", "Physics Exam Prep: Force of Focus", "Laundry Quest: Sock Rescue", "Gym Raid: 60-Minute Power Run"
Bad titles: "Boss Battle: Big Project", "Study Quest", "Daily Challenge"

Other rules:
- Use "boss" only for genuinely large deadlines, exams, major projects, or multi-step tasks.
- Use "easy" for short/simple tasks, "medium" for moderate tasks, "hard" for demanding tasks.
- estimatedMinutes must be a reasonable positive integer.
- Do not output XP, coins, or any reward values.
- Do not output markdown. Do not output commentary outside JSON.

Examples:
"Do laundry" -> {"quests":[{"title":"Laundry Quest: Sock Rescue","category":"life","difficulty":"easy","estimatedMinutes":30}]}
"Gym for one hour" -> {"quests":[{"title":"Gym Raid: 60-Minute Power Run","category":"health","difficulty":"medium","estimatedMinutes":60}]}
"Finish algorithms assignment tonight" -> {"quests":[{"title":"Algorithms Assignment: Code Crusade","category":"study","difficulty":"hard","estimatedMinutes":120}]}
"prepare for math exam and physics exam" -> {"quests":[{"title":"Math Exam Prep: Equation Duel","category":"study","difficulty":"boss","estimatedMinutes":180},{"title":"Physics Exam Prep: Force of Focus","category":"study","difficulty":"boss","estimatedMinutes":180}]}`;

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
