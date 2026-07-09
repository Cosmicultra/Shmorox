const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export function parseResponseBody<T>(body: string, context: string): T {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error(`${context} returned an empty response body`);
  }

  if (trimmed.startsWith("<")) {
    throw new Error(
      `${context} returned HTML instead of JSON (often a transient gateway or proxy error). Please retry.`
    );
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(
      `${context} returned invalid JSON: ${trimmed.slice(0, 160)}${trimmed.length > 160 ? "…" : ""}`
    );
  }
}

export function isRetryableOpenAIError(error: unknown, status?: number): boolean {
  if (status && RETRYABLE_STATUS.has(status)) return true;

  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();

  return (
    message.includes("html instead of json") ||
    message.includes("empty response") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("timeout")
  );
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
