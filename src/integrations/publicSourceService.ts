import * as ariregisterClient from "./clients/ariregisterClient";
import * as euipoClient from "./clients/euipoClient";
import * as riigikoguClient from "./clients/riigikoguClient";
import * as riigiteatajaClient from "./clients/riigiteatajaClient";
import * as wikidataClient from "./clients/wikidataClient";
import { ExternalReferenceCandidate } from "./types";

type PublicSourceClient = {
  fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]>;
};

const clients: PublicSourceClient[] = [
  ariregisterClient,
  riigikoguClient,
  riigiteatajaClient,
  wikidataClient,
  euipoClient
];

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const results = await Promise.allSettled(clients.map((client) => client.fetchReferencesForPerson(fullName)));
  const candidates = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const byUrl = new Map<string, ExternalReferenceCandidate>();

  for (const candidate of candidates) {
    if (!byUrl.has(candidate.url)) {
      byUrl.set(candidate.url, candidate);
    }
  }

  return [...byUrl.values()];
}

