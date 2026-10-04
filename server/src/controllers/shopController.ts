import type { Request, Response } from "express";
import { getCatalog, purchaseItem } from "../services/shopService.js";

export async function getItems(request: Request, response: Response): Promise<void> {
  response.json(await getCatalog(request.authUser!.userId));
}

export async function postPurchase(request: Request, response: Response): Promise<void> {
  const body: unknown = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    response.status(400).json({ error: "Body must be an object." });
    return;
  }

  const { itemId } = body as Record<string, unknown>;
  if (typeof itemId !== "string" || !itemId.trim()) {
    response.status(400).json({ error: "itemId must be a nonempty string." });
    return;
  }

  const result = await purchaseItem(itemId.trim(), request.authUser!.userId);
  if (result.status === "player_not_found") {
    response.status(404).json({ error: "Player not found." });
    return;
  }
  if (result.status === "not_found") {
    response.status(404).json({ error: "Item not found." });
    return;
  }
  if (result.status === "already_owned") {
    response.status(409).json({ error: "Item already owned." });
    return;
  }
  if (result.status === "limit_reached") {
    response.status(409).json({ error: "You already have the most you can keep of this item." });
    return;
  }
  if (result.status === "insufficient_coins") {
    response.status(409).json({ error: "Not enough coins." });
    return;
  }

  response.json({ item: result.item, player: result.player });
}
