import express from "express";
import cors from "cors";
import type { ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import playerRoutes from "./routes/playerRoutes";
import questRoutes from "./routes/questRoutes";
import itemRoutes from "./routes/itemRoutes";
import shopRoutes from "./routes/shopRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use("/api/player", playerRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/shop", shopRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

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

app.listen(PORT, () => {
  console.log(`LifeQuest backend running on http://localhost:${PORT}`);
});
