import { ExternalReferenceCandidate } from "../types";
import { fetchJson } from "./http";

const SOURCE_NAME = "Riigikogu API";
const BASE_URL = "https://api.riigikogu.ee";

type RiigikoguPerson = {
  id?: string | number;
  uuid?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
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

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = encodeURIComponent(fullName.trim());

  if (!query) {
    return [];
  }

  const data = await fetchJson(`${BASE_URL}/api/search?query=${query}`).catch(() => null);
  const expected = fullName.trim().toLowerCase();

  return findPeople(data)
    .filter((person) => personName(person).toLowerCase().includes(expected))
    .map((person) => {
      const id = person.id ?? person.uuid ?? query;
      return {
        sourceName: SOURCE_NAME,
        baseUrl: BASE_URL,
        sourceType: "API",
        url: `${BASE_URL}/api/search?query=${query}#${encodeURIComponent(String(id))}`,
        content: personName(person) || undefined
      };
    });
}

