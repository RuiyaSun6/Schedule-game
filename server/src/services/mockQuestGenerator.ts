import type { QuestCategory, QuestDifficulty, QuestDraft } from "../types/game.js";
import { randomCompletionLine } from "./completionLine.js";
import { MAX_GENERATED_QUESTS } from "./questGenerationLimits.js";

// Rule-based fallback used when Gemini is unavailable, so the demo never breaks.
// Splits the user's text into tasks and builds titles from the user's own words.

const MAX_TITLE = 40;

// Task separators: commas, semicolons, newlines, sentence ends, "&", and/then/also/plus.
const SEPARATOR = /(?:\s*(?:[,;\n]|\.(?:\s|$)|&|\b(?:and|then|also|plus)\b)\s*)+/i;
const FILLER = /^(?:(?:i|we)\s+(?:need|have|want|plan|gotta)\s+to\s+|(?:i\s+)?(?:should|must|will|need\s+to|have\s+to)\s+|to\s+|please\s+)+/i;
const TIME_WORDS = /\s*\b(?:later|asap|now)\b\s*$/i;

// Dates and clock times belong in schedule fields, not titles.
const CLOCK = String.raw`\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\b\.?)?`;
const MONTH_NAMES = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const MONTH_DATE = new RegExp(String.raw`\b(?:on\s+)?(${MONTH_NAMES})\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b`, "i");
const SCHEDULE_PHRASES: RegExp[] = [
  /\b(?:on\s+)?\d{4}-\d{2}-\d{2}\b/gi,
  new RegExp(MONTH_DATE.source, "gi"),
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

function taskFragments(text: string): { content: string; schedule: string }[] {
  // Keep schedule words beside their task until after splitting. Otherwise two
  // weekdays in one plan cannot be assigned to the right quests.
  return text.replace(/\b([ap])\.m\./gi, "$1m").split(SEPARATOR)
    .map((schedule) => ({
      schedule,
      content: SCHEDULE_PHRASES.reduce((part, pattern) => part.replace(pattern, " "), schedule)
        .replace(/\s+/g, " ").trim().replace(FILLER, "").replace(TIME_WORDS, "").trim(),
    }))
    .filter(({ content }) => content.length > 0);
}

export function splitTasks(text: string): string[] {
  return taskFragments(text).map(({ content }) => content);
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function scheduleFor(fragment: string, today: Date): Pick<QuestDraft, "scheduledDate" | "startTime" | "endTime"> {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const explicit = fragment.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const monthDate = fragment.match(MONTH_DATE);
  let scheduledDate: string | undefined;
  if (explicit) {
    const parsed = new Date(`${explicit[0]}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === explicit[0]) scheduledDate = explicit[0];
  } else if (monthDate) {
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
      .findIndex((name) => monthDate[1].toLowerCase().startsWith(name));
    const year = monthDate[3] ? Number(monthDate[3]) : date.getFullYear();
    const day = Number(monthDate[2]);
    const parsed = new Date(year, month, day);
    if (parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day) scheduledDate = localDateKey(parsed);
  } else if (/\b(?:today|tonight)\b/i.test(fragment)) {
    scheduledDate = localDateKey(date);
  } else if (/\btomorrow\b/i.test(fragment)) {
    date.setDate(date.getDate() + 1);
    scheduledDate = localDateKey(date);
  } else {
    const weekday = fragment.match(/\b(?:this\s+|next\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
    if (weekday) {
      const target = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(weekday[1].toLowerCase());
      date.setDate(date.getDate() + (target - date.getDay() + 7) % 7);
      scheduledDate = localDateKey(date);
    }
  }

  const parseTime = (value: string, marker?: string): string | undefined => {
    const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?$/i);
    if (!match) return undefined;
    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const period = (match[3] ?? marker)?.toLowerCase();
    if (minutes > 59 || hours > (period ? 12 : 23) || (period && hours === 0)) return undefined;
    if (period) hours = hours % 12 + (period === "pm" ? 12 : 0);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };
  const range = fragment.match(/\bfrom\s+(\d{1,2}(?::\d{2})?\s*(?:[ap]m)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:[ap]m)?)/i);
  if (range) {
    const endMarker = range[2].match(/[ap]m/i)?.[0];
    return { scheduledDate, startTime: parseTime(range[1], endMarker), endTime: parseTime(range[2]) };
  }
  const single = fragment.match(/\b(?:at|by|around)\s+(\d{1,2}(?::\d{2})?\s*[ap]m|\d{1,2}:\d{2})\b/i);
  return { scheduledDate, ...(single && { startTime: parseTime(single[1]) }) };
}

/** Attach explicit per-task schedule phrases to AI drafts when task counts align. */
export function resolveQuestSchedules(text: string, drafts: QuestDraft[], today = new Date()): QuestDraft[] {
  const fragments = taskFragments(text);
  if (fragments.length !== drafts.length) return drafts;
  return drafts.map((draft, index) => {
    const { scheduledDate, startTime, endTime } = scheduleFor(fragments[index].schedule, today);
    return {
      ...draft,
      ...(scheduledDate && { scheduledDate }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
    };
  });
}

const classify = (text: string) => CLASSIFIERS.find((c) => c.pattern.test(text));

export function generateMockQuestDrafts(text: string, today = new Date()): QuestDraft[] {
  const drafts: QuestDraft[] = [];
  let previousVerb = "";
  let previousCategory: QuestCategory | undefined;

  for (const { content: fragment, schedule } of taskFragments(text).slice(0, MAX_GENERATED_QUESTS)) {
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
      ...scheduleFor(schedule, today),
      completionLine: randomCompletionLine(title),
    });
  }

  if (drafts.length > 0) return drafts;
  const title = truncate(text.trim(), MAX_TITLE) || "Today's Plan";
  return [{ title, category: "life", difficulty: "medium", estimatedMinutes: 45, completionLine: randomCompletionLine(title) }];
}
