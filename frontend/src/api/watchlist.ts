import { api } from "./client";
import type { WatchlistItem } from "../types";

export async function listWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await api.get<WatchlistItem[]>("/watchlist");
  return data;
}

export async function addToWatchlist(personId: string, note?: string): Promise<WatchlistItem> {
  const { data } = await api.post<WatchlistItem>("/watchlist", { personId, note });
  return data;
}

export async function removeFromWatchlist(id: string): Promise<void> {
  await api.delete(`/watchlist/${id}`);
}
