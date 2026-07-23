/**
 * Marketing copy guardrails — no em-dashes or en-dashes in generated content.
 */

const ADVISORPILOT_TOKEN = "\uE000ADVISORPILOT\uE001";

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

/** On ad cards, audience copy uses "financial advisor(s)" instead of "advisor(s)". */
export function formatFinancialAdvisorCopy(text: string): string {
  if (!text) return text;

  let out = text.replace(/AdvisorPilot/g, ADVISORPILOT_TOKEN);

  out = out.replace(/\b(?<!financial )advisors\b/gi, (match) => {
    if (match === "Advisors") return "Financial Advisors";
    if (match === "ADVISORS") return "FINANCIAL ADVISORS";
    return "financial advisors";
  });

  out = out.replace(/\b(?<!financial )advisor\b/gi, (match) => {
    if (match === "Advisor") return "Financial Advisor";
    if (match === "ADVISOR") return "FINANCIAL ADVISOR";
    return "financial advisor";
  });

  return out.split(ADVISORPILOT_TOKEN).join("AdvisorPilot");
}

/** Final string cleanup for rendered ad card copy. */
export function formatAdCardDisplayCopy(text: string): string {
  return formatFinancialAdvisorCopy(sanitizeNoEmDash(text));
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
