import { ExternalReferenceCandidate } from "../types";
import { fetchJson } from "./http";

const SOURCE_NAME = "Riigi Teataja";
const BASE_URL = "https://www.riigiteataja.ee";

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = encodeURIComponent(fullName.trim());

  if (!query) {
    return [];
  }

  // TODO: Confirm the Riigi Teataja machine-readable search response before mapping document hits.
  await fetchJson(`${BASE_URL}/otsingu_tulemus.html?tekst=${query}`).catch(() => null);
  return [];
}

