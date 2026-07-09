/**
 * Marketing copy guardrails — no em-dashes or en-dashes in generated content.
 */

/** Returns true if text contains an em-dash or en-dash */
export function containsEmDash(text: string): boolean {
  return /[\u2013\u2014]/.test(text);
}

/**
 * Replaces em-dashes and en-dashes with comma + space.
 * Collapses duplicate commas and extra whitespace.
 */
export function sanitizeNoEmDash(text: string): string {
  if (!text) return text;

  return text
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/,\s*,+/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*\./g, ".")
    .trim();
}

/** Sanitize an array of strings (e.g. hashtags) */
export function sanitizeNoEmDashList(items: string[]): string[] {
  return items.map(sanitizeNoEmDash);
}

/** Sanitize all string fields on ad copy */
export function sanitizeAdCopy<T extends Record<string, string>>(copy: T): T {
  const result = { ...copy };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === "string") {
      (result as Record<string, string>)[key] = sanitizeNoEmDash(result[key]);
    }
  }
  return result;
}
