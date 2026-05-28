import { PersonProfileSection } from "../integrations/types";
import { EffectiveAiConfig, getEffectiveAiConfig } from "./aiSettingsService";

type PersonData = {
  fullName: string;
  role?: string | null;
  category?: string | null;
  biography?: string | null;
  references?: Array<{
    url: string;
    content?: string | null;
    dataSource?: { name: string; sourceType: string } | null;
  }>;
  profileSections?: PersonProfileSection[];
};

function buildContext(person: PersonData): string {
  const parts: string[] = [];

  parts.push(`Nimi: ${person.fullName}`);
  if (person.role) parts.push(`Roll: ${person.role}`);
  if (person.category) parts.push(`Valdkond: ${person.category}`);
  if (person.biography) parts.push(`Biograafia: ${person.biography}`);

  const refs = person.references?.filter((r) => r.content) ?? [];
  if (refs.length > 0) {
    parts.push("\nAllikaviited:");
    for (const ref of refs) {
      parts.push(`- ${ref.dataSource?.name ?? "Allikas"} (${ref.url}): ${ref.content}`);
    }
  }

  const sections = person.profileSections ?? [];
  if (sections.length > 0) {
    parts.push("\nLisaandmed:");
    for (const section of sections) {
      parts.push(`${section.title}:`);
      if (section.text) parts.push(`  ${section.text}`);
      if (section.items) {
        for (const item of section.items) {
          parts.push(`  ${item.label}: ${item.value}`);
        }
      }
    }
  }

  return parts.join("\n");
}

type OllamaResponse = {
  response?: string;
  message?: { content?: string };
  error?: string;
};

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type AiStatus = {
  provider: "OLLAMA" | "OPENAI";
  configured: boolean;
  online: boolean;
  url?: string;
  model: string;
};

export async function getOllamaStatus(): Promise<AiStatus> {
  const config = await getEffectiveAiConfig();
  return getAiStatusFromConfig(config);
}

async function getAiStatusFromConfig(config: EffectiveAiConfig): Promise<AiStatus> {
  if (config.provider === "OPENAI") {
    return {
      provider: "OPENAI",
      configured: Boolean(config.openai.apiKey),
      online: Boolean(config.openai.apiKey),
      url: config.openai.baseUrl,
      model: config.openai.model,
    };
  }

  if (!config.ollama.url) {
    return { provider: "OLLAMA", configured: false, online: false, model: config.ollama.model };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${config.ollama.url.replace(/\/+$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    return {
      provider: "OLLAMA",
      configured: true,
      online: res.ok,
      url: config.ollama.url,
      model: config.ollama.model,
    };
  } catch {
    return {
      provider: "OLLAMA",
      configured: true,
      online: false,
      url: config.ollama.url,
      model: config.ollama.model,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runAiPrompt(prompt: string, config?: EffectiveAiConfig): Promise<string> {
  const cfg = config ?? (await getEffectiveAiConfig());

  if (cfg.provider === "OPENAI") {
    return runOpenAi(prompt, cfg);
  }

  return runOllama(prompt, cfg);
}

async function runOllama(prompt: string, cfg: EffectiveAiConfig): Promise<string> {
  if (!cfg.ollama.url) {
    throw new Error("Ollama URL is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch(`${cfg.ollama.url.replace(/\/+$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: cfg.ollama.model, prompt, stream: false }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data: unknown = await res.json();
    if (!isRecord(data)) throw new Error("Unexpected response from Ollama");
    const parsed = data as OllamaResponse;
    if (parsed.error) throw new Error(`Ollama error: ${parsed.error}`);
    const text = parsed.response ?? parsed.message?.content;
    if (!text) throw new Error("Empty response from Ollama");
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}

async function runOpenAi(prompt: string, cfg: EffectiveAiConfig): Promise<string> {
  if (!cfg.openai.apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch(`${cfg.openai.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.openai.model,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`OpenAI returned ${res.status}`);
    }

    const data: unknown = await res.json();
    if (!isRecord(data)) throw new Error("Unexpected response from OpenAI");
    const parsed = data as OpenAiResponse;
    if (parsed.error?.message) throw new Error(`OpenAI error: ${parsed.error.message}`);
    const text = parsed.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}

export async function generateAiOverview(person: PersonData): Promise<string> {
  const cfg = await getEffectiveAiConfig();
  const context = buildContext(person);
  const prompt = `Oled andmeanalüütik, kes koostab lühikesi, faktipõhiseid kokkuvõtteid Eesti avalike isikute kohta registriandmete põhjal. Koosta järgneva isiku kohta selge AI-ülevaade (2–4 lõiku). Kasuta ainult antud andmeid — ära spekulleeri ega lisa infot, mida andmetes pole. Kirjuta eesti keeles.\n\n${context}`;
  return runAiPrompt(prompt, cfg);
}
