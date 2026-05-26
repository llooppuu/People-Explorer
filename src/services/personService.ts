import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { PersonQueryInput } from "../validators/personSchemas";

export async function getPublicPersons(query: PersonQueryInput) {
  const where = {
    isPublic: true,
    role: query.role,
    category: query.category,
    tags: query.tag
      ? {
          some: {
            tag: {
              name: query.tag
            }
          }
        }
      : undefined
  };

  return prisma.person.findMany({
    where,
    include: {
      tags: { include: { tag: true } }
    },
    orderBy: { createdAt: "desc" },
    skip: (query.page - 1) * query.limit,
    take: query.limit
  });
}

export async function getPersonById(id: string, isAdmin: boolean) {
  const person = await prisma.person.findFirst({
    where: {
      id,
      ...(isAdmin ? {} : { isPublic: true })
    },
    include: {
      references: { include: { dataSource: true } },
      tags: { include: { tag: true } }
    }
  });

  if (!person) {
    throw new AppError(404, "Person not found");
  }

  return person;
}
