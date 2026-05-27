import { z } from "zod";

export const addWatchlistSchema = z.object({
  personId: z.string().min(1),
  note: z.string().optional()
});

export type AddWatchlistInput = z.infer<typeof addWatchlistSchema>;
