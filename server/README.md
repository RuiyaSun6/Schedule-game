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

**Storage is currently in memory.** The default player, quests, purchases, and all earned progress reset whenever the server process restarts. There is one shared player (`player-1`) and no authentication or per-user state yet.

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
  "ownedItems": []
}
```

`ownedItems` contains item **IDs**, not full item objects. Resolve them against `GET /api/items` to display item details.

### `GET /api/quests`

Returns all quests as an array (`200`), including active and completed quests. The initial response is `[]`.

### `POST /api/quests`

Creates an active quest (`201`). Request body:

```json
{ "title": "Take a walk", "difficulty": "easy" }
```

`title` is trimmed and must be 1 to 200 characters. `difficulty` must be exactly `easy`, `medium`, `hard`, or `boss`. The backend assigns rewards; supplied reward fields are ignored. Example response (the ID is generated):

```json
{
  "id": "generated-quest-id",
  "title": "Take a walk",
  "difficulty": "easy",
  "status": "active",
  "xpReward": 20,
  "coinReward": 10
}
```

Invalid title, difficulty, or body: `400`.

### `POST /api/quests/:id/complete`

Completes the named quest once. No request body is needed. Example `200` response for the easy quest above:

```json
{
  "quest": {
    "id": "generated-quest-id",
    "title": "Take a walk",
    "difficulty": "easy",
    "status": "completed",
    "xpReward": 20,
    "coinReward": 10
  },
  "player": {
    "id": "player-1",
    "xp": 20,
    "level": 1,
    "coins": 10,
    "unlockedAreas": ["village"],
    "ownedItems": []
  }
}
```

Unknown quest ID: `404`. Quest already completed: `409`; no rewards are added again.

### `GET /api/items`

Returns the fixed shop catalog as an array (`200`):

```json
[
  { "id": "trail-badge", "name": "Trail Badge", "description": "A badge for your first adventure.", "price": 10, "type": "cosmetic" },
  { "id": "camp-lantern", "name": "Camp Lantern", "description": "A warm light for your home base.", "price": 25, "type": "decoration" },
  { "id": "star-banner", "name": "Star Banner", "description": "A banner to mark your achievements.", "price": 50, "type": "decoration" }
]
```

Prices are in coins. Item types are `cosmetic` and `decoration`.

### `POST /api/shop/purchase`

Buys an item once. Request body:

```json
{ "itemId": "trail-badge" }
```

`itemId` must be a nonempty string. Example `200` response when the player has 10 coins:

```json
{
  "item": { "id": "trail-badge", "name": "Trail Badge", "description": "A badge for your first adventure.", "price": 10, "type": "cosmetic" },
  "player": {
    "id": "player-1",
    "xp": 20,
    "level": 1,
    "coins": 0,
    "unlockedAreas": ["village"],
    "ownedItems": ["trail-badge"]
  }
}
```

Invalid body: `400`. Unknown item ID: `404`. Already owned or insufficient coins: `409`. Failed purchases leave coins and owned items unchanged.

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

The current API has one shared player and no authentication. Client code should use IDs returned by quest creation or the item catalog. The backend owns reward, level, unlock, and price calculations; a Gemini integration should send only quest title and difficulty. A future TiDB integration can replace the process-local storage, but it must preserve once-only quest rewards and purchases.
