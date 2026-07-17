import { generateId } from "../utils";
import { ADVISORPILOT_KNOWLEDGE, getPillarById } from "../knowledge/advisorpilot";
import type { AspectRatio, GeneratedAd, SocialPlatform } from "../types";
import { SOCIAL_PLATFORMS } from "../types";
import { enrichGeneratedAd } from "./ad-creative-content";
import { getLayoutForPillar } from "./visual-config";
import { getTemplateForPillar } from "./ad-template-registry";
import {
  AD_DIMENSIONS,
  fitGeneratedCopyForLayout,
  getPlatformCopyAdjustments,
  validateCreative,
} from "./creative-rules";
import { sanitizeNoEmDash } from "./content-guardrails";

export interface AdGenerationInput {
  contentPillarId: string;
  platforms: SocialPlatform[];
  /** Expensive: generate AI preview images for all concepts before selection. */
  generateConceptImages?: boolean;
  layoutStyle?: import("./ad-template-registry").AdLayoutStyle;
  canvasStyle?: import("./ad-template-registry").CanvasStyle;
}

const CAPTION_TEMPLATES: Record<string, string[]> = {
  "prospect-workflow": [
    `The most time-consuming part of client reviews was never the advice. ${ADVISORPILOT_KNOWLEDGE.brandMark} connects statement intake, analysis, and deliverables in one workflow.`,
    `Your best asset in a prospect meeting is you, not hours of prep. See how ${ADVISORPILOT_KNOWLEDGE.brandMark} automates the handoffs.`,
  ],
  "statement-intelligence": [
    `Custodian PDFs in. Confirmed holdings out. ${ADVISORPILOT_KNOWLEDGE.brandMark} standardizes symbols and flags anomalies before analysis depends on them.`,
    `Stop reconciling three versions of the same account. ${ADVISORPILOT_KNOWLEDGE.brandMark} extracts and structures custodian statements in minutes.`,
  ],
  "portfolio-narrative": [
    `Turn client reviews into clarity, not more admin work. ${ADVISORPILOT_KNOWLEDGE.brandMark} drafts risk, diversification, and talking points for your review.`,
    `Generic marketing language doesn't belong in client reviews. ${ADVISORPILOT_KNOWLEDGE.brandMark} generates narratives aligned to how you actually advise.`,
  ],
  "operational-scale": [
    `Review volume growing faster than headcount? ${ADVISORPILOT_KNOWLEDGE.brandMark} scales prep work so your team spends more time on advice and relationships.`,
    `The handoffs consume the clock: PDFs, spreadsheets, rushed narratives. One workflow replaces three disconnected projects.`,
  ],
  "compliance-posture": [
    `AI that assists workflow preparation, not investment advice. ${ADVISORPILOT_KNOWLEDGE.brandMark} is built by advisors who understand fiduciary discipline.`,
    `Wirehouse-grade operational discipline without wirehouse infrastructure. See how ${ADVISORPILOT_KNOWLEDGE.brandMark} fits your review stack.`,
  ],
};

export function generateAdsFromTemplates(input: AdGenerationInput): GeneratedAd[] {
  const pillar = getPillarById(input.contentPillarId);
  if (!pillar) throw new Error(`Unknown content pillar: ${input.contentPillarId}`);

  const ads: GeneratedAd[] = [];
  const layoutStyle = input.layoutStyle ?? "split-graphic";
  const template = getTemplateForPillar(input.contentPillarId, layoutStyle);
  const layoutVariant = template.layoutVariant;

  for (const platform of input.platforms) {
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!platformConfig) continue;

    const copy = getPlatformCopyAdjustments(platform, pillar);
    const headline = sanitizeNoEmDash(copy.headline);
    const subhead = sanitizeNoEmDash(copy.subhead);
    const cta = sanitizeNoEmDash(copy.cta);

    for (const aspectRatio of platformConfig.aspectRatios) {
      const fittedCopy = fitGeneratedCopyForLayout({
        contentPillarId: input.contentPillarId,
        platform,
        aspectRatio,
        headline,
        subhead,
        templateId: template.id,
      });
      validateCreative(fittedCopy.headline, fittedCopy.subhead, cta, aspectRatio);
      const dims = AD_DIMENSIONS[aspectRatio];

      ads.push(
        enrichGeneratedAd({
          id: generateId(),
          platform,
          aspectRatio,
          contentPillarId: input.contentPillarId,
          layoutVariant,
          layoutStyle,
          canvasStyle: input.canvasStyle ?? template.canvasStyle,
          headline: fittedCopy.headline,
          subhead: fittedCopy.subhead,
          cta,
          disclaimer: sanitizeNoEmDash(ADVISORPILOT_KNOWLEDGE.standardDisclaimer),
          width: dims.width,
          height: dims.height,
        })
      );
    }
  }

  return ads;
}

export function generateCaptionsFromTemplates(
  pillarId: string,
  platforms: SocialPlatform[]
): Record<SocialPlatform, string> {
  const templates = CAPTION_TEMPLATES[pillarId] ?? CAPTION_TEMPLATES["prospect-workflow"];
  const result = {} as Record<SocialPlatform, string>;

  for (const platform of platforms) {
    const templateIndex = platform === "linkedin" ? 0 : platform === "x" ? 1 : 0;
    result[platform] = sanitizeNoEmDash(templates[templateIndex % templates.length]);
  }

  return result;
}
