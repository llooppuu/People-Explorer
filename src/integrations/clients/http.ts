const DEFAULT_TIMEOUT_MS = 5000;

export function getPublicApiTimeoutMs() {
  const value = Number(process.env.PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

export async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getPublicApiTimeoutMs());

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

