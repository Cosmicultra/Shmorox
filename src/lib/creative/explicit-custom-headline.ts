import { normalizeHeadlineKey } from "./custom-headline-history";

/**
 * Detect when a custom request explicitly dictates the ad-card headline/title.
 * Reuse of prior headlines is allowed only in that case.
 */
export function extractExplicitCustomHeadline(customRequest?: string): string | undefined {
  const text = customRequest?.trim();
  if (!text) return undefined;

  const patterns: RegExp[] = [
    // headline: "..." | title: '...' | headline — ...
    /\b(?:headline|title|ad\s*title|card\s*title)\s*(?:should\s+be|must\s+be|to\s+use|is)?\s*[:\-–—]\s*[“"']([^“”"']+)[”"']/i,
    /\b(?:headline|title|ad\s*title|card\s*title)\s*(?:should\s+be|must\s+be|to\s+use|is)?\s*[:\-–—]\s*([^\n.;]+)/i,
    // use the headline/title "..."
    /\b(?:use|using)\s+(?:the\s+)?(?:exact\s+)?(?:headline|title)\s*[“"']([^“”"']+)[”"']/i,
    /\b(?:use|using)\s+(?:the\s+)?(?:exact\s+)?(?:headline|title)\s+([^\n.;]+)/i,
    // titled "..." / with headline "..."
    /\b(?:titled|headline)\s+[“"']([^“”"']+)[”"']/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const cleaned = cleanExplicitHeadline(raw);
    if (cleaned) return cleaned;
  }

  return undefined;
}

function cleanExplicitHeadline(raw: string): string | undefined {
  let value = raw
    .replace(/^[\s:–—\-]+/, "")
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Drop trailing instruction fragments accidentally captured.
  value = value.replace(/\s+\b(?:and|with|for|please|thanks)\b.*$/i, "").trim();

  if (value.length < 3 || value.length > 90) return undefined;
  if (/^(the|a|an|this|that)$/i.test(value)) return undefined;
  return value;
}

export function isExplicitlyRequestedHeadline(
  headline: string | undefined,
  explicitHeadline?: string
): boolean {
  if (!headline?.trim() || !explicitHeadline?.trim()) return false;
  return normalizeHeadlineKey(headline) === normalizeHeadlineKey(explicitHeadline);
}
