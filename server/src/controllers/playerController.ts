import type { Request, Response } from "express";
import { getPlayer } from "../services/storageService";

export function getCurrentPlayer(_request: Request, response: Response): void {
  response.json(getPlayer());
}
