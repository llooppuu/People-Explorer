import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma";
import { getPublicPersons } from "../../services/personService";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    person: {
      findMany: vi.fn()
    }
  }
}));

const mockedPrisma = prisma as any;

describe("personService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPublicPersons returns only public persons", async () => {
    mockedPrisma.person.findMany.mockResolvedValue([{ id: "person-1", isPublic: true }] as never);

    const persons = await getPublicPersons({ page: 1, limit: 20 });

    expect(persons).toEqual([{ id: "person-1", isPublic: true }]);
    expect(mockedPrisma.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true })
      })
    );
  });
});
