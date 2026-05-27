import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma";
import { addTagToPerson } from "../../services/tagService";
import { addToWatchlist, removeFromWatchlist } from "../../services/watchlistService";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    watchlist: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn()
    },
    tag: {
      upsert: vi.fn()
    },
    personTag: {
      upsert: vi.fn()
    },
    person: {
      findUnique: vi.fn()
    }
  }
}));

const mockedPrisma = prisma as any;

describe("watchlistService and tagService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("watchlist add/remove works", async () => {
    mockedPrisma.person.findUnique.mockResolvedValue({ id: "person-1" } as never);
    mockedPrisma.watchlist.findUnique.mockResolvedValue(null);
    mockedPrisma.watchlist.create.mockResolvedValue({ id: "watch-1", personId: "person-1" } as never);
    mockedPrisma.watchlist.deleteMany.mockResolvedValue({ count: 1 } as never);

    const item = await addToWatchlist("user-1", { personId: "person-1", note: "Track" });
    await removeFromWatchlist("user-1", "watch-1");

    expect(item.id).toBe("watch-1");
    expect(mockedPrisma.watchlist.deleteMany).toHaveBeenCalledWith({ where: { id: "watch-1", userId: "user-1" } });
  });

  it("watchlist remove throws 404 when no item was deleted", async () => {
    mockedPrisma.watchlist.deleteMany.mockResolvedValue({ count: 0 } as never);

    await expect(removeFromWatchlist("user-1", "missing-watch")).rejects.toMatchObject({
      statusCode: 404,
      message: "Watchlist item not found"
    });
  });

  it("tag adding does not create duplicate PersonTag rows", async () => {
    mockedPrisma.person.findUnique.mockResolvedValue({ id: "person-1" } as never);
    mockedPrisma.tag.upsert.mockResolvedValue({ id: "tag-1", name: "science" } as never);
    mockedPrisma.personTag.upsert.mockResolvedValue({ personId: "person-1", tagId: "tag-1" } as never);

    const personTag = await addTagToPerson("person-1", { name: "science" });

    expect(personTag.tagId).toBe("tag-1");
    expect(mockedPrisma.personTag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { personId_tagId: { personId: "person-1", tagId: "tag-1" } },
        update: {}
      })
    );
  });

  it("tag adding throws 404 when person does not exist", async () => {
    mockedPrisma.person.findUnique.mockResolvedValue(null);

    await expect(addTagToPerson("missing-person", { name: "science" })).rejects.toMatchObject({
      statusCode: 404,
      message: "Person not found"
    });
  });
});
