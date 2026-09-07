import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { AddTagInput } from "../validators/tagSchemas";

export async function addTagToPerson(personId: string, input: AddTagInput) {
  const person = await prisma.person.findUnique({ where: { id: personId } });

  if (!person) {
    throw new AppError(404, "Person not found");
  }

  const tag = await prisma.tag.upsert({
    where: { name: input.name },
    update: input.color ? { color: input.color } : {},
    create: {
      name: input.name,
      color: input.color
    }
  });

  return prisma.personTag.upsert({
    where: { personId_tagId: { personId, tagId: tag.id } },
    update: {},
    create: { personId, tagId: tag.id },
    include: { tag: true, person: true }
  });
}
