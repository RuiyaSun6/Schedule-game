# LifeQuest backend

Express and TypeScript API for the LifeQuest MVP. It runs on port **5001** by default. Set `PORT` in a local `.env` file to override that port. CORS and JSON request bodies are enabled.

## Run locally

From the `server` directory:

```sh
npm install
npm run dev
```

For a compiled run:

```sh
npm run build
npm start
```

On Windows PowerShell, use `npm.cmd` in place of `npm` if script execution policy blocks `npm.ps1`. The base URL with the default port is `http://localhost:5001`.

**Storage selection:** With `TIDB_HOST` configured, run `npm run db:init` and the HTTP API uses TiDB for players, quests, and purchases. Without `TIDB_HOST`, it uses in-memory storage; progress then resets whenever the server restarts. There is one shared API player (`player-1`) and no authentication or per-user state yet. A configured TiDB connection must be available at startup.

**Tests:** `npm run typecheck`, `npm run test:mock` (unit tests for the mock generator and `completionLine` validation), `npm run test:http`, `npm run test:api` (end-to-end, in-memory; add `-- tidb` to run against TiDB, which restores `player-1` and deletes its test quests afterwards), and `npm run test:db` (TiDB repositories). `test:api` and `test:http` blank `GEMINI_API_KEY`, so they use no Gemini quota; `npm run test:ai` makes one real Gemini call.

## API conventions

Send `Content-Type: application/json` for POST requests with a body. Successful GET and completion/purchase requests return `200 OK`; quest creation returns `201 Created`. Errors return JSON in the form `{ "error": "message" }`. Malformed JSON and invalid request bodies return `400`; missing IDs and unknown endpoints return `404`; already completed quests, already owned items, and insufficient coins return `409`. Oversized request bodies can return `413`, unsupported encodings can return `415`, and unexpected server errors return `500`. The API uses the singular path `/api/player`.

### `GET /api/health`

Returns `200`:

```json
{ "ok": true }
```

### `GET /api/player`

Returns the current player (`200`). At startup:

```json
{
  "id": "player-1",
  "xp": 0,
  "level": 1,
  "coins": 0,
  "unlockedAreas": ["village"],
  "ownedItems": [],
  "itemCounts": {}
}
```

`ownedItems` contains distinct item **IDs** (oldest purchase first), not full item objects. Resolve them against `GET /api/items` to display item details. `itemCounts` maps each owned ID to how many the player owns: always 1 for regular items, 1 or more for stackable items (for example `{ "lamp-gold": 1, "crop-carrot": 3 }`). Clients that only need ownership can keep using `ownedItems`.

### `GET /api/quests`

Returns all quests as an array (`200`), including active and completed quests. The initial response is `[]`.

**Optional `completionLine` field.** Every quest object may include `completionLine` (string, one sentence, at most 100 characters): the line a companion character says when the quest is completed. It is written together with the quest at creation time (by Gemini for generated quests, or from a template), so completing a quest never calls Gemini. Quests created before this field existed have no `completionLine`; clients should show their own default line in that case.

### `POST /api/quests`

Creates an active quest (`201`). Request body:

```json
{ "title": "Take a walk", "difficulty": "easy", "category": "health", "estimatedMinutes": 20 }
```

`title` is trimmed and must be 1 to 200 characters. `difficulty` must be exactly `easy`, `medium`, `hard`, or `boss`. `category` is optional (`study`, `health`, `life`, `social`, or `creative`; default `life`). `estimatedMinutes` is optional (integer 5 to 480; default `30`). The backend assigns rewards and a template `completionLine`; supplied reward and `completionLine` fields are ignored. Example response (the ID is generated):

```json
{
  "id": "generated-quest-id",
  "userId": "player-1",
  "title": "Take a walk",
  "category": "health",
  "difficulty": "easy",
  "estimatedMinutes": 20,
  "xpReward": 20,
  "coinReward": 10,
  "completed": false,
  "completionLine": "You finished Take a walk! The world feels a little brighter."
}
```

Invalid title, difficulty, category, estimatedMinutes, or body: `400`.

### `POST /api/quests/generate`

Turns a natural-language plan into one or more saved quests (`201`). Request body:

```json
{ "text": "Finish my algorithms assignment and go to the gym today." }
```

`text` must be 1 to 2000 characters after trimming. An optional `userId` may be supplied, but it must be `player-1` while the API has one shared player. A different player ID returns `404`; invalid input returns `400`.

Example response without a Gemini API key (IDs are generated):

```json
{
  "source": "mock-fallback",
  "quests": [
    { "id": "generated-id-1", "userId": "player-1", "title": "Algorithms Assignment: Study Sprint", "category": "study", "difficulty": "hard", "estimatedMinutes": 120, "xpReward": 100, "coinReward": 50, "completed": false, "completionLine": "Algorithms Assignment complete! I knew you could do it." },
    { "id": "generated-id-2", "userId": "player-1", "title": "Gym: Power Up", "category": "health", "difficulty": "medium", "estimatedMinutes": 60, "xpReward": 50, "coinReward": 25, "completed": false, "completionLine": "Look at you, wrapping up Gym! Time for a cozy break." }
  ]
}
```

`source` is `gemini` when generation succeeds and `mock-fallback` when credentials are unavailable or generation fails. The backend assigns XP and coin rewards from difficulty in both cases. Every generated quest has a `completionLine`: Gemini writes one per quest (warm, mentions the task, no reward numbers); if Gemini's line is missing or invalid it is replaced by a template, and lines over 100 characters are truncated. The mock fallback picks a random template. Generated quests also appear in `GET /api/quests` and use the normal completion endpoint.

### `POST /api/quests/:id/complete`

Completes the named quest once. No request body is needed. Example `200` response for the easy quest above:

```json
{
  "quest": {
    "id": "generated-quest-id",
    "userId": "player-1",
    "title": "Take a walk",
    "category": "health",
    "difficulty": "easy",
    "estimatedMinutes": 20,
    "xpReward": 20,
    "coinReward": 10,
    "completed": true,
    "completionLine": "You finished Take a walk! The world feels a little brighter."
  },
  "player": {
    "id": "player-1",
    "xp": 20,
    "level": 1,
    "coins": 10,
    "outfit": "default",
    "unlockedAreas": ["village"],
    "ownedItems": []
  }
}
```

The returned `quest` includes its stored `completionLine` (if it has one) for the client to display; no Gemini call happens here. Unknown quest ID: `404`. Quest already completed: `409` with only an `error` body; no rewards are added again and no `completionLine` is returned, so clients should not show the companion popup.

### `GET /api/items`

Returns the fixed shop catalog as an array (`200`), in shop order:

```json
[
  { "id": "plant-red-pot", "name": "Plant (Red Pot)", "type": "furniture", "price": 20, "asset": "plant-red-pot.png", "stackable": false },
  { "id": "tree-blue-pot", "name": "Tree (Blue Pot)", "type": "furniture", "price": 50, "asset": "tree-blue-pot.png", "stackable": false },
  { "id": "crop-carrot", "name": "Carrot", "type": "farm", "price": 5, "asset": "crop-carrot.png", "stackable": true }
]
```

57 items in total: 41 home furniture items named `<kind>-<colour>` (plant 20, potted tree 50, lamp 50, chair 40, sofa 100 coins) including the four pet corner items (`pet-bowl`, `pet-scratcher`, `pet-bed`, `pet-tree`), and 16 farm items (type `farm`, 5 to 20 coins: crops `crop-*` and decor such as `fence-wood` and `haystack`). Each variant is its own item: buying `lamp-gold` does not own `lamp-black`. Garden extras (flowers, benches, fountain) and clothing (`hat`, `hoodie`, `sneakers`) were retired: they are no longer listed or sold (`404` on purchase); potted trees kept their IDs and prices and are now `furniture`.

`stackable` says whether the item can be bought repeatedly. Farm items are stackable (each purchase adds one, see `itemCounts`); every other item is not and can be owned once.

The list and order match `CATALOG` in `src/services/shopService.ts` and the seed in `src/db/schema.sql` (TiDB keeps the order in `items.sort_order`). `npm run db:init` updates existing rows, adds new ones, and removes retired item IDs unless a player owns them; owned leftovers are kept and listed so they can be mapped to a current variant. It also adds `items.stackable` and `user_items.quantity` to databases created before them (existing rows get `quantity = 1`). Prices are in coins. Current item types are `furniture` and `farm` (`garden` and `clothing` only appear on retired items a player may still own). `asset` is the image file name; the frontend bundles furniture and garden PNGs under `frontend/src/assets/<type>/` and serves farm PNGs from `frontend/public/assets/farm/`.

### Long-term habits and Reward Board

Habits are separate from generated quests. Run `npm run db:init` after deploying this version to add
`habits`, `habit_checkins`, and `habit_claims` to TiDB. Without TiDB, habits follow the existing
in-memory game mode: they survive browser refreshes while the backend process is running, and reset
when that process restarts.

`GET /api/habits` returns active habits, computed weekly progress, milestones, achievements, and
claimed reward IDs. `POST /api/habits` with `{ "text": "Go to the gym 3 times a week" }` creates a
habit through deterministic parsing. `POST /api/habits/:id/check-in` records one check-in per calendar
day (duplicate: `409`). `POST /api/habits/rewards/:id/claim` applies a ready reward and returns the
updated board and player; a retry returns `alreadyClaimed: true` without granting anything again.
The browser sends its IANA time zone in `X-LifeQuest-Time-Zone`; the server uses its current clock to
determine that player's calendar day. Tests inject fixture dates directly into the habit service.

Claims and player currency/item grants share a transaction in TiDB. Reward-only item IDs are kept out
of the purchasable shop catalog, but appear in the player's inventory and item list after claiming.
Per-habit cosmetics can grant multiple copies when earned from different habits.
Badges are derived from durable `habit_claims` rows (or the in-memory claimed ID set).

### `POST /api/shop/purchase` (also `POST /api/shop/buy`)

Buys one of an item. Both paths run the same handler. Request body:

```json
{ "itemId": "crop-carrot" }
```

`itemId` must be a nonempty string. Example `200` response for a stackable item the player now owns three of:

```json
{
  "item": { "id": "crop-carrot", "name": "Carrot", "type": "farm", "price": 5, "asset": "crop-carrot.png", "stackable": true },
  "player": {
    "id": "player-1",
    "xp": 40,
    "level": 1,
    "coins": 5,
    "outfit": "default",
    "unlockedAreas": ["village"],
    "ownedItems": ["crop-carrot"],
    "itemCounts": { "crop-carrot": 3 }
  }
}
```

Regular items (`stackable: false`) can be bought once; buying one again returns `409`. Stackable items can be bought again and again: each purchase charges the price once and adds 1 to `itemCounts`. With TiDB the purchase runs in one transaction that locks the player row, so concurrent purchases are charged exactly once each and a regular item is never sold twice.

Invalid body: `400`. Unknown item ID: `404`. Already owned (regular items) or insufficient coins: `409`. Failed purchases leave coins and owned items unchanged.

## Game rules

Quest rewards are fixed by the backend. A quest pays out only on its first completion.

| Difficulty | XP | Coins |
| --- | ---: | ---: |
| easy | 20 | 10 |
| medium | 50 | 25 |
| hard | 100 | 50 |
| boss | 200 | 100 |

Level is `floor(total XP / 100) + 1`. XP is cumulative and never spent. Unlocked areas are recalculated from level:

| Minimum level | Area |
| ---: | --- |
| 1 | `village` |
| 2 | `forest` |
| 3 | `mountains` |
| 5 | `castle` |

Buying an item subtracts its catalog price from the player's coins and adds its ID to `ownedItems`. Coins do not affect XP, level, or unlocked areas.

## Integration notes

The current API has one shared player and no authentication. Client code should use IDs returned by quest creation or the item catalog. The backend owns reward, level, unlock, and price calculations; the Gemini integration (see `PERSON3.md`) decides only title, category, difficulty, estimated minutes, optional schedule fields, and `completionLine`. TiDB completion and purchase operations use transactions to preserve once-only rewards and charges. Quest Memory uses TiDB when configured and is best-effort.
