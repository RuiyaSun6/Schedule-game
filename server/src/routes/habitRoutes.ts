import { Router, type Request } from "express";
import { checkInHabit, claimHabitReward, createHabit, getHabitBoard } from "../services/habitService.js";

const router = Router();
function playerDate(request: Request): Date {
  const zone = request.header("X-LifeQuest-Time-Zone") || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = (name: string) => parts.find((item) => item.type === name)?.value;
    return new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  } catch { return new Date(); }
}
router.get("/", async (request, response) => { response.json(await getHabitBoard(playerDate(request), request.authUser!.userId)); });
router.post("/", async (request, response) => {
  const text: unknown = request.body?.text;
  if (typeof text !== "string") { response.status(400).json({ error: "text is required." }); return; }
  try { response.status(201).json(await createHabit(text, playerDate(request), request.authUser!.userId)); }
  catch (error) { if (error instanceof RangeError) response.status(400).json({ error: error.message }); else throw error; }
});
router.post("/:id/check-in", async (request, response) => {
  const result = await checkInHabit(request.params.id, playerDate(request), request.authUser!.userId);
  if (result.status === "not_found") { response.status(404).json({ error: "Habit not found." }); return; }
  if (result.status === "not_started") { response.status(409).json({ error: "This habit has not started yet. Check in from its start date." }); return; }
  if (result.status === "duplicate") { response.status(409).json({ error: "Already checked in today." }); return; }
  response.json(result.board);
});
router.post("/rewards/:id/claim", async (request, response) => {
  const result = await claimHabitReward(request.params.id, playerDate(request), request.authUser!.userId);
  if (result.status === "not_found") { response.status(404).json({ error: "Reward not found." }); return; }
  if (result.status === "locked") { response.status(409).json({ error: "Reward is not ready." }); return; }
  // Retries return the already-claimed state and current player without granting twice.
  response.json({ board: result.board, player: result.player, alreadyClaimed: result.status === "already_claimed" });
});
export default router;
