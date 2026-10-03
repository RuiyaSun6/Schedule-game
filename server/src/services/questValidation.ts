import {
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  type QuestCategory,
  type QuestDifficulty,
  type QuestDraft,
} from "../types/game.js";

const MIN_MINUTES = 5;
const MAX_MINUTES = 480;
const MAX_QUESTS = 10;
const MAX_TITLE = 60;

const DEFAULT_MINUTES: Record<QuestDifficulty, number> = { easy: 30, medium: 60, hard: 120, boss: 240 };

function normalizeCategory(value: unknown): QuestCategory {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (QUEST_CATEGORIES as string[]).includes(v) ? (v as QuestCategory) : "life";
}

function normalizeDifficulty(value: unknown): QuestDifficulty {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (QUEST_DIFFICULTIES as string[]).includes(v) ? (v as QuestDifficulty) : "medium";
}

/** Repairs one quest with safe defaults, or returns null if it has no usable title. */
export function validateQuestDraft(raw: unknown): QuestDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;

  const title = typeof q.title === "string" ? q.title.trim().slice(0, MAX_TITLE) : "";
  if (!title) return null;

  const difficulty = normalizeDifficulty(q.difficulty);
  const minutes = Number(q.estimatedMinutes);
  const estimatedMinutes = Number.isFinite(minutes) && minutes > 0
    ? Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(minutes)))
    : DEFAULT_MINUTES[difficulty];

  return { title, category: normalizeCategory(q.category), difficulty, estimatedMinutes };
}

/**
 * Parses Gemini's raw text into validated drafts.
 * Returns null when the whole response is unusable (caller should use mock fallback).
 */
export function parseQuestDrafts(rawText: string): QuestDraft[] | null {
  let parsed: unknown;
  try {
    // Tolerate accidental ```json fences.
    const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  const list = Array.isArray(parsed) ? parsed : (parsed as { quests?: unknown })?.quests;
  if (!Array.isArray(list)) return null;

  const drafts = list
    .map(validateQuestDraft)
    .filter((q): q is QuestDraft => q !== null)
    .slice(0, MAX_QUESTS);
  return drafts.length > 0 ? drafts : null;
}
