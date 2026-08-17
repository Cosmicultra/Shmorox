import type { GeneratedAd } from "@/lib/types";

export interface RenderAdPayload {
  ad: GeneratedAd;
  includeQR: boolean;
  qrUrl?: string;
}

interface StoredPayload extends RenderAdPayload {
  expiresAt: number;
}

const PAYLOAD_TTL_MS = 2 * 60 * 1000;

/**
 * Ad payloads can carry multi-megabyte AI panel artwork, which will not survive
 * a URL query string. The Playwright render page pulls them by token instead.
 */
const store = new Map<string, StoredPayload>();

function purgeExpired(now: number): void {
  for (const [token, payload] of store) {
    if (payload.expiresAt <= now) store.delete(token);
  }
}

export function putRenderPayload(payload: RenderAdPayload): string {
  const now = Date.now();
  purgeExpired(now);

  const token = `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  store.set(token, { ...payload, expiresAt: now + PAYLOAD_TTL_MS });
  return token;
}

export function takeRenderPayload(token: string): RenderAdPayload | null {
  const now = Date.now();
  purgeExpired(now);

  const stored = store.get(token);
  if (!stored) return null;

  const { expiresAt: _expiresAt, ...payload } = stored;
  return payload;
}

export function deleteRenderPayload(token: string): void {
  store.delete(token);
}
