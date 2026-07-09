import { generateId } from "../utils";
import { sanitizeNoEmDash } from "../ad/content-guardrails";
import { generateJSON } from "../openai/server";
import {
  EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM,
  buildDirectorUserPrompt,
  buildRevisionPrompt,
  buildVariationPrompt,
  normalizeBriefResponse,
  type RawCreativeBriefResponse,
} from "./director-prompts";
import type {
  CampaignAssetType,
  ConceptStyle,
  CreativeBrief,
  CreativeDirectorInput,
  LayoutArchetypeId,
} from "./types";

function sanitizeBriefFields(
  brief: Omit<CreativeBrief, "id" | "createdAt">
): Omit<CreativeBrief, "id" | "createdAt"> {
  return {
    ...brief,
    campaignGoal: sanitizeNoEmDash(brief.campaignGoal),
    audience: sanitizeNoEmDash(brief.audience),
    feature: sanitizeNoEmDash(brief.feature),
    customerPain: sanitizeNoEmDash(brief.customerPain),
    transformation: sanitizeNoEmDash(brief.transformation),
    emotionalGoal: sanitizeNoEmDash(brief.emotionalGoal),
    headline: sanitizeNoEmDash(brief.headline),
    supportingCopy: sanitizeNoEmDash(brief.supportingCopy),
    cta: sanitizeNoEmDash(brief.cta),
    visualConcept: sanitizeNoEmDash(brief.visualConcept),
    composition: sanitizeNoEmDash(brief.composition),
    typography: sanitizeNoEmDash(brief.typography),
    productPlacement: sanitizeNoEmDash(brief.productPlacement),
    uiPriority: sanitizeNoEmDash(brief.uiPriority),
    designLanguage: sanitizeNoEmDash(brief.designLanguage),
    imagePrompt: sanitizeNoEmDash(brief.imagePrompt),
    negativePrompt: sanitizeNoEmDash(brief.negativePrompt),
    reviewChecklist: brief.reviewChecklist.map(sanitizeNoEmDash),
    colorPalette: brief.colorPalette.map(sanitizeNoEmDash),
  };
}

function finalizeBrief(
  raw: RawCreativeBriefResponse,
  assetType: CampaignAssetType,
  brandId = "advisorpilot",
  conceptStyle?: ConceptStyle,
  version = 1,
  forcedLayoutArchetype?: LayoutArchetypeId
): CreativeBrief {
  const normalized = sanitizeBriefFields(
    normalizeBriefResponse(raw, assetType, brandId, conceptStyle, version, forcedLayoutArchetype)
  );

  return {
    id: generateId(),
    ...normalized,
    createdAt: new Date().toISOString(),
  };
}

export async function createCreativeBrief(input: CreativeDirectorInput): Promise<CreativeBrief> {
  const userPrompt = buildDirectorUserPrompt(input);
  const raw = await generateJSON<RawCreativeBriefResponse>(
    EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM,
    userPrompt
  );

  return finalizeBrief(raw, input.assetType, input.brandId ?? "advisorpilot", undefined, 1);
}

export async function reviseCreativeBrief(
  brief: CreativeBrief,
  critique: string,
  revisions: string[]
): Promise<CreativeBrief> {
  const userPrompt = buildRevisionPrompt(brief, critique, revisions);
  const raw = await generateJSON<RawCreativeBriefResponse>(
    EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM,
    userPrompt
  );

  return finalizeBrief(
    raw,
    brief.assetType,
    brief.brandId,
    brief.conceptStyle,
    brief.version + 1
  );
}

export async function createConceptVariation(
  baseBrief: CreativeBrief,
  style: ConceptStyle,
  layoutArchetype?: LayoutArchetypeId
): Promise<CreativeBrief> {
  const userPrompt = buildVariationPrompt(
    baseBrief,
    style,
    layoutArchetype ?? baseBrief.layoutArchetype ?? "editorial-cover"
  );
  const raw = await generateJSON<RawCreativeBriefResponse>(
    EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM,
    userPrompt
  );

  return finalizeBrief(
    raw,
    baseBrief.assetType,
    baseBrief.brandId,
    style,
    1,
    layoutArchetype
  );
}
