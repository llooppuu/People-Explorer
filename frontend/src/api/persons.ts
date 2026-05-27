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
