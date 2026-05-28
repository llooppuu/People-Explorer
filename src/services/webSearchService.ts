import * as cheerio from "cheerio";

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type WebSearchFindings = {
  query: string;
  results: WebSearchResult[];
  summary: string;
};

const DDG_HTML_URL = "https://html.duckduckgo.com/html/";
const USER_AGENT = "Mozilla/5.0 (compatible; DynamicPeopleExplorer/1.0)";
const MAX_RESULTS = 6;

function decodeDdgUrl(href: string): string {
  if (!href) return href;
  try {
    if (href.startsWith("//")) {
      href = `https:${href}`;
    }
    const url = new URL(href);
    const uddg = url.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : href;
  } catch {
    return href;
  }
}

async function runDdgQuery(query: string, timeoutMs: number): Promise<WebSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(DDG_HTML_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT
      },
      body: new URLSearchParams({ q: query }).toString(),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`DuckDuckGo returned ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const results: WebSearchResult[] = [];

    $("div.result").each((_, el) => {
      if (results.length >= MAX_RESULTS) return false;
      const titleEl = $(el).find("a.result__a").first();
      const snippetEl = $(el).find("a.result__snippet, div.result__snippet").first();
      const title = titleEl.text().trim();
      const href = decodeDdgUrl(titleEl.attr("href") ?? "");
      const snippet = snippetEl.text().trim();

      if (title && href && !href.startsWith("https://duckduckgo.com")) {
        results.push({ title, url: href, snippet });
      }
    });

    return results;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchPersonOnWeb(query: string): Promise<WebSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const timeoutMs = Number(process.env.PUBLIC_API_TIMEOUT_MS ?? 5000);
  const quoted = `"${trimmed.replace(/"/g, "")}"`;
  const merged = new Map<string, WebSearchResult>();

  const quotedResults = await runDdgQuery(quoted, timeoutMs).catch(() => []);
  for (const r of quotedResults) {
    merged.set(r.url, r);
  }

  if (merged.size < MAX_RESULTS) {
    const broad = await runDdgQuery(trimmed, timeoutMs).catch(() => []);
    for (const r of broad) {
      if (merged.size >= MAX_RESULTS) break;
      if (!merged.has(r.url)) merged.set(r.url, r);
    }
  }

  return [...merged.values()].slice(0, MAX_RESULTS);
}

type OllamaResponse = {
  response?: string;
  message?: { content?: string };
  error?: string;
};

function isOllamaResponse(value: unknown): value is OllamaResponse {
  return typeof value === "object" && value !== null;
}

async function summarizeWithOllama(personName: string, results: WebSearchResult[]): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL;
  if (!ollamaUrl || results.length === 0) {
    return "";
  }

  const model = process.env.OLLAMA_MODEL ?? "llama3";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 90000);

  const sourcesText = results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
    .join("\n\n");

  const prompt = `Oled andmeanalüütik. Allpool on veebiotsingu tulemused isiku "${personName}" kohta. Kirjuta lühike eestikeelne kokkuvõte (2-3 lõiku) sellest, mida need allikad isiku kohta räägivad. Maini kindlasti, milliste allikate (numbritega) põhjal kokkuvõte tehtud on. Ära spekulleeri. Kui leiad vasturääkivusi või tundub, et tulemused puudutavad erinevaid isikuid, märgi see ära.\n\nVeebiotsingu tulemused:\n\n${sourcesText}`;

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
      return "";
    }

    const data: unknown = await res.json();
    if (!isOllamaResponse(data) || data.error) {
      return "";
    }

    return (data.response ?? data.message?.content ?? "").trim();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

export async function gatherWebFindings(personName: string): Promise<WebSearchFindings> {
  const results = await searchPersonOnWeb(personName);
  const summary = await summarizeWithOllama(personName, results);
  return { query: personName, results, summary };
}
