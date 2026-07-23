import type { LayoutArchetypeId } from "@/lib/creative/layout-archetypes";
import type { AspectRatio, SocialPlatform } from "@/lib/types";
import type { IconKey, LayoutVariant } from "./visual-config";

export type AdTemplateId =
  | "split-dashboard"
  | "split-clarity"
  | "split-office"
  | "split-monitor"
  | "diagonal-growth"
  | "text-focused";

export type AdLayoutStyle = "split-graphic" | "text-only";
export type CanvasStyle = "gradient" | "clean";

export type VisualLayoutMode = "split" | "stacked" | "diagonal" | "text-only";
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
  showSupportingLine: boolean;
  maxStepDescChars: number;
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
  canvasStyle: CanvasStyle;
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
      maxSubheadChars: 90,
      proofType: "steps",
      accentBar: false,
      showSupportingLine: false,
      maxStepDescChars: 48,
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
    canvasStyle: "gradient",
  },
  "split-clarity": {
    id: "split-clarity",
    archetype: "data-story",
    layoutVariant: "split-clarity",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 80,
      maxSubheadChars: 90,
      proofType: "steps",
      accentBar: true,
      showSupportingLine: false,
      maxStepDescChars: 48,
    },
    visual: {
      mode: "split",
      backgroundAsset: "/ad-assets/layout-examples/split-clarity.png",
      backgroundCrop: "right-half",
      screenshotPillar: "statement-intelligence",
    },
    platformOverrides: {
      instagram: { headlineScale: 0.92, compactFooter: true },
      x: { qrSize: 140, subheadMaxChars: 90 },
    },
    canvasStyle: "gradient",
  },
  "split-office": {
    id: "split-office",
    archetype: "human-product",
    layoutVariant: "split-office",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 85,
      maxSubheadChars: 90,
      proofType: "steps",
      accentBar: false,
      showSupportingLine: false,
      maxStepDescChars: 48,
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
    canvasStyle: "gradient",
  },
  "split-monitor": {
    id: "split-monitor",
    archetype: "workflow-visualization",
    layoutVariant: "split-clarity",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 80,
      maxSubheadChars: 90,
      proofType: "steps",
      accentBar: true,
      showSupportingLine: false,
      maxStepDescChars: 48,
    },
    visual: {
      mode: "split",
      backgroundAsset: "/ad-assets/layout-examples/split-office-monitor.png",
      backgroundCrop: "right-half",
      screenshotPillar: "compliance-posture",
    },
    platformOverrides: {
      x: { qrSize: 140, subheadMaxChars: 90 },
    },
    canvasStyle: "gradient",
  },
  "diagonal-growth": {
    id: "diagonal-growth",
    archetype: "executive-statement",
    layoutVariant: "diagonal-growth",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 70,
      maxSubheadChars: 90,
      proofType: "steps",
      accentBar: false,
      showSupportingLine: false,
      maxStepDescChars: 48,
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
    canvasStyle: "gradient",
  },
  "text-focused": {
    id: "text-focused",
    archetype: "editorial-cover",
    layoutVariant: "split-office",
    aspectRatios: ["1:1", "9:16"],
    copySchema: {
      maxHeadlineChars: 85,
      maxSubheadChars: 90,
      proofType: "none",
      accentBar: false,
      showSupportingLine: false,
      maxStepDescChars: 48,
    },
    visual: {
      mode: "text-only",
      backgroundCrop: "none",
      screenshotPillar: "portfolio-narrative",
    },
    platformOverrides: {
      linkedin: { qrSize: 168 },
      instagram: { headlineScale: 0.94, compactFooter: true },
      x: { qrSize: 140, subheadMaxChars: 80 },
    },
    canvasStyle: "clean",
  },
};

export const PILLAR_TEMPLATE_MAP: Record<string, AdTemplateId> = {
  "prospect-workflow": "split-dashboard",
  "statement-intelligence": "split-clarity",
  "portfolio-narrative": "split-office",
  "operational-scale": "diagonal-growth",
  "compliance-posture": "split-monitor",
  "company-launch": "split-dashboard",
  "custom-request": "split-office",
};

const ARCHETYPE_TEMPLATE_FALLBACK: Partial<Record<LayoutArchetypeId, AdTemplateId>> = {
  "product-spotlight": "split-dashboard",
  "data-story": "split-clarity",
  "human-product": "split-office",
  "workflow-visualization": "split-monitor",
  "executive-statement": "diagonal-growth",
  "editorial-cover": "text-focused",
  "before-after": "split-clarity",
  "feature-announcement": "split-dashboard",
};

export function getTemplateForPillar(
  pillarId?: string,
  layoutStyle: AdLayoutStyle = "split-graphic"
): AdTemplateDefinition {
  if (layoutStyle === "text-only") {
    return AD_TEMPLATE_REGISTRY["text-focused"];
  }
  const id: AdTemplateId =
    (pillarId && PILLAR_TEMPLATE_MAP[pillarId]) || "split-office";
  return AD_TEMPLATE_REGISTRY[id];
}

export function getTemplateIdForPillar(
  pillarId?: string,
  layoutStyle: AdLayoutStyle = "split-graphic"
): AdTemplateId {
  return getTemplateForPillar(pillarId, layoutStyle).id;
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
  const cs = t.copySchema;
  const supportingRule =
    cs.proofType === "steps" || !cs.showSupportingLine
      ? "Do NOT write a fourth supporting paragraph — steps are the proof."
      : "One optional outcome line only; must not repeat step titles or subhead.";
  return `Export template: ${t.id} (${t.visual.mode}, proof=${cs.proofType}).
- Headline max ${cs.maxHeadlineChars} chars; subhead max ${cs.maxSubheadChars} chars.
- Step descriptions max ${cs.maxStepDescChars} chars each.
- ${supportingRule}
- Headline test: would a busy FA stop scrolling on LinkedIn?
- Subhead must state what AdvisorPilot does and who it is for (advisors/RIAs) in ≤90 chars.
- Value props (Secure. Your Data., Built for Advisors.) render automatically — do not repeat in subhead.`;
}
