import https from "node:https";

const DEFAULT_TIMEOUT_MS = 5000;

export function getPublicApiTimeoutMs() {
  const value = Number(process.env.PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

export async function fetchJson(url: string): Promise<unknown> {
  if (new URL(url).hostname === "api.riigikogu.ee") {
    return fetchJsonWithRiigikoguTlsFallback(url);
  }

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

function fetchJsonWithRiigikoguTlsFallback(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        headers: { Accept: "application/json" },
        rejectUnauthorized: false,
        timeout: getPublicApiTimeoutMs()
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (parseError) {
            reject(parseError);
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Request timed out"));
    });
    request.on("error", reject);
    request.end();
  });
}
