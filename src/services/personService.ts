import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { PersonQueryInput } from "../validators/personSchemas";
import { fetchProfileForPerson, fetchProfileSectionsForPerson as fetchWikidataProfileSections } from "../integrations/clients/wikidataClient";
import { fetchProfileSectionsForPerson as fetchRiigikoguProfileSections } from "../integrations/clients/riigikoguClient";
import { ExternalReferenceCandidate, PersonProfileSection } from "../integrations/types";

type ExternalPersonProfile = NonNullable<ExternalReferenceCandidate["personProfile"]>;

function profileFromReferences(
  person: { role?: string | null; biography?: string | null; references?: Array<{ content?: string | null }> },
  externalProfile?: ExternalPersonProfile,
  profileSections: PersonProfileSection[] = []
) {
  if (externalProfile?.localized) {
    return {
      ...person,
      role: externalProfile.localized.et?.role ?? externalProfile.role ?? person.role,
      biography: externalProfile.localized.et?.biography ?? externalProfile.biography ?? person.biography,
      localizedProfile: externalProfile.localized,
      profileSections
    };
  }

  const content = person.references?.find((reference) => reference.content)?.content;

  if (!content) {
    return {
      ...person,
      profileSections
    };
  }

  const [, description] = content.split(/\s+-\s+/, 2);
  const fallbackText = description ?? content;

  return {
    ...person,
    role: person.role && person.role !== "Unknown" ? person.role : fallbackText,
    biography: person.biography ?? content,
    profileSections
  };
}

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

  const riigikoguDetailUrl = person.references.find((reference) => reference.dataSource?.name === "Riigikogu API")?.url;
  const [externalProfile, riigikoguSections, wikidataSections] = await Promise.all([
    fetchProfileForPerson(person.fullName).catch(() => undefined),
    fetchRiigikoguProfileSections(person.fullName, riigikoguDetailUrl).catch(() => []),
    fetchWikidataProfileSections(person.fullName).catch(() => [])
  ]);
  const profileSections = [...wikidataSections, ...riigikoguSections].filter(
    (section, index, sections) => sections.findIndex((item) => item.id === section.id) === index
  );

  return profileFromReferences(person, externalProfile, profileSections);
}
