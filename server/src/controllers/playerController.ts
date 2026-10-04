import type { Request, Response } from "express";
import { getPlayer } from "../services/storageService.js";
import { isTiDBEnabled } from "../db/tidb.js";
import { getPlayer as getPlayerFromDb } from "../repositories/playerRepository.js";

export async function getCurrentPlayer(request: Request, response: Response): Promise<void> {
  const userId = request.authUser!.userId;
  const player = isTiDBEnabled() ? await getPlayerFromDb(userId) : getPlayer(userId);
  if (!player) {
    response.status(404).json({ error: "Player not found." });
    return;
  }
  response.json(player);
}
