import { ExternalReferenceCandidate } from "../types";
import { fetchJson } from "./http";

const SOURCE_NAME = "Ariregister";
const BASE_URL = "https://avaandmed.ariregister.rik.ee";

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = encodeURIComponent(fullName.trim());

  if (!query) {
    return [];
  }

  // TODO: Confirm the public Ariregister endpoint response shape before mapping company officer records.
  await fetchJson(`${BASE_URL}/et/avaandmete-allalaadimine?search=${query}`).catch(() => null);
  return [];
}

