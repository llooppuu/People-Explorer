import { ExternalReferenceCandidate, PersonProfileSection } from "../types";
import { fetchJson } from "./http";

const SOURCE_NAME = "Riigikogu API";
const BASE_URL = "https://api.riigikogu.ee";

type RiigikoguPerson = {
  id?: string | number;
  uuid?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  plenaryMembership?: {
    jobTitle?: {
      value?: string;
    };
    role?: {
      value?: string;
    };
  };
};

type RiigikoguMemberDetails = RiigikoguPerson & {
  email?: string;
  phone?: string;
  web?: string | null;
  address?: string;
  room?: string;
  biography?: string;
  dateOfBirth?: string;
  memberships?: Array<{
    membershipNumber?: number;
    startDate?: string;
    endDate?: string;
    role?: { value?: string };
    jobTitle?: { value?: string };
  }>;
  factions?: Array<{
    name?: string;
    membership?: {
      startDate?: string;
      endDate?: string;
      role?: { value?: string };
      jobTitle?: { value?: string };
    };
  }>;
  committees?: Array<{
    name?: string;
    membership?: {
      startDate?: string;
      endDate?: string;
      role?: { value?: string };
      jobTitle?: { value?: string };
    };
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findPeople(value: unknown): RiigikoguPerson[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ["data", "items", "results", "members", "persons"]) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested.filter(isRecord);
    }
  }

  return [];
}

function personName(person: RiigikoguPerson) {
  return person.fullName ?? [person.firstName, person.lastName].filter(Boolean).join(" ");
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&otilde;/g, "õ")
    .replace(/&Otilde;/g, "Õ")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü");
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[ä]/g, "a")
    .replace(/[öõ]/g, "o")
    .replace(/[ü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function biographySections(biography?: string): PersonProfileSection[] {
  if (!biography) {
    return [];
  }

  const sections: PersonProfileSection[] = [];
  const matches = [...biography.matchAll(/<strong>([^<:]+):?<\/strong>([\s\S]*?)(?=<strong>[^<:]+:?<\/strong>|$)/gi)];

  for (const match of matches) {
    const title = stripHtml(match[1]);
    const text = stripHtml(match[2]);
    if (title && text) {
      sections.push({
        id: sectionId(title),
        title,
        text,
        sourceName: SOURCE_NAME
      });
    }
  }

  return sections;
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

function formatPeriod(start?: string, end?: string) {
  return [start, end].filter(Boolean).join(" - ");
}

function currentMembershipRole(details: RiigikoguMemberDetails) {
  return details.plenaryMembership?.jobTitle?.value ?? details.plenaryMembership?.role?.value;
}

function basicSection(details: RiigikoguMemberDetails): PersonProfileSection | undefined {
  const items = [
    details.dateOfBirth ? { label: "Sündinud", value: details.dateOfBirth } : undefined,
    ageFromDate(details.dateOfBirth) ? { label: "Vanus", value: `${ageFromDate(details.dateOfBirth)} aastat` } : undefined,
    currentMembershipRole(details) ? { label: "Amet", value: currentMembershipRole(details)! } : undefined,
    details.email ? { label: "E-post", value: details.email } : undefined,
    details.phone ? { label: "Telefon", value: details.phone } : undefined,
    details.address ? { label: "Aadress", value: details.address } : undefined,
    details.room ? { label: "Ruum", value: details.room } : undefined
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return items.length > 0 ? { id: "pohiandmed", title: "Põhiandmed", sourceName: SOURCE_NAME, items } : undefined;
}

function listSection(
  id: string,
  title: string,
  source: Array<{ name?: string; membership?: { startDate?: string; endDate?: string; role?: { value?: string }; jobTitle?: { value?: string } } }> | undefined
): PersonProfileSection | undefined {
  const items =
    source
      ?.filter((item) => item.name)
      .slice(0, 12)
      .map((item) => {
        const role = item.membership?.jobTitle?.value ?? item.membership?.role?.value;
        const period = formatPeriod(item.membership?.startDate, item.membership?.endDate);
        return {
          label: item.name!,
          value: [role, period].filter(Boolean).join(" · ")
        };
      })
      .filter((item) => item.value) ?? [];

  return items.length > 0 ? { id, title, sourceName: SOURCE_NAME, items } : undefined;
}

async function findMember(fullName: string) {
  const query = encodeURIComponent(fullName.trim());
  const data = await fetchJson(`${BASE_URL}/api/plenary-members?name=${query}&status=ALL&lang=ET`).catch(() => null);
  const expected = fullName.trim().toLowerCase();

  return findPeople(data).find((person) => personName(person).toLowerCase() === expected) ?? findPeople(data)[0];
}

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = encodeURIComponent(fullName.trim());

  if (!query) {
    return [];
  }

  const data = await fetchJson(`${BASE_URL}/api/plenary-members?name=${query}&status=ALL&lang=ET`).catch(() => null);
  const expected = fullName.trim().toLowerCase();

  return findPeople(data)
    .filter((person) => personName(person).toLowerCase().includes(expected))
    .map((person) => {
      const id = person.id ?? person.uuid ?? query;
      const role = person.plenaryMembership?.jobTitle?.value ?? person.plenaryMembership?.role?.value;
      return {
        sourceName: SOURCE_NAME,
        baseUrl: BASE_URL,
        sourceType: "API",
        url: person.uuid ? `${BASE_URL}/api/plenary-members/${person.uuid}` : `${BASE_URL}/api/plenary-members?name=${query}#${encodeURIComponent(String(id))}`,
        content: [personName(person), role].filter(Boolean).join(" - ") || undefined,
        personProfile: role
          ? {
              role,
              biography: [personName(person), role].filter(Boolean).join(" - ") || undefined,
              category: "Poliitika",
              localized: {
                et: {
                  role,
                  biography: [personName(person), role].filter(Boolean).join(" - ") || undefined
                }
              }
            }
          : undefined
      };
    });
}

export async function fetchProfileSectionsForPerson(fullName: string, detailUrl?: string): Promise<PersonProfileSection[]> {
  const member = detailUrl ? undefined : await findMember(fullName);
  const url = detailUrl ?? (member?.uuid ? `${BASE_URL}/api/plenary-members/${member.uuid}` : undefined);

  if (!url) {
    return [];
  }

  const separator = url.includes("?") ? "&" : "?";
  const details = (await fetchJson(`${url}${separator}includeInactive=true&querySteno=false&lang=ET`).catch(() => null)) as RiigikoguMemberDetails | null;

  if (!details || !isRecord(details)) {
    return [];
  }

  return [
    basicSection(details),
    ...biographySections(details.biography),
    listSection("fraktsioonid", "Fraktsioonid", details.factions),
    listSection("komisjonid", "Komisjonid", details.committees)
  ].filter((section): section is PersonProfileSection => Boolean(section));
}
