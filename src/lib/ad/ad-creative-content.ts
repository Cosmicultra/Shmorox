import type { AspectRatio, GeneratedAd, SocialPlatform } from "@/lib/types";
import { sanitizeNoEmDash } from "./content-guardrails";
import {
  getTemplateForPillar,
  AD_TEMPLATE_REGISTRY,
  type AdTemplateId,
  type ProofType,
  type AdLayoutStyle,
} from "./ad-template-registry";
import {
  getFeaturesForPillar,
  getStepsForPillar,
  getSupportingLine,
  usesStepList,
  type IconKey,
  type LayoutVariant,
} from "./visual-config";
import {
  estimateCopyColumnLayout,
  type CopyColumnFitInput,
} from "./ad-layout-fit";

export interface AdLayoutModes {
  supportingLine: string;
  compactSteps: boolean;
  compactIcons: boolean;
}

export interface AdProofPoint {
  title: string;
  description?: string;
  icon: IconKey;
}

export interface AdCreativeContent {
  headline: string;
  subhead: string;
  supportingLine: string;
  proofPoints?: AdProofPoint[];
  disclaimer: string;
  cta: string;
}

export interface AdLayoutSpec {
  templateId: AdTemplateId;
  aspectRatio: AspectRatio;
  platform: SocialPlatform;
  layoutVariant: LayoutVariant;
  contentPillarId?: string;
}

function djb2Hash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function tokenizeForOverlap(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function isSupportingRedundant(subhead: string, supporting: string): boolean {
  if (!supporting.trim()) return true;
  const subTokens = new Set(tokenizeForOverlap(subhead));
  const supTokens = tokenizeForOverlap(supporting);
  if (!supTokens.length) return true;
  const overlap = supTokens.filter((w) => subTokens.has(w)).length;
  return overlap / supTokens.length >= 0.7;
}

export function resolveSupportingLine(
  subhead: string,
  supporting: string,
  options?: {
    aspectRatio?: AspectRatio;
    proofType?: ProofType;
    showSupportingLine?: boolean;
  }
): string {
  if (options?.showSupportingLine === false) return "";
  if (options?.proofType === "steps") return "";
  if (options?.proofType === "icons") return "";
  if (options?.proofType === "none") return "";
  if (isSupportingRedundant(subhead, supporting)) return "";
  if (options?.aspectRatio === "9:16" && options?.proofType === "icons") return "";
  return supporting;
}

export function resolveAdLayoutModes(
  headline: string,
  subhead: string,
  layout: AdLayoutSpec,
  rawSupporting: string
): AdLayoutModes {
  const template = AD_TEMPLATE_REGISTRY[layout.templateId];
  let supportingLine = resolveSupportingLine(subhead, rawSupporting, {
    aspectRatio: layout.aspectRatio,
    proofType: template.copySchema.proofType,
    showSupportingLine: template.copySchema.showSupportingLine,
  });

  const baseInput: CopyColumnFitInput = {
    aspectRatio: layout.aspectRatio,
    platform: layout.platform,
    templateId: layout.templateId,
    headline,
    subhead,
    supportingLine,
    contentPillarId: layout.contentPillarId,
    accentBar: template.copySchema.accentBar,
    qrPresent: true,
    iconLayout: layout.aspectRatio === "9:16" ? "grid" : "row",
  };

  let compactSteps = false;
  let compactIcons = false;

  let fit = estimateCopyColumnLayout(baseInput);
  compactSteps = fit.compactSteps;

  if (!fit.fits && supportingLine) {
    supportingLine = "";
    fit = estimateCopyColumnLayout({ ...baseInput, supportingLine, compactSteps });
  }

  if (!fit.fits && !compactIcons && !usesStepList(layout.contentPillarId)) {
    compactIcons = true;
    fit = estimateCopyColumnLayout({
      ...baseInput,
      supportingLine,
      compactSteps,
      compactIcons,
    });
  }

  if (!fit.fits && usesStepList(layout.contentPillarId) && !compactSteps) {
    compactSteps = true;
    fit = estimateCopyColumnLayout({
      ...baseInput,
      supportingLine,
      compactSteps: true,
      compactIcons,
    });
  }

  return { supportingLine, compactSteps, compactIcons };
}

export function buildContentFromAd(ad: GeneratedAd): AdCreativeContent {
  const pillarId = ad.contentPillarId;
  const layout = buildLayoutSpecFromAd(ad);
  const template = AD_TEMPLATE_REGISTRY[layout.templateId];
  const steps = getStepsForPillar(pillarId);
  const proofPoints: AdProofPoint[] | undefined =
    template.copySchema.proofType === "steps" && steps
      ? steps.map((s) => ({ title: s.title, description: s.description, icon: s.icon }))
      : template.copySchema.proofType === "icons"
        ? getFeaturesForPillar(pillarId).map((f) => ({ title: f.label, icon: f.icon }))
        : undefined;

  const headline = sanitizeNoEmDash(ad.headline);
  const subhead = sanitizeNoEmDash(ad.subhead);
  const rawSupporting = getSupportingLine(pillarId);
  const modes = resolveAdLayoutModes(headline, subhead, layout, rawSupporting);

  return {
    headline,
    subhead,
    supportingLine: modes.supportingLine,
    proofPoints,
    disclaimer: sanitizeNoEmDash(ad.disclaimer),
    cta: sanitizeNoEmDash(ad.cta),
  };
}

export function buildLayoutSpecFromAd(ad: GeneratedAd): AdLayoutSpec {
  const layoutStyle: AdLayoutStyle = ad.layoutStyle ?? "split-graphic";
  const template = getTemplateForPillar(ad.contentPillarId, layoutStyle);
  const templateId =
    layoutStyle === "text-only"
      ? "text-focused"
      : ((ad.templateId ?? template.id) as AdTemplateId);
  return {
    templateId,
    aspectRatio: ad.aspectRatio,
    platform: ad.platform,
    layoutVariant: ad.layoutVariant ?? template.layoutVariant,
    contentPillarId: ad.contentPillarId,
  };
}

export function computeContentHash(
  content: AdCreativeContent,
  layout: AdLayoutSpec,
  meta?: { layoutStyle?: string; canvasStyle?: string }
): string {
  const payload = JSON.stringify({
    headline: content.headline,
    subhead: content.subhead,
    supportingLine: content.supportingLine,
    disclaimer: content.disclaimer,
    cta: content.cta,
    templateId: layout.templateId,
    aspectRatio: layout.aspectRatio,
    platform: layout.platform,
    pillar: layout.contentPillarId,
    layoutStyle: meta?.layoutStyle,
    canvasStyle: meta?.canvasStyle,
  });
  return djb2Hash(payload);
}

export function enrichGeneratedAd(ad: GeneratedAd): GeneratedAd {
  const layoutStyle: AdLayoutStyle = ad.layoutStyle ?? "split-graphic";
  const template = getTemplateForPillar(ad.contentPillarId, layoutStyle);
  const templateId = layoutStyle === "text-only" ? "text-focused" : (ad.templateId ?? template.id);
  const canvasStyle = ad.canvasStyle ?? AD_TEMPLATE_REGISTRY[templateId].canvasStyle;
  const enriched = {
    ...ad,
    templateId,
    layoutVariant: template.layoutVariant,
    layoutStyle,
    canvasStyle,
  };
  const content = buildContentFromAd(enriched);
  const layout = buildLayoutSpecFromAd(enriched);
  const contentHash = computeContentHash(content, layout, {
    layoutStyle: enriched.layoutStyle,
    canvasStyle: enriched.canvasStyle,
  });

  return {
    ...enriched,
    contentHash,
  };
}

export function enrichGeneratedAds(ads: GeneratedAd[]): GeneratedAd[] {
  return ads.map(enrichGeneratedAd);
}
