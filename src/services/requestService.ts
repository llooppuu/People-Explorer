import { RequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateRequestInput, RequestQueryInput, UpdateRequestInput } from "../validators/requestSchemas";

async function findAutoApprovablePerson(targetPersonName: string) {
  return prisma.person.findFirst({
    where: { fullName: { equals: targetPersonName, mode: "insensitive" } },
    include: { references: true }
  });
}

export async function createRequest(requesterId: string, trustScore: number, input: CreateRequestInput) {
  const person = await findAutoApprovablePerson(input.targetPersonName);
  const shouldAutoApprove = trustScore >= 80 && Boolean(person && person.references.length >= 2);
  const status: RequestStatus = shouldAutoApprove ? "APPROVED" : "PENDING";

  const request = await prisma.request.create({
    data: {
      requesterId,
      targetPersonName: input.targetPersonName,
      status,
      reviewedAt: shouldAutoApprove ? new Date() : undefined
    }
  });

  if (shouldAutoApprove && person) {
    await prisma.person.update({
      where: { id: person.id },
      data: { isPublic: true }
    });
  }

  return request;
}

export async function getRequests(query: RequestQueryInput) {
  return prisma.request.findMany({
    where: { status: query.status },
    include: {
      requester: { select: { id: true, email: true, trustScore: true } },
      reviewer: { select: { id: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateRequest(id: string, reviewerId: string, input: UpdateRequestInput) {
  const existing = await prisma.request.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Request not found");
  }

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      reviewerId
    }
  });

  if (input.status === "APPROVED") {
    await prisma.person.updateMany({
      where: { fullName: { equals: existing.targetPersonName, mode: "insensitive" } },
      data: { isPublic: true }
    });
  }

  return updated;
}

export const approveRequest = (id: string, reviewerId: string) =>
  updateRequest(id, reviewerId, { status: "APPROVED" });

export const rejectRequest = (id: string, reviewerId: string) =>
  updateRequest(id, reviewerId, { status: "REJECTED" });
