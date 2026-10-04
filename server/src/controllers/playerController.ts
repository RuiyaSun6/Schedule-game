import type { Request, Response } from "express";
import { getPlayer } from "../services/storageService.js";
import { isTiDBEnabled } from "../db/tidb.js";
import { getPlayer as getPlayerFromDb } from "../repositories/playerRepository.js";
import { DEFAULT_PLAYER_ID } from "../types/defaultPlayer.js";

export async function getCurrentPlayer(_request: Request, response: Response): Promise<void> {
  const player = isTiDBEnabled() ? await getPlayerFromDb(DEFAULT_PLAYER_ID) : getPlayer();
  if (!player) {
    response.status(404).json({ error: "Player not found." });
    return;
  }
  response.json(player);
}
