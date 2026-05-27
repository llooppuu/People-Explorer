import { RequestStatus } from "@prisma/client";
import { fetchReferencesForPerson } from "../integrations/publicSourceService";
import { ExternalReferenceCandidate } from "../integrations/types";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateRequestInput, RequestQueryInput, UpdateRequestInput } from "../validators/requestSchemas";

const TRUST_DELTA_APPROVE = 10;
const TRUST_DELTA_REJECT = -5;
const TRUST_MIN = 0;
const TRUST_MAX = 100;

function clampTrust(value: number) {
  return Math.max(TRUST_MIN, Math.min(TRUST_MAX, value));
}

async function findAutoApprovablePerson(targetPersonName: string) {
  return prisma.person.findFirst({
    where: { fullName: { equals: targetPersonName, mode: "insensitive" } },
    include: { references: true }
  });
}

async function findOrCreateDataSource(candidate: ExternalReferenceCandidate) {
  const existing = await prisma.dataSource.findFirst({
    where: {
      name: candidate.sourceName,
      baseUrl: candidate.baseUrl
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.dataSource.create({
    data: {
      name: candidate.sourceName,
      baseUrl: candidate.baseUrl,
      sourceType: candidate.sourceType
    }
  });
}

async function saveReferenceCandidates(personId: string, candidates: ExternalReferenceCandidate[]) {
  for (const candidate of candidates) {
    const existing = await prisma.reference.findFirst({
      where: {
        personId,
        url: candidate.url
      }
    });

    if (existing) {
      continue;
    }

    const dataSource = await findOrCreateDataSource(candidate);

    await prisma.reference.create({
      data: {
        personId,
        dataSourceId: dataSource.id,
        url: candidate.url,
        content: candidate.content
      }
    });
  }
}

async function importReferencesForRequest(targetPersonName: string) {
  const candidates = await fetchReferencesForPerson(targetPersonName);
  let person = await findAutoApprovablePerson(targetPersonName);

  if (!person && candidates.length > 0) {
    person = await prisma.person.create({
      data: {
        fullName: targetPersonName,
        role: "Unknown",
        category: "Public",
        isPublic: false
      },
      include: { references: true }
    });
  }

  if (person && candidates.length > 0) {
    await saveReferenceCandidates(person.id, candidates);
    person = await findAutoApprovablePerson(targetPersonName);
  }

  return person;
}

export async function createRequest(requesterId: string, trustScore: number, input: CreateRequestInput) {
  const person = await importReferencesForRequest(input.targetPersonName);
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

async function ensurePublicPerson(targetPersonName: string) {
  const existing = await prisma.person.findFirst({
    where: { fullName: { equals: targetPersonName, mode: "insensitive" } }
  });

  if (existing) {
    return prisma.person.update({
      where: { id: existing.id },
      data: { isPublic: true }
    });
  }

  return prisma.person.create({
    data: {
      fullName: targetPersonName,
      role: "Unknown",
      category: "Public",
      isPublic: true
    }
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
    await ensurePublicPerson(existing.targetPersonName);
  }

  await adjustRequesterTrust(existing.requesterId, input.status);

  return updated;
}

async function adjustRequesterTrust(requesterId: string, status: "APPROVED" | "REJECTED") {
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { trustScore: true }
  });

  if (!requester) {
    return;
  }

  const delta = status === "APPROVED" ? TRUST_DELTA_APPROVE : TRUST_DELTA_REJECT;
  const next = clampTrust(requester.trustScore + delta);

  if (next === requester.trustScore) {
    return;
  }

  await prisma.user.update({
    where: { id: requesterId },
    data: { trustScore: next }
  });
}

export const approveRequest = (id: string, reviewerId: string) =>
  updateRequest(id, reviewerId, { status: "APPROVED" });

export const rejectRequest = (id: string, reviewerId: string) =>
  updateRequest(id, reviewerId, { status: "REJECTED" });
