import { ExternalReferenceCandidate, PersonProfileSection } from "../types";
import { fetchJson } from "./http";

const SOURCE_NAME = "Wikidata";
const BASE_URL = "https://www.wikidata.org";
const API_URL = "https://www.wikidata.org/w/api.php";

type WikidataSearchResponse = {
  search: Array<{
    id?: string;
    title?: string;
    label?: string;
    description?: string;
    concepturi?: string;
  }>;
};

type WikidataEntityResponse = {
  entities?: Record<
    string,
    {
      labels?: Record<string, { value?: string }>;
      descriptions?: Record<string, { value?: string }>;
      claims?: Record<
        string,
        Array<{
          rank?: string;
          mainsnak?: {
            datavalue?: {
              value?: {
                id?: string;
              };
            };
          };
        }>
      >;
    }
  >;
};

function isWikidataSearchResponse(value: unknown): value is WikidataSearchResponse {
  return typeof value === "object" && value !== null && Array.isArray((value as WikidataSearchResponse).search);
}

function isWikidataEntityResponse(value: unknown): value is WikidataEntityResponse {
  return typeof value === "object" && value !== null && typeof (value as WikidataEntityResponse).entities === "object";
}

async function searchEntities(query: string, language: "et" | "en") {
  const url = new URL(API_URL);
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("language", language);
  url.searchParams.set("uselang", language);
  url.searchParams.set("type", "item");
  url.searchParams.set("search", query);

  const data = await fetchJson(url.toString()).catch(() => null);

  if (!isWikidataSearchResponse(data)) {
    return [];
  }

  return data.search;
}

async function fetchEntities(ids: string[], languages = "et|en") {
  if (ids.length === 0) {
    return {};
  }

  const url = new URL(API_URL);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("props", "labels|descriptions|claims");
  url.searchParams.set("languages", languages);

  const data = await fetchJson(url.toString()).catch(() => null);

  if (!isWikidataEntityResponse(data)) {
    return {};
  }

  return data.entities ?? {};
}

function firstValue(entity: NonNullable<WikidataEntityResponse["entities"]>[string] | undefined, prop: "labels" | "descriptions") {
  return entity?.[prop]?.et?.value ?? entity?.[prop]?.en?.value;
}

function localizedValue(entity: NonNullable<WikidataEntityResponse["entities"]>[string] | undefined, prop: "labels" | "descriptions", lang: "et" | "en") {
  return entity?.[prop]?.[lang]?.value;
}

function positionIds(entity: NonNullable<WikidataEntityResponse["entities"]>[string]) {
  const claims = entity.claims?.P39 ?? [];
  return claims
    .slice()
    .sort((a, b) => (a.rank === "preferred" ? -1 : 0) - (b.rank === "preferred" ? -1 : 0))
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter((id): id is string => Boolean(id));
}

function claimEntityIds(entity: NonNullable<WikidataEntityResponse["entities"]>[string] | undefined, property: string) {
  return (
    entity?.claims?.[property]
      ?.map((claim) => claim.mainsnak?.datavalue?.value?.id)
      .filter((id): id is string => Boolean(id)) ?? []
  );
}

function claimDate(entity: NonNullable<WikidataEntityResponse["entities"]>[string] | undefined, property: string) {
  const raw = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value as { time?: string } | undefined;
  const time = raw?.time;

  if (!time) {
    return undefined;
  }

  return time.replace(/^\+/, "").slice(0, 10);
}

function ageFromDate(date?: string) {
  if (!date) {
    return undefined;
  }

  const born = new Date(date);
  if (Number.isNaN(born.getTime())) {
    return undefined;
  }

  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const hadBirthday = today.getMonth() > born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) {
    age -= 1;
  }

  return String(age);
}

function categoryForRole(role?: string) {
  if (!role) {
    return undefined;
  }

  const normalized = role.toLowerCase();
  if (/(president|minister|poliitik|politician|parliament|riigikogu|mayor|linnapea)/.test(normalized)) {
    return "Poliitika";
  }

  return undefined;
}

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = fullName.trim();

  if (!query) {
    return [];
  }

  const expected = query.toLowerCase();
  const byId = new Map<string, WikidataSearchResponse["search"][number]>();

  for (const item of [...(await searchEntities(query, "et")), ...(await searchEntities(query, "en"))]) {
    const id = item.id ?? item.title;
    if (id && !byId.has(id)) {
      byId.set(id, item);
    }
  }

  const searchResults = [...byId.values()].filter((item) => item.label?.toLowerCase().includes(expected));
  const entityIds = searchResults.map((item) => item.id ?? item.title).filter((id): id is string => Boolean(id));
  const entities = await fetchEntities(entityIds);
  const positions = await fetchEntities(
    [...new Set(Object.values(entities).flatMap((entity) => positionIds(entity)).slice(0, 20))],
    "et|en"
  );

  return searchResults
    .filter((item) => item.label?.toLowerCase().includes(expected))
    .map((item) => {
      const entity = entities[item.id ?? item.title ?? ""];
      const labelEt = localizedValue(entity, "labels", "et");
      const labelEn = localizedValue(entity, "labels", "en") ?? item.label;
      const descriptionEt = localizedValue(entity, "descriptions", "et");
      const descriptionEn = localizedValue(entity, "descriptions", "en") ?? item.description;
      const label = labelEt ?? labelEn ?? item.label;
      const description = descriptionEt ?? descriptionEn ?? item.description;
      const position = positionIds(entity ?? {})[0];
      const roleEt = descriptionEt ?? (position ? localizedValue(positions[position], "labels", "et") : undefined);
      const roleEn = descriptionEn ?? (position ? localizedValue(positions[position], "labels", "en") : undefined);
      const role = roleEt ?? roleEn ?? description;
      const biographyEt = [labelEt ?? label, descriptionEt].filter(Boolean).join(" - ") || undefined;
      const biographyEn = [labelEn ?? label, descriptionEn].filter(Boolean).join(" - ") || undefined;

      return {
        sourceName: SOURCE_NAME,
        baseUrl: BASE_URL,
        sourceType: "API",
        url: item.concepturi ?? `${BASE_URL}/wiki/${encodeURIComponent(item.id ?? item.title ?? query)}`,
        content: [label ?? item.label, description].filter(Boolean).join(" - ") || undefined,
        personProfile: {
          role,
          biography: biographyEt ?? biographyEn,
          category: categoryForRole(role ?? description),
          localized: {
            et: {
              role: roleEt ?? role,
              biography: biographyEt
            },
            en: {
              role: roleEn ?? role,
              biography: biographyEn
            }
          }
        }
      };
    });
}

export async function fetchProfileForPerson(fullName: string) {
  const references = await fetchReferencesForPerson(fullName);
  return references.find((reference) => reference.personProfile)?.personProfile;
}

export async function fetchProfileSectionsForPerson(fullName: string): Promise<PersonProfileSection[]> {
  const references = await fetchReferencesForPerson(fullName);
  const first = references[0];
  const wikidataId = first?.url.match(/\/(Q\d+)$/)?.[1] ?? first?.url.match(/entity\/(Q\d+)$/)?.[1];

  if (!wikidataId) {
    return [];
  }

  const entities = await fetchEntities([wikidataId]);
  const entity = entities[wikidataId];

  if (!entity) {
    return [];
  }

  const spouseIds = claimEntityIds(entity, "P26");
  const childIds = claimEntityIds(entity, "P40");
  const relatives = await fetchEntities([...new Set([...spouseIds, ...childIds])]);
  const born = claimDate(entity, "P569");
  const familyItems = [
    born ? { label: "Sündinud", value: born } : undefined,
    ageFromDate(born) ? { label: "Vanus", value: `${ageFromDate(born)} aastat` } : undefined,
    spouseIds.length > 0
      ? {
          label: "Abikaasa",
          value: spouseIds.map((id) => firstValue(relatives[id], "labels")).filter(Boolean).join(", ")
        }
      : undefined,
    childIds.length > 0 ? { label: "Lapsi", value: String(childIds.length) } : undefined
  ].filter((item): item is { label: string; value: string } => Boolean(item?.value));

  return familyItems.length > 0
    ? [
        {
          id: "pere",
          title: "Pere",
          sourceName: SOURCE_NAME,
          items: familyItems
        }
      ]
    : [];
}
