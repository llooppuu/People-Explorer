import { api } from "./client";
import type { Person } from "../types";

export interface PersonQuery {
  role?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listPersons(query: PersonQuery = {}): Promise<Person[]> {
  const { data } = await api.get<Person[]>("/persons", { params: query });
  return data;
}

export async function getPerson(id: string): Promise<Person> {
  const { data } = await api.get<Person>(`/persons/${id}`);
  return data;
}

export async function addTagToPerson(personId: string, name: string, color?: string) {
  const { data } = await api.post(`/persons/${personId}/tags`, { name, color });
  return data;
}

export async function generateAiOverview(personId: string): Promise<{ overview: string }> {
  const { data } = await api.post<{ overview: string }>(`/persons/${personId}/ai-overview`);
  return data;
}

export async function requestAiOverview(personId: string): Promise<void> {
  await api.post("/requests/ai-overview", { personId });
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchFindings {
  query: string;
  results: WebSearchResult[];
  summary: string;
}

export async function previewWebSearch(
  personId: string,
  options?: { query?: string; sites?: string[] }
): Promise<WebSearchFindings> {
  const { data } = await api.post<WebSearchFindings>(
    `/persons/${personId}/web-search`,
    options ?? {}
  );
  return data;
}

export async function acceptWebSearch(
  personId: string,
  results: WebSearchResult[],
  summary: string | undefined
): Promise<{ savedCount: number }> {
  const { data } = await api.post<{ savedCount: number }>(
    `/persons/${personId}/web-search/accept`,
    { results, summary }
  );
  return data;
}
