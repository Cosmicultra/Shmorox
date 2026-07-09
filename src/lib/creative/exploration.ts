import { generateId } from "../utils";
import { sanitizeNoEmDash } from "../ad/content-guardrails";
import { generateJSON } from "../openai/server";
import { getOpenAIConfig } from "../openai/config";
import { normalizeBriefResponse, type RawCreativeBriefResponse } from "./director-prompts";
import {
  EXPLORATION_SYSTEM,
  buildExplorationUserPrompt,
  coerceExplorationScore,
  normalizeConceptStyle,
  normalizeRawExplorationResponse,
  parseExplorationBoolean,
  type RawExplorationResponse,
  type RawExplorationScore,
} from "./exploration-prompts";
import { pickDistinctArchetypes, type LayoutArchetypeId } from "./layout-archetypes";
import { summarizeBrief } from "./prompt-context";
import { normalizeReviewResponse } from "./review-prompts";
import { EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM } from "./director-prompts";
import { checkArchetypeDiversity } from "./visual-diversity";
import {
  CONCEPT_STRATEGIES,
  CONCEPT_STYLES,
  type ConceptStyle,
  type ConceptVariation,
  type CreativeBrief,
  type CreativeDirectorInput,
  type CreativeReviewResult,
  type StrategyReviewAttempt,
  type VariationGateAttempt,
  type VariationGateResult,
  type VisualDiversityReport,
} from "./types";

export interface ExplorationPhaseResult {
  brief: CreativeBrief;
  originalBrief: CreativeBrief;
  review: CreativeReviewResult;
  strategyApproved: boolean;
  strategyReviewHistory: StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  variations: ConceptVariation[];
  visualDiversityReport: VisualDiversityReport;
  selectedConcept: ConceptVariation;
  selectionRationale: string;
  variationGateHistory: VariationGateAttempt[];
  productionApproved: boolean;
}

const MIN_PRODUCTION_SCORE = 70;

function buildScoreMap(raw: RawExplorationResponse): Map<ConceptStyle, RawExplorationScore> {
  const map = new Map<ConceptStyle, RawExplorationScore>();
  const scores = raw.scores ?? [];

  for (let i = 0; i < scores.length; i++) {
    const entry = scores[i];
    let style = normalizeConceptStyle(entry.style);

    if (!style && scores.length === CONCEPT_STYLES.length) {
      style = CONCEPT_STYLES[i];
    }

    if (!style) continue;

    const entryScore = coerceExplorationScore(entry.score);
    const existing = map.get(style);
    if (!existing || entryScore > coerceExplorationScore(existing.score)) {
      map.set(style, { ...entry, score: entryScore });
    }
  }

  return map;
}

function resolveScoreForStyle(
  style: ConceptStyle,
  index: number,
  scoreMap: Map<ConceptStyle, RawExplorationScore>,
  raw: RawExplorationResponse
): RawExplorationScore | undefined {
  const mapped = scoreMap.get(style);
  if (mapped?.score != null) return mapped;

  const scores = raw.scores ?? [];
  if (scores.length === CONCEPT_STYLES.length && scores[index]?.score != null) {
    return scores[index];
  }

  return undefined;
}

function resolveProductionApproval(
  raw: RawExplorationResponse,
  review: CreativeReviewResult,
  selected: ConceptVariation
): {
  productionApproved: boolean;
  strategyApproved: boolean;
  rejectionReasons: string[];
  verdict: string;
} {
  const topScore = selected.score;
  const scorePasses = topScore >= MIN_PRODUCTION_SCORE;
  const explicitProductionBlock =
    raw.productionApproved === false || raw.productionApproved === "false";
  const explicitStrategyBlock =
    raw.strategyApproved === false || raw.strategyApproved === "false";

  let strategyApproved = parseExplorationBoolean(
    raw.strategyApproved,
    review.overallScore >= 75 || scorePasses
  );

  if (scorePasses && explicitStrategyBlock) {
    strategyApproved = review.overallScore >= 50 || topScore >= 75;
  }

  const productionApproved =
    scorePasses &&
    !explicitProductionBlock &&
    (strategyApproved || topScore >= 75);

  const rejectionReasons: string[] = [];
  if (!scorePasses) {
    rejectionReasons.push(
      `Top concept score ${topScore}/100 is below production threshold (${MIN_PRODUCTION_SCORE})`
    );
  }
  if (!strategyApproved && scorePasses) {
    rejectionReasons.push(
      explicitStrategyBlock
        ? raw.strategyRationale || "Strategy direction flagged concerns despite strong concept scores"
        : "Strategy direction did not meet approval criteria"
    );
  }
  if (explicitProductionBlock && scorePasses) {
    rejectionReasons.push(
      raw.productionVerdict || "Production readiness explicitly blocked by Creative Director"
    );
  }

  const verdict =
    raw.productionVerdict ??
    (productionApproved
      ? `Approved for master image — ${selected.strategy.name} (${topScore}/100)`
      : rejectionReasons.join(". "));

  return { productionApproved, strategyApproved, rejectionReasons, verdict };
}

function finalizeExplorationBrief(
  raw: RawExplorationResponse["brief"],
  input: CreativeDirectorInput
): CreativeBrief {
  const brandId = input.brandId ?? "advisorpilot";
  const normalized = normalizeBriefResponse(
    (raw ?? {}) as RawCreativeBriefResponse,
    input.assetType,
    brandId,
    undefined,
    1
  );

  return {
    id: generateId(),
    brandId,
    campaignGoal: sanitizeNoEmDash(normalized.campaignGoal),
    campaignType: sanitizeNoEmDash(normalized.campaignType),
    audience: sanitizeNoEmDash(normalized.audience),
    feature: sanitizeNoEmDash(normalized.feature),
    customerPain: sanitizeNoEmDash(normalized.customerPain),
    transformation: sanitizeNoEmDash(normalized.transformation),
    emotionalGoal: sanitizeNoEmDash(normalized.emotionalGoal),
    headline: sanitizeNoEmDash(normalized.headline),
    supportingCopy: sanitizeNoEmDash(normalized.supportingCopy),
    cta: sanitizeNoEmDash(normalized.cta),
    visualConcept: sanitizeNoEmDash(normalized.visualConcept),
    composition: sanitizeNoEmDash(normalized.composition),
    typography: sanitizeNoEmDash(normalized.typography),
    productPlacement: sanitizeNoEmDash(normalized.productPlacement),
    uiPriority: sanitizeNoEmDash(normalized.uiPriority),
    spacingSystem: normalized.spacingSystem ?? "8-point grid",
    background: sanitizeNoEmDash(normalized.background),
    lighting: sanitizeNoEmDash(normalized.lighting),
    colorPalette: normalized.colorPalette.map(sanitizeNoEmDash),
    designLanguage: sanitizeNoEmDash(normalized.designLanguage),
    layoutArchetype: normalized.layoutArchetype,
    visualComposition: normalized.visualComposition,
    imagePrompt: sanitizeNoEmDash(normalized.imagePrompt),
    negativePrompt: sanitizeNoEmDash(normalized.negativePrompt),
    reviewChecklist: normalized.reviewChecklist.map(sanitizeNoEmDash),
    assetType: input.assetType,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

function buildConceptBrief(
  baseBrief: CreativeBrief,
  style: ConceptStyle,
  archetype: LayoutArchetypeId,
  concept: NonNullable<RawExplorationResponse["concepts"]>[number]
): CreativeBrief {
  const normalized = normalizeBriefResponse(
    {
      ...concept,
      campaignGoal: baseBrief.campaignGoal,
      campaignType: baseBrief.campaignType,
      audience: baseBrief.audience,
      feature: baseBrief.feature,
      customerPain: baseBrief.customerPain,
      transformation: baseBrief.transformation,
      emotionalGoal: baseBrief.emotionalGoal,
      layoutArchetype: archetype,
      spacingSystem: "8-point grid",
      reviewChecklist: baseBrief.reviewChecklist,
    } as RawCreativeBriefResponse,
    baseBrief.assetType,
    baseBrief.brandId,
    style,
    1,
    archetype
  );

  return {
    id: generateId(),
    brandId: baseBrief.brandId,
    campaignGoal: sanitizeNoEmDash(normalized.campaignGoal),
    campaignType: sanitizeNoEmDash(normalized.campaignType),
    audience: sanitizeNoEmDash(normalized.audience),
    feature: sanitizeNoEmDash(normalized.feature),
    customerPain: sanitizeNoEmDash(normalized.customerPain),
    transformation: sanitizeNoEmDash(normalized.transformation),
    emotionalGoal: sanitizeNoEmDash(normalized.emotionalGoal),
    headline: sanitizeNoEmDash(normalized.headline),
    supportingCopy: sanitizeNoEmDash(normalized.supportingCopy),
    cta: sanitizeNoEmDash(normalized.cta),
    visualConcept: sanitizeNoEmDash(normalized.visualConcept),
    composition: sanitizeNoEmDash(normalized.composition),
    typography: sanitizeNoEmDash(normalized.typography),
    productPlacement: sanitizeNoEmDash(normalized.productPlacement),
    uiPriority: sanitizeNoEmDash(normalized.uiPriority),
    spacingSystem: normalized.spacingSystem ?? "8-point grid",
    background: sanitizeNoEmDash(normalized.background),
    lighting: sanitizeNoEmDash(normalized.lighting),
    colorPalette: normalized.colorPalette.map(sanitizeNoEmDash),
    designLanguage: sanitizeNoEmDash(normalized.designLanguage),
    layoutArchetype: archetype,
    visualComposition: normalized.visualComposition,
    imagePrompt: sanitizeNoEmDash(normalized.imagePrompt),
    negativePrompt: sanitizeNoEmDash(normalized.negativePrompt),
    reviewChecklist: normalized.reviewChecklist.map(sanitizeNoEmDash),
    assetType: baseBrief.assetType,
    conceptStyle: style,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

function buildVariations(
  baseBrief: CreativeBrief,
  raw: RawExplorationResponse,
  archetypes: LayoutArchetypeId[]
): ConceptVariation[] {
  const scoreMap = buildScoreMap(raw);

  return CONCEPT_STYLES.map((style, i) => {
    const archetype = archetypes[i];
    const conceptRaw =
      raw.concepts?.find((c) => normalizeConceptStyle(c.style) === style) ??
      (raw.concepts?.length === CONCEPT_STYLES.length ? raw.concepts[i] : undefined);
    const scoreData = resolveScoreForStyle(style, i, scoreMap, raw);
    const brief = conceptRaw
      ? buildConceptBrief(baseBrief, style, archetype, conceptRaw)
      : { ...baseBrief, id: generateId(), conceptStyle: style, layoutArchetype: archetype };

    return {
      style,
      strategy: CONCEPT_STRATEGIES[style],
      brief,
      layoutArchetype: archetype,
      visualComposition: brief.visualComposition,
      score: coerceExplorationScore(scoreData?.score),
      rationale: scoreData?.rationale ?? "",
      strengths: scoreData?.strengths ?? [],
      weaknesses: scoreData?.weaknesses ?? [],
    };
  });
}

function applyIndexScoreFallback(
  variations: ConceptVariation[],
  raw: RawExplorationResponse
): ConceptVariation[] {
  const scores = raw.scores ?? [];
  if (scores.length < CONCEPT_STYLES.length) return variations;

  return variations.map((variation, i) => {
    if (variation.score > 0) return variation;
    const indexScore = coerceExplorationScore(scores[i]?.score);
    if (indexScore <= 0) return variation;
    return { ...variation, score: indexScore };
  });
}

function selectWinner(
  variations: ConceptVariation[],
  selectedStyle?: string
): ConceptVariation {
  const sorted = [...variations].sort((a, b) => b.score - a.score);
  const top = sorted[0];

  const style = normalizeConceptStyle(selectedStyle);
  if (style) {
    const preferred = variations.find((v) => v.style === style);
    if (preferred) {
      if (preferred.score >= top.score - 5) return preferred;
      if (preferred.score === 0 && top.score > 0) return top;
    }
  }

  return top;
}

function buildGateResult(
  selected: ConceptVariation,
  productionApproved: boolean,
  verdict: string,
  rejectionReasons: string[] = []
): VariationGateResult {
  return {
    approved: productionApproved,
    topScore: selected.score,
    rejectionReasons: productionApproved ? [] : rejectionReasons,
    strategicGap: productionApproved ? "" : verdict,
    strongerDirections: [],
    recommendedPositioningAngle: "",
    directorVerdict: verdict,
    selectedConcept: selected,
  };
}

export async function runExplorationPhase(
  input: CreativeDirectorInput,
  onProgress?: (message: string) => void
): Promise<ExplorationPhaseResult> {
  onProgress?.("Phase 1 — strategic exploration (single batched call, text only)…");

  const archetypes = pickDistinctArchetypes(
    input.campaignType ?? "Enterprise Campaign",
    input.assetType
  );
  const userPrompt = buildExplorationUserPrompt(input, archetypes);
  const raw = normalizeRawExplorationResponse(
    await generateJSON<RawExplorationResponse>(
      EXPLORATION_SYSTEM,
      userPrompt,
      { tier: "exploration" }
    )
  );

  const baseBrief = finalizeExplorationBrief(raw.brief, input);
  const originalBrief = { ...baseBrief };
  const review = normalizeReviewResponse(raw.critique ?? {}, 1);

  const variations = applyIndexScoreFallback(
    buildVariations(baseBrief, raw, archetypes),
    raw
  );
  const diversityReport = checkArchetypeDiversity(variations);
  const selected = selectWinner(variations, raw.selectedStyle);
  const selectionRationale = raw.selectionRationale ?? "";

  const {
    productionApproved,
    strategyApproved,
    rejectionReasons,
    verdict,
  } = resolveProductionApproval(raw, review, selected);

  const finalStrategyRationale =
    raw.strategyRationale ||
    (strategyApproved ? verdict : rejectionReasons.join(". "));

  const gateResult = buildGateResult(selected, productionApproved, verdict, rejectionReasons);

  onProgress?.(
    `Exploration complete — ${selected.strategy.name} selected (${selected.score}/100). ` +
      `1 text call, diversity ${diversityReport.visualDiversityScore}/100.`
  );

  return {
    brief: baseBrief,
    originalBrief,
    review,
    strategyApproved,
    strategyReviewHistory: [
      {
        iteration: 1,
        briefSnapshot: baseBrief,
        result: {
          approved: strategyApproved,
          overallScore: review.overallScore,
          evaluation: {
            differentiated: strategyApproved,
            messageStrength: strategyApproved,
            curiosityOrUrgency: strategyApproved,
            premiumEnterpriseWorthy: strategyApproved,
            positioningClear: strategyApproved,
            painPointStrong: strategyApproved,
            hasStrategicReason: strategyApproved,
          },
          rejectionReasons: strategyApproved ? [] : [finalStrategyRationale || "Strategy not approved"],
          strategicGap: strategyApproved ? "" : finalStrategyRationale,
          strongerDirections: [],
          recommendedPositioningAngle: "",
          directorVerdict: finalStrategyRationale,
          iteration: 1,
        },
        improvedDirections: [],
      },
    ],
    finalStrategyRationale,
    variations,
    visualDiversityReport: diversityReport,
    selectedConcept: selected,
    selectionRationale,
    variationGateHistory: [{ iteration: 1, variations, result: gateResult }],
    productionApproved,
  };
}

export async function runPremiumRevision(
  brief: CreativeBrief,
  critique: string
): Promise<CreativeBrief> {
  const { premiumRevisionEnabled } = getOpenAIConfig();
  if (!premiumRevisionEnabled) return brief;

  const userPrompt = `Revise this creative brief based on exploration feedback. Return the full brief JSON.

Current brief summary:
${summarizeBrief(brief)}

Feedback:
${critique}

Return the same JSON shape as a complete creative brief.`;

  const raw = await generateJSON<RawCreativeBriefResponse>(
    EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM,
    userPrompt,
    { tier: "premium" }
  );

  const normalized = normalizeBriefResponse(raw, brief.assetType, brief.brandId, brief.conceptStyle, brief.version + 1);
  return {
    ...brief,
    ...normalized,
    id: generateId(),
    headline: sanitizeNoEmDash(normalized.headline),
    supportingCopy: sanitizeNoEmDash(normalized.supportingCopy),
    cta: sanitizeNoEmDash(normalized.cta),
    version: brief.version + 1,
    createdAt: new Date().toISOString(),
  };
}
