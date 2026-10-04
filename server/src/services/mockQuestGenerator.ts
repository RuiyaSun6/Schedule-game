import type { QuestCategory, QuestDifficulty, QuestDraft } from "../types/game.js";

// Rule-based fallback used when Gemini is unavailable, so the demo never breaks.
// Splits the user's text into tasks and builds titles from the user's own words.

const MAX_QUESTS = 10;
const MAX_TITLE = 40;

// Task separators: commas, semicolons, newlines, sentence ends, "&", and/then/also/plus.
const SEPARATOR = /(?:\s*(?:[,;\n]|\.(?:\s|$)|&|\b(?:and|then|also|plus)\b)\s*)+/i;
const FILLER = /^(?:(?:i|we)\s+(?:need|have|want|plan|gotta)\s+to\s+|(?:i\s+)?(?:should|must|will|need\s+to|have\s+to)\s+|to\s+|please\s+)+/i;
const TIME_WORDS = /\s*\b(?:later|asap|now)\b\s*$/i;

// Dates and clock times belong in schedule fields, not titles. Removed before splitting,
// which also keeps the dot in "a.m." from being read as a sentence end.
const CLOCK = String.raw`\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\b\.?)?`;
const SCHEDULE_PHRASES: RegExp[] = [
  /\b(?:on\s+)?\d{4}-\d{2}-\d{2}\b/gi,
  new RegExp(String.raw`\b(?:from\s+)?${CLOCK}\s*(?:-|to|until)\s*\d{1,2}(?::\d{2}\s*(?:[ap]\.?m\b\.?)?|\s*[ap]\.?m\b\.?)`, "gi"),
  /\b(?:at|by|around|before|after)?\s*\d{1,2}(?::\d{2})?\s*[ap]\.?m\b\.?/gi,
  /\b(?:at|by|around|before|after)\s+(?:\d{1,2}:\d{2}|noon|midnight)\b/gi,
  /\b(?:on\s+|this\s+|next\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day\b/gi,
  /\b(?:today|tonight|tomorrow|this\s+(?:morning|afternoon|evening|week|weekend))\b/gi,
];
const ARTICLE = /^(?:the|a|an|my|our)\s+/i;

// Leading verb phrase. A fragment without one (e.g. "physics exam" in
// "prepare for math exam and physics exam") inherits the previous fragment's verb.
const VERB =
  /^(prepare\s+for|study\s+for|review\s+for|cram\s+for|get\s+ready\s+for|work\s+on|finish|complete|start|do|go\s+to|go|head\s+to|hit|call|text|email|meet(?:\s+up)?\s+with|meet|visit|clean|tidy(?:\s+up)?|wash|cook|buy|pick\s+up|write|read|review|study|practice|submit|attend|walk|run)\b\s*/i;
const PREP_VERBS = /^(?:prepare|study|review|cram|get\s+ready)\s+for$/i;
// Verbs that add nothing to the title: "do laundry" -> "Laundry", "go to the gym" -> "Gym".
const SILENT_VERBS = /^(?:work\s+on|finish|complete|start|do|go\s+to|go|head\s+to|hit|attend)$/i;

interface Classifier {
  pattern: RegExp;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  minutes: number;
}

// First match wins, so study rules come before "write"/"run" style generic verbs.
const CLASSIFIERS: Classifier[] = [
  { pattern: /\b(?:exams?|finals?|midterms?|thesis|capstone|project)\b/i, category: "study", difficulty: "boss", minutes: 180 },
  { pattern: /\b(?:assignment|homework|essay|problem\s+set|lab\s+report|paper)\b/i, category: "study", difficulty: "hard", minutes: 120 },
  { pattern: /\b(?:study|lecture|class|course|quiz|read|reading|chapter|textbook|notes|math|physics|chemistry|biology|history)\b/i, category: "study", difficulty: "medium", minutes: 60 },
  { pattern: /\b(?:gym|work\s*out|run|running|exercise|yoga|swim|hike|bike|lift)\b/i, category: "health", difficulty: "medium", minutes: 60 },
  { pattern: /\b(?:walk|stretch|meditate|sleep)\b/i, category: "health", difficulty: "easy", minutes: 30 },
  { pattern: /\b(?:laundry|clean|tidy|dishes|groceries|cook|vacuum|trash|errands?)\b/i, category: "life", difficulty: "easy", minutes: 30 },
  { pattern: /\b(?:call|text|meet|friends?|family|mom|dad|grandma|grandpa|visit)\b/i, category: "social", difficulty: "easy", minutes: 20 },
  { pattern: /\b(?:draw|paint|write|music|guitar|piano|sing|design|photo)\b/i, category: "creative", difficulty: "medium", minutes: 45 },
];
const DEFAULT_CLASS = { category: "life", difficulty: "medium", minutes: 45 } as const;

const SUFFIX: Record<QuestCategory, string> = {
  study: "Study Sprint",
  health: "Power Up",
  life: "Chore Quest",
  social: "Friendship Boost",
  creative: "Creative Spark",
};

const SMALL_WORDS = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "or", "the", "to", "with"]);
function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

function parseMinutes(text: string): number | null {
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const minutes = text.match(/(\d+)\s*-?\s*(?:m|mins?|minutes?)\b/i);
  if (minutes) return Number(minutes[1]);
  if (/\bhalf\s+an?\s+hour\b/i.test(text)) return 30;
  if (/\b(?:an|one)\s+hour\b/i.test(text)) return 60;
  return null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max);
}

export function splitTasks(text: string): string[] {
  const withoutSchedule = SCHEDULE_PHRASES.reduce((acc, pattern) => acc.replace(pattern, " "), text);
  return withoutSchedule
    .split(SEPARATOR)
    .map((part) => part.replace(/\s+/g, " ").trim().replace(FILLER, "").replace(TIME_WORDS, "").trim())
    .filter((part) => part.length > 0);
}

const classify = (text: string) => CLASSIFIERS.find((c) => c.pattern.test(text));

export function generateMockQuestDrafts(text: string): QuestDraft[] {
  const drafts: QuestDraft[] = [];
  let previousVerb = "";
  let previousCategory: QuestCategory | undefined;

  for (const fragment of splitTasks(text).slice(0, MAX_QUESTS)) {
    const verbMatch = fragment.match(VERB);
    let object = (verbMatch ? fragment.slice(verbMatch[0].length) : fragment).trim();
    // Inherit only for the same kind of thing ("math exam and physics exam", "buy milk and eggs"),
    // so "study for quiz, then laundry" does not become "Laundry Prep".
    const ownCategory = classify(object)?.category;
    const inherits = !verbMatch && (ownCategory === undefined || ownCategory === previousCategory);
    const verb = (verbMatch?.[1] ?? (inherits ? previousVerb : "")).replace(/\s+/g, " ");
    if (verbMatch || !inherits) previousVerb = verb;
    if (!object && !verb) continue;
    // Drop the article only when the verb is dropped too: "go to the gym" -> "Gym", but "Walk the Dog".
    if (!verb || PREP_VERBS.test(verb) || SILENT_VERBS.test(verb)) object = object.replace(ARTICLE, "");

    let content: string;
    if (!object) content = verb;
    else if (PREP_VERBS.test(verb)) content = `${object} Prep`;
    else if (!verb || SILENT_VERBS.test(verb)) content = object;
    else content = `${verb} ${object}`;
    content = truncate(titleCase(content), MAX_TITLE);

    const fullText = `${verb} ${object}`;
    const match = classify(fullText) ?? DEFAULT_CLASS;
    previousCategory = match.category;
    const suffix = SUFFIX[match.category];
    const title = content.length + suffix.length + 2 <= MAX_TITLE ? `${content}: ${suffix}` : content;
    const minutes = parseMinutes(fullText) ?? match.minutes;

    drafts.push({
      title,
      category: match.category,
      difficulty: match.difficulty,
      estimatedMinutes: Math.min(480, Math.max(5, minutes)),
    });
  }

  if (drafts.length > 0) return drafts;
  return [{ title: truncate(text.trim(), MAX_TITLE) || "Today's Plan", category: "life", difficulty: "medium", estimatedMinutes: 45 }];
}
