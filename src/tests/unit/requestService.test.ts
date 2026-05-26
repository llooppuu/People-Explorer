import { beforeEach, describe, expect, it, vi } from "vitest";
import { approveRequest, createRequest, rejectRequest } from "../../services/requestService";
import { prisma } from "../../lib/prisma";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    person: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    request: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

const mockedPrisma = prisma as any;

describe("requestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createRequest creates PENDING when trustScore is below 80", async () => {
    mockedPrisma.person.findFirst.mockResolvedValue({ id: "person-1", references: [{}, {}] } as never);
    mockedPrisma.request.create.mockResolvedValue({ id: "request-1", status: "PENDING" } as never);

    const request = await createRequest("user-1", 79, { targetPersonName: "Ada Lovelace" });

    expect(request.status).toBe("PENDING");
    expect(mockedPrisma.request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING"
        })
      })
    );
    expect(mockedPrisma.person.update).not.toHaveBeenCalled();
  });

  it("createRequest creates APPROVED when trustScore is at least 80 and references are at least 2", async () => {
    mockedPrisma.person.findFirst.mockResolvedValue({ id: "person-1", references: [{}, {}] } as never);
    mockedPrisma.request.create.mockResolvedValue({ id: "request-1", status: "APPROVED" } as never);

    const request = await createRequest("user-1", 80, { targetPersonName: "Ada Lovelace" });

    expect(request.status).toBe("APPROVED");
    expect(mockedPrisma.request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED"
        })
      })
    );
    expect(mockedPrisma.person.update).toHaveBeenCalledWith({
      where: { id: "person-1" },
      data: { isPublic: true }
    });
  });

  it.each([0, 1])("createRequest stays PENDING when references count is %i", async (count) => {
    mockedPrisma.person.findFirst.mockResolvedValue({
      id: "person-1",
      references: Array.from({ length: count })
    } as never);
    mockedPrisma.request.create.mockResolvedValue({ id: "request-1", status: "PENDING" } as never);

    const request = await createRequest("user-1", 90, { targetPersonName: "Ada Lovelace" });

    expect(request.status).toBe("PENDING");
    expect(mockedPrisma.request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING"
        })
      })
    );
    expect(mockedPrisma.person.update).not.toHaveBeenCalled();
  });

  it("approveRequest changes a request to APPROVED", async () => {
    mockedPrisma.request.findUnique.mockResolvedValue({ id: "request-1", targetPersonName: "Ada Lovelace" } as never);
    mockedPrisma.request.update.mockResolvedValue({ id: "request-1", status: "APPROVED" } as never);

    const request = await approveRequest("request-1", "admin-1");

    expect(request.status).toBe("APPROVED");
    expect(mockedPrisma.person.updateMany).toHaveBeenCalled();
  });

  it("rejectRequest changes a request to REJECTED", async () => {
    mockedPrisma.request.findUnique.mockResolvedValue({ id: "request-1", targetPersonName: "Ada Lovelace" } as never);
    mockedPrisma.request.update.mockResolvedValue({ id: "request-1", status: "REJECTED" } as never);

    const request = await rejectRequest("request-1", "admin-1");

    expect(request.status).toBe("REJECTED");
  });
});
