import { api } from "./client";

export interface EuipoSettingsStatus {
  provider: "euipo";
  configured: boolean;
  source: "database" | "environment" | "none";
  clientId?: string;
  secretPreview?: string;
  updatedAt?: string | null;
}

export async function getEuipoSettings() {
  const { data } = await api.get<EuipoSettingsStatus>("/integrations/euipo");
  return data;
}

export async function updateEuipoSettings(input: { clientId: string; clientSecret: string }) {
  const { data } = await api.put<EuipoSettingsStatus>("/integrations/euipo", input);
  return data;
}

export type AiProvider = "OLLAMA" | "OPENAI";

export type AiFieldSource = "database" | "environment" | "none" | "default";

export interface AiSettingsStatus {
  provider: AiProvider;
  source: "database" | "environment" | "none";
  ollama: {
    url?: string;
    model: string;
    urlSource: AiFieldSource;
    modelSource: AiFieldSource;
    online: boolean;
    configured: boolean;
  };
  openai: {
    apiKeyPreview?: string;
    model: string;
    baseUrl: string;
    apiKeySource: AiFieldSource;
    modelSource: AiFieldSource;
    baseUrlSource: AiFieldSource;
    configured: boolean;
  };
  updatedAt: string | null;
}

export interface AiSettingsInput {
  provider: AiProvider;
  ollamaUrl?: string | null;
  ollamaModel?: string | null;
  openaiApiKey?: string | null;
  openaiModel?: string | null;
  openaiBaseUrl?: string | null;
}

export async function getAiSettings() {
  const { data } = await api.get<AiSettingsStatus>("/integrations/ai");
  return data;
}

export async function updateAiSettings(input: AiSettingsInput) {
  const { data } = await api.put<AiSettingsStatus>("/integrations/ai", input);
  return data;
}
