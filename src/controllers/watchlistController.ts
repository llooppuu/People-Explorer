import { Request, Response } from "express";
import * as watchlistService from "../services/watchlistService";
import { addWatchlistSchema } from "../validators/watchlistSchemas";

export async function getWatchlist(req: Request, res: Response) {
  const watchlist = await watchlistService.getWatchlist(req.user!.id);
  res.json(watchlist);
}

export async function addToWatchlist(req: Request, res: Response) {
  const input = addWatchlistSchema.parse(req.body);
  const item = await watchlistService.addToWatchlist(req.user!.id, input);
  res.status(201).json(item);
}

export async function removeFromWatchlist(req: Request, res: Response) {
  await watchlistService.removeFromWatchlist(req.user!.id, String(req.params.id));
  res.status(204).send();
}
