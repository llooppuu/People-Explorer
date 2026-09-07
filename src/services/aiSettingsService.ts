import { prisma } from "../lib/prisma";

export type AiProvider = "OLLAMA" | "OPENAI";

const SETTING_ID = "default";
const DEFAULT_OLLAMA_MODEL = "llama3";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

export type EffectiveAiConfig = {
  provider: AiProvider;
  timeoutMs: number;
  ollama: {
    url?: string;
    model: string;
  };
  openai: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  };
};

export type AiSettingsStatus = {
  provider: AiProvider;
  source: "database" | "environment" | "none";
  ollama: {
    url?: string;
    model: string;
    urlSource: "database" | "environment" | "none";
    modelSource: "database" | "environment" | "default";
    online: boolean;
    configured: boolean;
  };
  openai: {
    apiKeyPreview?: string;
    model: string;
    baseUrl: string;
    apiKeySource: "database" | "environment" | "none";
    modelSource: "database" | "environment" | "default";
    baseUrlSource: "database" | "environment" | "default";
    configured: boolean;
  };
  updatedAt: Date | null;
};

function maskSecret(secret?: string | null) {
  if (!secret) return undefined;
  return secret.length <= 4
    ? "****"
    : `${"*".repeat(Math.max(4, secret.length - 4))}${secret.slice(-4)}`;
}

function normaliseProvider(value: unknown): AiProvider {
  return value === "OPENAI" ? "OPENAI" : "OLLAMA";
}

export async function getEffectiveAiConfig(): Promise<EffectiveAiConfig> {
  const saved = await prisma.aiSetting.findUnique({ where: { id: SETTING_ID } });

  const envOllamaUrl = process.env.OLLAMA_URL || undefined;
  const envOllamaModel = process.env.OLLAMA_MODEL || undefined;
  const envOpenaiKey = process.env.OPENAI_API_KEY || undefined;
  const envOpenaiModel = process.env.OPENAI_MODEL || undefined;
  const envOpenaiBaseUrl = process.env.OPENAI_BASE_URL || undefined;
  const envProvider = process.env.AI_PROVIDER ? normaliseProvider(process.env.AI_PROVIDER) : undefined;

  const provider = saved ? normaliseProvider(saved.provider) : envProvider ?? "OLLAMA";

  return {
    provider,
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 90000),
    ollama: {
      url: saved?.ollamaUrl ?? envOllamaUrl,
      model: saved?.ollamaModel ?? envOllamaModel ?? DEFAULT_OLLAMA_MODEL,
    },
    openai: {
      apiKey: saved?.openaiApiKey ?? envOpenaiKey,
      model: saved?.openaiModel ?? envOpenaiModel ?? DEFAULT_OPENAI_MODEL,
      baseUrl: saved?.openaiBaseUrl ?? envOpenaiBaseUrl ?? DEFAULT_OPENAI_BASE_URL,
    },
  };
}

export async function getAiSettingsStatus(): Promise<AiSettingsStatus> {
  const saved = await prisma.aiSetting.findUnique({ where: { id: SETTING_ID } });

  const envOllamaUrl = process.env.OLLAMA_URL || undefined;
  const envOllamaModel = process.env.OLLAMA_MODEL || undefined;
  const envOpenaiKey = process.env.OPENAI_API_KEY || undefined;
  const envOpenaiModel = process.env.OPENAI_MODEL || undefined;
  const envOpenaiBaseUrl = process.env.OPENAI_BASE_URL || undefined;
  const envProvider = process.env.AI_PROVIDER ? normaliseProvider(process.env.AI_PROVIDER) : undefined;

  const provider = saved ? normaliseProvider(saved.provider) : envProvider ?? "OLLAMA";

  const ollamaUrl = saved?.ollamaUrl ?? envOllamaUrl;
  const ollamaModel = saved?.ollamaModel ?? envOllamaModel ?? DEFAULT_OLLAMA_MODEL;
  const openaiApiKey = saved?.openaiApiKey ?? envOpenaiKey;
  const openaiModel = saved?.openaiModel ?? envOpenaiModel ?? DEFAULT_OPENAI_MODEL;
  const openaiBaseUrl = saved?.openaiBaseUrl ?? envOpenaiBaseUrl ?? DEFAULT_OPENAI_BASE_URL;

  const ollamaOnline = ollamaUrl ? await pingOllama(ollamaUrl) : false;

  const overallSource: AiSettingsStatus["source"] = saved
    ? "database"
    : envProvider || envOllamaUrl || envOpenaiKey || envOllamaModel || envOpenaiModel || envOpenaiBaseUrl
    ? "environment"
    : "none";

  return {
    provider,
    source: overallSource,
    ollama: {
      url: ollamaUrl,
      model: ollamaModel,
      urlSource: saved?.ollamaUrl ? "database" : envOllamaUrl ? "environment" : "none",
      modelSource: saved?.ollamaModel ? "database" : envOllamaModel ? "environment" : "default",
      online: ollamaOnline,
      configured: Boolean(ollamaUrl),
    },
    openai: {
      apiKeyPreview: maskSecret(openaiApiKey),
      model: openaiModel,
      baseUrl: openaiBaseUrl,
      apiKeySource: saved?.openaiApiKey ? "database" : envOpenaiKey ? "environment" : "none",
      modelSource: saved?.openaiModel ? "database" : envOpenaiModel ? "environment" : "default",
      baseUrlSource: saved?.openaiBaseUrl ? "database" : envOpenaiBaseUrl ? "environment" : "default",
      configured: Boolean(openaiApiKey),
    },
    updatedAt: saved?.updatedAt ?? null,
  };
}

async function pingOllama(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/api/tags`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export type AiSettingsInput = {
  provider: AiProvider;
  ollamaUrl?: string | null;
  ollamaModel?: string | null;
  openaiApiKey?: string | null;
  openaiModel?: string | null;
  openaiBaseUrl?: string | null;
};

export async function saveAiSettings(input: AiSettingsInput): Promise<AiSettingsStatus> {
  const existing = await prisma.aiSetting.findUnique({ where: { id: SETTING_ID } });

  const pick = <T,>(value: T | null | undefined, fallback: T | null | undefined): T | null => {
    if (value === undefined) return (fallback ?? null) as T | null;
    if (value === null || value === "") return null;
    return value;
  };

  await prisma.aiSetting.upsert({
    where: { id: SETTING_ID },
    create: {
      id: SETTING_ID,
      provider: input.provider,
      ollamaUrl: pick(input.ollamaUrl, null),
      ollamaModel: pick(input.ollamaModel, null),
      openaiApiKey: pick(input.openaiApiKey, null),
      openaiModel: pick(input.openaiModel, null),
      openaiBaseUrl: pick(input.openaiBaseUrl, null),
    },
    update: {
      provider: input.provider,
      ollamaUrl: pick(input.ollamaUrl, existing?.ollamaUrl),
      ollamaModel: pick(input.ollamaModel, existing?.ollamaModel),
      openaiApiKey: pick(input.openaiApiKey, existing?.openaiApiKey),
      openaiModel: pick(input.openaiModel, existing?.openaiModel),
      openaiBaseUrl: pick(input.openaiBaseUrl, existing?.openaiBaseUrl),
    },
  });

  return getAiSettingsStatus();
}
