import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { PersonQueryInput } from "../validators/personSchemas";
import { fetchProfileForPerson, fetchProfileSectionsForPerson as fetchWikidataProfileSections } from "../integrations/clients/wikidataClient";
import { fetchProfileSectionsForPerson as fetchRiigikoguProfileSections } from "../integrations/clients/riigikoguClient";
import { ExternalReferenceCandidate, PersonProfileSection } from "../integrations/types";
import { generateAiOverview as callAiOverview } from "./aiService";
import { gatherWebFindings, WebSearchFindings, WebSearchResult } from "./webSearchService";

const WEB_SEARCH_SOURCE_NAME = "Veebipäring";
const WEB_SEARCH_BASE_URL = "https://duckduckgo.com";

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
      tags: { include: { tag: true } },
      references: { include: { dataSource: true } }
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

export async function generatePersonAiOverview(id: string): Promise<string> {
  const person = await prisma.person.findUnique({
    where: { id },
    include: { references: { include: { dataSource: true } } }
  });

  if (!person) {
    throw new AppError(404, "Person not found");
  }

  const riigikoguDetailUrl = person.references.find((r) => r.dataSource?.name === "Riigikogu API")?.url;
  const [, riigikoguSections, wikidataSections] = await Promise.all([
    fetchProfileForPerson(person.fullName).catch(() => undefined),
    fetchRiigikoguProfileSections(person.fullName, riigikoguDetailUrl).catch(() => []),
    fetchWikidataProfileSections(person.fullName).catch(() => [])
  ]);
  const profileSections = [...wikidataSections, ...riigikoguSections].filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  );

  const overview = await callAiOverview({ ...person, profileSections });

  await prisma.person.update({
    where: { id },
    data: { aiOverview: overview }
  });

  return overview;
}

export async function previewWebSearch(
  id: string,
  options?: { query?: string; sites?: string[] }
): Promise<WebSearchFindings> {
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) {
    throw new AppError(404, "Person not found");
  }
  return gatherWebFindings(person.fullName, options);
}

export async function acceptWebSearchFindings(
  id: string,
  results: WebSearchResult[],
  summary: string | undefined
) {
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) {
    throw new AppError(404, "Person not found");
  }

  let dataSource = await prisma.dataSource.findFirst({
    where: { name: WEB_SEARCH_SOURCE_NAME }
  });

  if (!dataSource) {
    dataSource = await prisma.dataSource.create({
      data: {
        name: WEB_SEARCH_SOURCE_NAME,
        baseUrl: WEB_SEARCH_BASE_URL,
        sourceType: "MANUAL"
      }
    });
  }

  let savedCount = 0;
  for (const result of results) {
    const existing = await prisma.reference.findFirst({
      where: { personId: id, url: result.url }
    });
    if (existing) continue;

    await prisma.reference.create({
      data: {
        personId: id,
        dataSourceId: dataSource.id,
        url: result.url,
        content: [result.title, result.snippet].filter(Boolean).join(" - ")
      }
    });
    savedCount += 1;
  }

  if (summary && summary.trim()) {
    await prisma.person.update({
      where: { id },
      data: { aiOverview: summary.trim() }
    });
  }

  return { savedCount };
}
