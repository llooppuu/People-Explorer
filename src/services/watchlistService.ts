import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AddWatchlistInput } from "../validators/watchlistSchemas";

export async function getWatchlist(userId: string) {
  return prisma.watchlist.findMany({
    where: { userId },
    include: { person: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function addToWatchlist(userId: string, input: AddWatchlistInput) {
  const existing = await prisma.watchlist.findUnique({
    where: { userId_personId: { userId, personId: input.personId } },
    include: { person: true }
  });

  if (existing) {
    return existing;
  }

  return prisma.watchlist.create({
    data: {
      userId,
      personId: input.personId,
      note: input.note
    },
    include: { person: true }
  });
}

export async function removeFromWatchlist(userId: string, id: string) {
  await prisma.watchlist.deleteMany({ where: { id, userId } });
}
