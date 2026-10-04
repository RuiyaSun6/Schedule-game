import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import type { Player, QuestDraft, SimilarQuest } from "../types/game.js";
import { QUEST_SYSTEM_PROMPT, buildQuestUserPrompt } from "../prompts/questPrompt.js";
import { parseQuestDrafts } from "./questValidation.js";
import { generateMockQuestDrafts } from "./mockQuestGenerator.js";

export interface GeneratedQuestResult {
  source: "gemini" | "mock-fallback";
  quests: QuestDraft[];
}

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const TIMEOUT_MS = 12_000;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/**
 * Turns natural-language plans into quest drafts (title/category/difficulty/minutes).
 * Never throws and never decides rewards: rewardService assigns XP and coins afterwards.
 */
export async function generateQuestsFromText(
  user: Pick<Player, "id">,
  text: string,
  similarTaskContext: SimilarQuest[] = [],
): Promise<GeneratedQuestResult> {
  const fallback = (reason: string): GeneratedQuestResult => {
    console.warn(`[gemini] using mock fallback for ${user.id}: ${reason}`);
    return { source: "mock-fallback", quests: generateMockQuestDrafts(text) };
  };

  const ai = getClient();
  if (!ai) return fallback("GEMINI_API_KEY not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildQuestUserPrompt(text, similarTaskContext),
      config: {
        systemInstruction: QUEST_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
        abortSignal: controller.signal,
      },
    });
    const quests = parseQuestDrafts(response.text ?? "");
    if (!quests) return fallback("invalid JSON from Gemini");
    return { source: "gemini", quests };
  } catch (err) {
    return fallback(controller.signal.aborted ? "timeout" : (err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}

/** Embedding for Quest Memory (TiDB Vector Search). Returns null on any failure. */
export const EMBEDDING_DIMENSIONS = 768;
export async function embedText(text: string): Promise<number[] | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const res = await ai.models.embedContent({
      model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const values = res.embeddings?.[0]?.values;
    return values && values.length === EMBEDDING_DIMENSIONS ? values : null;
  } catch (err) {
    console.warn(`[gemini] embedding failed: ${(err as Error).message}`);
    return null;
  }
}
