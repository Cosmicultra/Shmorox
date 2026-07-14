import type { AspectRatio, GeneratedAd, SocialPlatform } from "@/lib/types";
import { sanitizeNoEmDash } from "./content-guardrails";
import {
  getTemplateForPillar,
  getTemplateIdForPillar,
  type AdTemplateId,
  type ProofType,
} from "./ad-template-registry";
import {
  getFeaturesForPillar,
  getStepsForPillar,
  getSupportingLine,
  type IconKey,
  type LayoutVariant,
} from "./visual-config";

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
  options?: { aspectRatio?: AspectRatio; proofType?: ProofType }
): string {
  if (isSupportingRedundant(subhead, supporting)) return "";
  if (options?.aspectRatio === "9:16" && options?.proofType === "icons") return "";
  return supporting;
}

export function buildContentFromAd(ad: GeneratedAd): AdCreativeContent {
  const pillarId = ad.contentPillarId;
  const template = getTemplateForPillar(pillarId);
  const steps = getStepsForPillar(pillarId);
  const proofPoints: AdProofPoint[] | undefined = steps
    ? steps.map((s) => ({ title: s.title, description: s.description, icon: s.icon }))
    : getFeaturesForPillar(pillarId).map((f) => ({ title: f.label, icon: f.icon }));

  const subhead = sanitizeNoEmDash(ad.subhead);
  const rawSupporting = getSupportingLine(pillarId);

  return {
    headline: sanitizeNoEmDash(ad.headline),
    subhead,
    supportingLine: resolveSupportingLine(subhead, rawSupporting, {
      aspectRatio: ad.aspectRatio,
      proofType: template.copySchema.proofType,
    }),
    proofPoints,
    disclaimer: sanitizeNoEmDash(ad.disclaimer),
    cta: sanitizeNoEmDash(ad.cta),
  };
}

export function buildLayoutSpecFromAd(ad: GeneratedAd): AdLayoutSpec {
  const template = getTemplateForPillar(ad.contentPillarId);
  return {
    templateId: ad.templateId ?? template.id,
    aspectRatio: ad.aspectRatio,
    platform: ad.platform,
    layoutVariant: ad.layoutVariant ?? template.layoutVariant,
    contentPillarId: ad.contentPillarId,
  };
}

export function computeContentHash(
  content: AdCreativeContent,
  layout: AdLayoutSpec
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
  });
  return djb2Hash(payload);
}

export function enrichGeneratedAd(ad: GeneratedAd): GeneratedAd {
  const templateId = ad.templateId ?? getTemplateIdForPillar(ad.contentPillarId);
  const template = getTemplateForPillar(ad.contentPillarId);
  const content = buildContentFromAd(ad);
  const layout = buildLayoutSpecFromAd({ ...ad, templateId, layoutVariant: template.layoutVariant });
  const contentHash = computeContentHash(content, layout);

  return {
    ...ad,
    templateId,
    layoutVariant: template.layoutVariant,
    contentHash,
  };
}

export function enrichGeneratedAds(ads: GeneratedAd[]): GeneratedAd[] {
  return ads.map(enrichGeneratedAd);
}
