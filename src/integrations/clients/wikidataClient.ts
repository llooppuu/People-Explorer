import { ExternalReferenceCandidate } from "../types";
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

function isWikidataSearchResponse(value: unknown): value is WikidataSearchResponse {
  return typeof value === "object" && value !== null && Array.isArray((value as WikidataSearchResponse).search);
}

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = fullName.trim();

  if (!query) {
    return [];
  }

  const url = new URL(API_URL);
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("language", "en");
  url.searchParams.set("type", "item");
  url.searchParams.set("search", query);

  const data = await fetchJson(url.toString()).catch(() => null);

  if (!isWikidataSearchResponse(data)) {
    return [];
  }

  const expected = query.toLowerCase();

  const searchResults = data.search;

  return searchResults
    .filter((item) => item.label?.toLowerCase().includes(expected))
    .map((item) => ({
      sourceName: SOURCE_NAME,
      baseUrl: BASE_URL,
      sourceType: "API",
      url: item.concepturi ?? `${BASE_URL}/wiki/${encodeURIComponent(item.id ?? item.title ?? query)}`,
      content: [item.label, item.description].filter(Boolean).join(" - ") || undefined
    }));
}
