import type { AspectRatio, SocialPlatform } from "../types";
import type { ContentPillar } from "../knowledge/advisorpilot";
import { containsEmDash } from "./content-guardrails";

export interface CreativeValidation {
  valid: boolean;
  warnings: string[];
}

const PLATFORM_SAFE_ZONES: Record<AspectRatio, { top: number; bottom: number }> = {
  "1:1": { top: 0, bottom: 0 },
  "9:16": { top: 120, bottom: 200 },
};

export function validateCreative(
  headline: string,
  subhead: string,
  cta: string,
  aspectRatio: AspectRatio
): CreativeValidation {
  const warnings: string[] = [];

  if (containsEmDash(headline) || containsEmDash(subhead) || containsEmDash(cta)) {
    warnings.push("Em-dashes are not permitted in marketing copy. Use commas or periods instead.");
  }
  if (headline.length > 90) {
    warnings.push("Headline exceeds 90 characters, may truncate on mobile.");
  }
  if (subhead.length > 140) {
    warnings.push("Subhead exceeds 140 characters, consider shortening.");
  }
  if (!cta.trim()) {
    warnings.push("Missing call-to-action.");
  }
  if (headline.split(" ").length > 14) {
    warnings.push("Headline has too many words, aim for one clear message.");
  }
  if (aspectRatio === "9:16") {
    const zone = PLATFORM_SAFE_ZONES["9:16"];
    warnings.push(
      `9:16 safe zone: keep key content between ${zone.top}px and bottom ${zone.bottom}px from edges.`
    );
  }

  return { valid: warnings.length === 0, warnings };
}

export function getPlatformCopyAdjustments(
  platform: SocialPlatform,
  pillar: ContentPillar
): { headline: string; subhead: string; cta: string } {
  const base = {
    headline: pillar.headline,
    subhead: pillar.subhead,
    cta: pillar.cta,
  };

  switch (platform) {
    case "linkedin":
      return {
        headline: base.headline,
        subhead: base.subhead,
        cta: "Request a demo",
      };
    case "instagram":
      return {
        headline: base.headline,
        subhead: base.subhead.slice(0, 60),
        cta: base.cta,
      };
    case "x":
      return {
        headline: base.headline.slice(0, 55),
        subhead: base.subhead.slice(0, 50),
        cta: "Demo",
      };
    case "tiktok":
      return {
        headline: base.headline,
        subhead: base.subhead.slice(0, 55),
        cta: "Request a demo",
      };
    default:
      return base;
  }
}

export const AD_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

export function getAdDimensions(aspectRatio: AspectRatio) {
  return AD_DIMENSIONS[aspectRatio];
}
