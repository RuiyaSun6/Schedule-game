import express from "express";
import cors from "cors";
import type { ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import playerRoutes from "./routes/playerRoutes.js";
import questRoutes from "./routes/questRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import { isTiDBEnabled } from "./db/tidb.js";
import { createPlayer } from "./repositories/playerRepository.js";
import { makeDefaultPlayer } from "./types/defaultPlayer.js";
import authRoutes, { requireAuth } from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const configuredOrigins = process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set(configuredOrigins ?? []);
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  // Vite picks the next free port when 5173 is occupied. Allow loopback dev ports
  // unless the user explicitly configured CLIENT_ORIGIN or this is production.
  return !configuredOrigins && process.env.NODE_ENV !== "production"
    && /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin);
}
app.use(cors({ credentials: true, origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)) }));
app.use(express.json());
app.use((request, response, next) => {
  const origin = request.header("Origin");
  if (origin && !["GET", "HEAD", "OPTIONS"].includes(request.method) && !isAllowedOrigin(origin)) {
    response.status(403).json({ error: "Origin not allowed." }); return;
  }
  next();
});

app.get("/api/health", (_req, res) => { res.json({ ok: true }); });
app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);

app.use("/api/player", playerRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/habits", habitRoutes);


app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const requestError = error as { status?: unknown; type?: unknown };
  if (requestError?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body." });
    return;
  }
  if (typeof requestError?.status === "number" && requestError.status >= 400 && requestError.status < 500) {
    res.status(requestError.status).json({ error: "Invalid request body." });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error." });
};
app.use(handleError);

if (isTiDBEnabled()) {
  await createPlayer(makeDefaultPlayer());
}

app.listen(PORT, () => {
  console.log(`LifeQuest backend running on http://localhost:${PORT}`);
});
