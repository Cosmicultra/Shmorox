import type { AspectRatio, SocialPlatform } from "../types";
import type { ContentPillar } from "../knowledge/advisorpilot";
import { containsEmDash } from "./content-guardrails";
import {
  fitAdCopyForLayout,
  type CopyColumnFitInput,
} from "./ad-layout-fit";
import { AD_TEMPLATE_REGISTRY, getTemplateIdForPillar } from "./ad-template-registry";
import { resolveSupportingLine } from "./ad-creative-content";
import { getSupportingLine } from "./visual-config";
import { resolveWhatWeDoCopy, validateProductClarityCopy } from "./product-clarity";

export interface CreativeValidation {
  valid: boolean;
  warnings: string[];
}

const PLATFORM_SAFE_ZONES: Record<AspectRatio, { top: number; bottom: number }> = {
  "1:1": { top: 0, bottom: 0 },
  "9:16": { top: 120, bottom: 200 },
};

export function validateLayoutFit(input: CopyColumnFitInput): CreativeValidation {
  const fit = fitAdCopyForLayout(input);
  const warnings: string[] = [];

  if (!fit.fit.fits) {
    warnings.push(
      `Copy column overflow (~${Math.round(fit.fit.overflowPx)}px). Content may overlap QR or clip.`
    );
  }

  if (fit.fit.overlaps.length > 0) {
    warnings.push(
      `Copy elements may overlap (${fit.fit.overlaps.map((o) => `${o.a}/${o.b}`).join(", ")}).`
    );
  }

  return { valid: warnings.length === 0, warnings };
}

export function fitGeneratedCopyForLayout(options: {
  contentPillarId: string;
  platform: SocialPlatform;
  aspectRatio: AspectRatio;
  headline: string;
  subhead: string;
  templateId?: string;
}): { headline: string; subhead: string } {
  const templateId = (options.templateId ?? getTemplateIdForPillar(options.contentPillarId)) as CopyColumnFitInput["templateId"];
  const template = AD_TEMPLATE_REGISTRY[templateId];
  const rawSupporting = getSupportingLine(options.contentPillarId);
  const supportingLine = resolveSupportingLine(options.subhead, rawSupporting, {
    aspectRatio: options.aspectRatio,
    proofType: template.copySchema.proofType,
    showSupportingLine: template.copySchema.showSupportingLine,
  });

  const fitted = fitAdCopyForLayout({
    aspectRatio: options.aspectRatio,
    platform: options.platform,
    templateId,
    headline: options.headline,
    subhead: resolveWhatWeDoCopy(options.contentPillarId, options.subhead),
    supportingLine,
    contentPillarId: options.contentPillarId,
    accentBar: template.copySchema.accentBar,
    qrPresent: true,
  });

  return {
    headline: options.headline,
    subhead: fitted.subhead,
  };
}

export function validateProductClarity(
  subhead: string,
  pillarId?: string
): CreativeValidation {
  const result = validateProductClarityCopy({ pillarId, subhead });
  return {
    valid: result.valid,
    warnings: result.errors,
  };
}

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
