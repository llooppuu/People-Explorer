import { PersonProfileSection } from "../integrations/types";

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

function isOllamaResponse(value: unknown): value is OllamaResponse {
  return typeof value === "object" && value !== null;
}

export type OllamaStatus = {
  configured: boolean;
  online: boolean;
  url?: string;
  model: string;
};

export async function getOllamaStatus(): Promise<OllamaStatus> {
  const ollamaUrl = process.env.OLLAMA_URL;
  const model = process.env.OLLAMA_MODEL ?? "llama3";

  if (!ollamaUrl) {
    return { configured: false, online: false, model };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    return { configured: true, online: res.ok, url: ollamaUrl, model };
  } catch {
    return { configured: true, online: false, url: ollamaUrl, model };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateAiOverview(person: PersonData): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL;

  if (!ollamaUrl) {
    throw new Error("OLLAMA_URL is not configured");
  }

  const model = process.env.OLLAMA_MODEL ?? "llama3";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 90000);
  const context = buildContext(person);

  const prompt = `Oled andmeanalüütik, kes koostab lühikesi, faktipõhiseid kokkuvõtteid Eesti avalike isikute kohta registriandmete põhjal. Koosta järgneva isiku kohta selge AI-ülevaade (2–4 lõiku). Kasuta ainult antud andmeid — ära spekulleeri ega lisa infot, mida andmetes pole. Kirjuta eesti keeles.\n\n${context}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data: unknown = await res.json();

    if (!isOllamaResponse(data)) {
      throw new Error("Unexpected response from Ollama");
    }

    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`);
    }

    const text = data.response ?? data.message?.content;

    if (!text) {
      throw new Error("Empty response from Ollama");
    }

    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}
