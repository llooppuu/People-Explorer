import { ExternalReferenceCandidate } from "../types";
import { getEuipoCredentials } from "../../services/integrationSettingsService";

const SOURCE_NAME = "EUIPO Persons";
const BASE_URL = "https://api.euipo.europa.eu/persons";
const TOKEN_URL = "https://euipo.europa.eu/cas-server-webapp/oidc/accessToken";

type EuipoSearchItem = {
  identifier?: string | number;
  type?: string;
  name?: string;
  nationality?: string;
  address?: {
    city?: string;
    country?: string;
  };
};

type EuipoSearchResponse = {
  applicants?: EuipoSearchItem[];
  representatives?: EuipoSearchItem[];
};

type EuipoTokenResponse = {
  access_token?: string;
};

async function fetchAccessToken(clientId: string, clientSecret: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "uid"
    })
  });

  if (!response.ok) {
    return undefined;
  }

  const data = (await response.json()) as EuipoTokenResponse;
  return data.access_token;
}

async function searchEuipo(path: "applicants" | "representatives", fullName: string, accessToken: string, clientId: string) {
  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set("name", fullName);
  url.searchParams.set("size", "10");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-IBM-Client-Id": clientId
    }
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as EuipoSearchResponse;
  return data[path] ?? [];
}

function includesName(itemName: string | undefined, expected: string) {
  return Boolean(itemName && itemName.toLowerCase().includes(expected));
}

function describeItem(kind: "applicant" | "representative", item: EuipoSearchItem) {
  return [
    kind === "applicant" ? "EUIPO applicant" : "EUIPO representative",
    item.type,
    item.nationality ? `nationality ${item.nationality}` : undefined,
    item.address?.city,
    item.address?.country
  ]
    .filter(Boolean)
    .join(" - ");
}

function mapItem(kind: "applicant" | "representative", item: EuipoSearchItem): ExternalReferenceCandidate | undefined {
  if (!item.identifier || !item.name) {
    return undefined;
  }

  const role = kind === "applicant" ? "EUIPO applicant" : "EUIPO representative";

  return {
    sourceName: SOURCE_NAME,
    baseUrl: BASE_URL,
    sourceType: "API",
    url: `${BASE_URL}/${kind === "applicant" ? "applicants" : "representatives"}/${encodeURIComponent(String(item.identifier))}`,
    content: [item.name, describeItem(kind, item)].filter(Boolean).join(" - "),
    personProfile: {
      role,
      category: "Intellectual property",
      biography: `${item.name} appears in EUIPO persons data as ${role.toLowerCase()}.`
    }
  };
}

export async function fetchReferencesForPerson(fullName: string): Promise<ExternalReferenceCandidate[]> {
  const query = fullName.trim();
  const auth = await getEuipoCredentials();

  if (!query || !auth) {
    return [];
  }

  const accessToken = await fetchAccessToken(auth.clientId, auth.clientSecret).catch(() => undefined);

  if (!accessToken) {
    return [];
  }

  const expected = query.toLowerCase();
  const [applicants, representatives] = await Promise.all([
    searchEuipo("applicants", query, accessToken, auth.clientId).catch(() => []),
    searchEuipo("representatives", query, accessToken, auth.clientId).catch(() => [])
  ]);

  return [
    ...applicants.filter((item) => includesName(item.name, expected)).map((item) => mapItem("applicant", item)),
    ...representatives.filter((item) => includesName(item.name, expected)).map((item) => mapItem("representative", item))
  ].filter((candidate): candidate is ExternalReferenceCandidate => Boolean(candidate));
}
