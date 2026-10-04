// Companion lines shown when a quest is completed. Gemini writes them with the quest;
// these helpers validate them and provide template fallbacks.

export const MAX_COMPLETION_LINE = 100;

// "Math Exam Prep: Equation Duel" -> "Math Exam Prep", so templates stay short.
const subjectOf = (title: string) => title.split(":")[0].trim() || title.trim();

const TEMPLATES: ((subject: string) => string)[] = [
  (s) => `You finished ${s}! The world feels a little brighter.`,
  (s) => `${s}, done! I'm doing a happy little tail wiggle.`,
  (s) => `Look at you, wrapping up ${s}! Time for a cozy break.`,
  (s) => `${s} complete! I knew you could do it.`,
];

function truncate(text: string): string {
  if (text.length <= MAX_COMPLETION_LINE) return text;
  const cut = text.slice(0, MAX_COMPLETION_LINE - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[\s,;:.!-]+$/, "")}…`;
}

/** Deterministic fallback, used when Gemini's line is missing or invalid. */
export function fallbackCompletionLine(title: string): string {
  return truncate(TEMPLATES[0](subjectOf(title)));
}

/** Random template, used by the mock generator so repeated quests do not all sound the same. */
export function randomCompletionLine(title: string, random = Math.random): string {
  const template = TEMPLATES[Math.floor(random() * TEMPLATES.length)] ?? TEMPLATES[0];
  return truncate(template(subjectOf(title)));
}

/** Returns a single-line, non-empty line within the length limit, or the template fallback. */
export function normalizeCompletionLine(value: unknown, title: string): string {
  const line = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return line ? truncate(line) : fallbackCompletionLine(title);
}
