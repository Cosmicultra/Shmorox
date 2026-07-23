import {
  getPrimaryScreenshotForPillar,
  getProductScreenshotsPromptBlock,
} from "../ad/product-screenshots";
import { getPillarCopyGuardrailsPromptBlock } from "../ad/pillar-copy-guardrails";
import { getPillarById } from "../knowledge/advisorpilot";
import { getBrandDNA } from "./brand-dna";
import { buildCustomRequestContext } from "./custom-request-context";
import type { CreativeBrief, CreativeDirectorInput } from "./types";

/** Compact brand context for exploration calls (~30 lines vs full DNA blocks). */
export function buildCompactBrandContext(brandId = "advisorpilot"): string {
  const dna = getBrandDNA(brandId);
  return `Brand: ${dna.brand}
Voice: ${dna.voice}
Positioning: ${dna.positioning}
Audience: ${dna.audience.slice(0, 4).join(", ")}
Colors: Navy ${dna.colors.primaryNavy}, Blue ${dna.colors.primaryBlue}
Typography: ${dna.typography.headline} headlines, ${dna.typography.body} body
Visual: ${dna.visualLanguage.slice(0, 3).join("; ")}
Avoid: ${dna.avoid.slice(0, 4).join("; ")}`;
}

export function buildExplorationInputContext(input: CreativeDirectorInput): string {
  const pillar = input.contentPillarId ? getPillarById(input.contentPillarId) : undefined;
  const brandContext = buildCompactBrandContext(input.brandId);
  const primaryUi = getPrimaryScreenshotForPillar(input.contentPillarId);

  const pillarContext = pillar
    ? `Pillar: ${pillar.title}
Feature: ${pillar.description}
Headline seed: ${pillar.headline}
Subhead seed: ${pillar.subhead}
CTA seed: ${pillar.cta}
Pain: ${pillar.transformationBefore}
After: ${pillar.transformationAfter}
Primary UI: ${primaryUi?.title ?? "AdvisorPilot product"} — ${primaryUi?.description ?? ""}
${getPillarCopyGuardrailsPromptBlock(input.contentPillarId)}`
    : "";

  const customRequestContext = buildCustomRequestContext(input.customRequest);

  return `${brandContext}

Asset: ${input.assetType}
Campaign: ${input.campaignType ?? pillar?.title ?? "Enterprise Campaign"}
${pillarContext}
${customRequestContext}

${getProductScreenshotsPromptBlock(input.contentPillarId)}`;
}

/** Short brief summary for follow-up calls — avoids re-sending full JSON. */
export function summarizeBrief(brief: CreativeBrief): string {
  return `Headline: ${brief.headline}
Subhead: ${brief.supportingCopy}
CTA: ${brief.cta}
Visual: ${brief.visualConcept}
Goal: ${brief.campaignGoal}
Pain: ${brief.customerPain}`;
}
