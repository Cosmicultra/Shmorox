import type { CampaignRun } from "../types";

/** Normalize headlines for reuse comparison (case, punctuation, line breaks). */
export function normalizeHeadlineKey(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[\n\r]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True for the custom-request UI placeholder that must never ship on ad cards. */
export function isBannedCustomHeadlineSeed(headline: string): boolean {
  const key = normalizeHeadlineKey(headline);
  return key === "your angle our product";
}

/** Collect prior custom-request ad headlines so new campaigns avoid reusing them. */
export function collectPriorCustomHeadlines(
  campaigns: CampaignRun[],
  excludeCampaignId?: string
): string[] {
  const seen = new Set<string>();
  const headlines: string[] = [];

  for (const campaign of campaigns) {
    if (campaign.id === excludeCampaignId) continue;
    if (campaign.contentPillar !== "custom-request") continue;

    for (const ad of campaign.ads ?? []) {
      const raw = ad.headline?.trim();
      if (!raw) continue;
      const key = normalizeHeadlineKey(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      headlines.push(raw.replace(/\n+/g, " ").trim());
    }

    const briefHeadline = campaign.creativeBrief?.headline?.trim();
    if (briefHeadline) {
      const key = normalizeHeadlineKey(briefHeadline);
      if (key && !seen.has(key)) {
        seen.add(key);
        headlines.push(briefHeadline.replace(/\n+/g, " ").trim());
      }
    }
  }

  // Ban the UI placeholder seed unless a campaign later explicitly requests it.
  const placeholderKey = normalizeHeadlineKey("Your angle. Our product.");
  if (!seen.has(placeholderKey)) {
    seen.add(placeholderKey);
    headlines.push("Your angle. Our product.");
  }

  return headlines.slice(0, 40);
}
