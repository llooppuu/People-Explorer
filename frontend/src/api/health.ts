import { api } from "./client";

export interface OllamaStatus {
  configured: boolean;
  online: boolean;
  url?: string;
  model: string;
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
  const { data } = await api.get<OllamaStatus>("/health/ollama");
  return data;
}
