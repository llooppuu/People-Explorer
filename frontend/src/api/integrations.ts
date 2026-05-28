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
