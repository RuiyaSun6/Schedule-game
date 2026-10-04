# Person 3: Gemini / TiDB / AI integration

## What's in this folder

| File | Doc prompt | What it does |
|---|---|---|
| `src/services/geminiService.ts` | P1 | `generateQuestsFromText(user, text, similar?)` returns `{ source, quests }`. Falls back to mock when the key is missing, the call times out (12s), or the JSON is bad. Never throws. |
| `src/prompts/questPrompt.ts` | P2 | System prompt plus a user prompt that includes similar past quests |
| `src/services/questValidation.ts` | P7 | Validates and repairs Gemini output: category/difficulty whitelist, minutes clamped to 5-480 |
| `src/services/mockQuestGenerator.ts` | P1 | Keyword-matching fallback |
| `src/db/schema.sql`, `src/db/tidb.ts` | P4 | Tables, connection pool, transaction helper, `checkTiDBConnection()` |
| `src/repositories/*.ts` | P5 | player / quest / item repositories. `completeQuest` and `purchaseItem` run in transactions so rewards and charges happen only once. |
| `src/services/questMemoryService.ts` | P6 | TiDB Vector Search Quest Memory (optional; returns [] on failure) |

## Setup

```bash
cd server
npm install
cp .env.example .env              # add GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm run test:ai                   # source should read "gemini"
# TiDB Cloud Serverless: create a free cluster -> Connect -> copy host/user/password into .env
npm run db:init                   # create tables and seed items/demo-user
```

## P3: hooking into Person 2's route (once their backend is merged)

```ts
// questController.ts: POST /api/quests/generate
import { randomUUID } from "node:crypto";
import { generateQuestsFromText } from "../services/geminiService.js";
import { findSimilarCompletedQuests } from "../services/questMemoryService.js";
import { getRewards } from "../services/rewardService.js"; // Person 2

const { userId, text } = req.body ?? {};
if (!userId || typeof text !== "string" || !text.trim())
  return res.status(400).json({ error: "userId and text are required" });
const player = await storage.getPlayer(userId);
if (!player) return res.status(404).json({ error: "Player not found" });

const similar = await findSimilarCompletedQuests(userId, text);   // optional
const { source, quests: drafts } = await generateQuestsFromText(player, text, similar);
const quests = drafts.map((d) => {
  // rewards come from backend rules, not Gemini
  return { ...d, id: randomUUID(), userId, ...getRewards(d.difficulty), completed: false };
});
await storage.addQuests(quests);
res.json({ source, quests });
```

After a quest completes, call `rememberCompletedQuest(quest)` without awaiting it, so it can be found in Vector Search later.

## Switching storage

In Person 2's `storageService.ts`, check `await checkTiDBConnection()` at startup:
use the repositories when it returns true, otherwise keep the in-memory Maps. Controllers and response shapes stay the same.
