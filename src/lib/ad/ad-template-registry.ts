import type { LayoutArchetypeId } from "@/lib/creative/layout-archetypes";
import type { AspectRatio, SocialPlatform } from "@/lib/types";
import type { IconKey, LayoutVariant } from "./visual-config";

export type AdTemplateId =
  | "split-dashboard"
  | "split-clarity"
  | "split-office"
  | "split-monitor"
  | "diagonal-growth";

export type VisualLayoutMode = "split" | "stacked" | "diagonal";
export type BackgroundCrop = "right-half" | "bottom-band" | "full" | "none";
export type ProofType = "steps" | "icons" | "none";

export interface PlatformLayoutTweak {
  headlineScale?: number;
  headlineSizePx?: number;
  qrSize?: number;
  compactFooter?: boolean;
  subheadMaxChars?: number;
}

export interface AdTemplateCopySchema {
  maxHeadlineChars: number;
  maxSubheadChars: number;
  proofType: ProofType;
  accentBar: boolean;
}

export interface AdTemplateVisual {
  mode: VisualLayoutMode;
  backgroundAsset?: string;
  backgroundCrop: BackgroundCrop;
  screenshotPillar: string;
  useRadiatingLines?: boolean;
}

export interface AdTemplateDefinition {
  id: AdTemplateId;
  archetype: LayoutArchetypeId;
  layoutVariant: LayoutVariant;
  aspectRatios: AspectRatio[];
  copySchema: AdTemplateCopySchema;
  visual: AdTemplateVisual;
  platformOverrides: Partial<Record<SocialPlatform, PlatformLayoutTweak>>;
}

export const AD_TEMPLATE_REGISTRY: Record<AdTemplateId, AdTemplateDefinition> = {
  "split-dashboard": {
    id: "split-dashboard",
    archetype: "product-spotlight",
    layoutVariant: "split-office",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 72,
      maxSubheadChars: 120,
      proofType: "steps",
      accentBar: false,
    },
    visual: {
      mode: "split",
      backgroundCrop: "none",
      screenshotPillar: "prospect-workflow",
      useRadiatingLines: true,
    },
    platformOverrides: {
      linkedin: { qrSize: 168 },
      instagram: { headlineScale: 0.94, compactFooter: true },
      x: { qrSize: 140, subheadMaxChars: 100 },
    },
  },
  "split-clarity": {
    id: "split-clarity",
    archetype: "data-story",
    layoutVariant: "split-clarity",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 80,
      maxSubheadChars: 130,
      proofType: "icons",
      accentBar: true,
    },
    visual: {
      mode: "split",
      backgroundAsset: "/ad-assets/layout-examples/split-clarity.png",
      backgroundCrop: "right-half",
      screenshotPillar: "statement-intelligence",
    },
    platformOverrides: {
      instagram: { headlineScale: 0.92, compactFooter: true },
      x: { qrSize: 140, subheadMaxChars: 110 },
    },
  },
  "split-office": {
    id: "split-office",
    archetype: "human-product",
    layoutVariant: "split-office",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 85,
      maxSubheadChars: 140,
      proofType: "icons",
      accentBar: false,
    },
    visual: {
      mode: "split",
      backgroundAsset: "/ad-assets/layout-examples/split-office-laptop.png",
      backgroundCrop: "right-half",
      screenshotPillar: "portfolio-narrative",
    },
    platformOverrides: {
      instagram: { headlineScale: 0.93 },
      x: { qrSize: 140 },
    },
  },
  "split-monitor": {
    id: "split-monitor",
    archetype: "workflow-visualization",
    layoutVariant: "split-clarity",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 80,
      maxSubheadChars: 130,
      proofType: "icons",
      accentBar: true,
    },
    visual: {
      mode: "split",
      backgroundAsset: "/ad-assets/layout-examples/split-office-monitor.png",
      backgroundCrop: "right-half",
      screenshotPillar: "compliance-posture",
    },
    platformOverrides: {
      x: { qrSize: 140, subheadMaxChars: 100 },
    },
  },
  "diagonal-growth": {
    id: "diagonal-growth",
    archetype: "executive-statement",
    layoutVariant: "diagonal-growth",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 70,
      maxSubheadChars: 120,
      proofType: "icons",
      accentBar: false,
    },
    visual: {
      mode: "diagonal",
      backgroundAsset: "/ad-assets/layout-examples/diagonal-growth.png",
      backgroundCrop: "full",
      screenshotPillar: "operational-scale",
    },
    platformOverrides: {
      instagram: { compactFooter: true },
      x: { qrSize: 140 },
    },
  },
};

export const PILLAR_TEMPLATE_MAP: Record<string, AdTemplateId> = {
  "prospect-workflow": "split-dashboard",
  "statement-intelligence": "split-clarity",
  "portfolio-narrative": "split-office",
  "operational-scale": "diagonal-growth",
  "compliance-posture": "split-monitor",
};

const ARCHETYPE_TEMPLATE_FALLBACK: Partial<Record<LayoutArchetypeId, AdTemplateId>> = {
  "product-spotlight": "split-dashboard",
  "data-story": "split-clarity",
  "human-product": "split-office",
  "workflow-visualization": "split-monitor",
  "executive-statement": "diagonal-growth",
  "editorial-cover": "split-office",
  "before-after": "split-clarity",
  "feature-announcement": "split-dashboard",
};

export function getTemplateForPillar(pillarId?: string): AdTemplateDefinition {
  const id: AdTemplateId =
    (pillarId && PILLAR_TEMPLATE_MAP[pillarId]) || "split-office";
  return AD_TEMPLATE_REGISTRY[id];
}

export function getTemplateIdForPillar(pillarId?: string): AdTemplateId {
  return getTemplateForPillar(pillarId).id;
}

export function resolveTemplateFromArchetype(
  archetype: LayoutArchetypeId | string | undefined,
  pillarId?: string
): AdTemplateDefinition {
  if (pillarId && PILLAR_TEMPLATE_MAP[pillarId]) {
    return AD_TEMPLATE_REGISTRY[PILLAR_TEMPLATE_MAP[pillarId]];
  }
  const fallback = archetype
    ? ARCHETYPE_TEMPLATE_FALLBACK[archetype as LayoutArchetypeId]
    : undefined;
  return AD_TEMPLATE_REGISTRY[fallback ?? "split-office"];
}

export function getLayoutVariantForPillar(pillarId?: string): LayoutVariant {
  return getTemplateForPillar(pillarId).layoutVariant;
}

export function getPlatformTweak(
  template: AdTemplateDefinition,
  platform: SocialPlatform
): PlatformLayoutTweak {
  return template.platformOverrides[platform] ?? {};
}

export function getCopyLimitsForTemplate(
  templateId: AdTemplateId,
  platform?: SocialPlatform
): AdTemplateCopySchema & { subheadMax?: number } {
  const template = AD_TEMPLATE_REGISTRY[templateId];
  const tweak = platform ? getPlatformTweak(template, platform) : {};
  return {
    ...template.copySchema,
    subheadMax: tweak.subheadMaxChars ?? template.copySchema.maxSubheadChars,
  };
}

export function getTemplatePromptBlock(templateId: AdTemplateId): string {
  const t = AD_TEMPLATE_REGISTRY[templateId];
  return `Export template: ${t.id} (${t.visual.mode}, proof=${t.copySchema.proofType}). Headline max ${t.copySchema.maxHeadlineChars} chars, subhead max ${t.copySchema.maxSubheadChars} chars.`;
}
