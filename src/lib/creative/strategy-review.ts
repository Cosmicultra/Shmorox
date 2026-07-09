import { generateJSON } from "../openai/server";
import { sanitizeNoEmDash } from "../ad/content-guardrails";
import { generateId } from "../utils";
import { EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM, normalizeBriefResponse, type RawCreativeBriefResponse } from "./director-prompts";
import {
  STRATEGY_REVIEW_SYSTEM,
  VARIATION_GATE_SYSTEM,
  buildStrategyReviewPrompt,
  buildStrategyRevisionPrompt,
  buildVariationGatePrompt,
  type RawStrategyReviewResponse,
  type RawVariationGateResponse,
} from "./strategy-review-prompts";
import type {
  ConceptVariation,
  CreativeBrief,
  StrategicDirection,
  StrategyReviewAttempt,
  StrategyReviewResult,
  VariationGateResult,
} from "./types";

const MAX_STRATEGY_ITERATIONS = 3;
const MIN_STRATEGY_SCORE = 75;
const MIN_VARIATION_TOP_SCORE = 70;

function normalizeEvaluation(raw: RawStrategyReviewResponse["evaluation"]) {
  return {
    differentiated: raw?.differentiated ?? false,
    messageStrength: raw?.messageStrength ?? false,
    curiosityOrUrgency: raw?.curiosityOrUrgency ?? false,
    premiumEnterpriseWorthy: raw?.premiumEnterpriseWorthy ?? false,
    positioningClear: raw?.positioningClear ?? false,
    painPointStrong: raw?.painPointStrong ?? false,
    hasStrategicReason: raw?.hasStrategicReason ?? false,
  };
}

function normalizeStrongerDirections(
  raw?: RawStrategyReviewResponse["strongerDirections"]
): StrategicDirection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((d) => ({
    name: d.name ?? "",
    headline: d.headline ?? "",
    positioningAngle: d.positioningAngle ?? "",
    rationale: d.rationale ?? "",
    whyStronger: d.whyStronger ?? "",
  }));
}

export function normalizeStrategyReview(
  raw: RawStrategyReviewResponse,
  iteration: number
): StrategyReviewResult {
  const evaluation = normalizeEvaluation(raw.evaluation);
  const passCount = Object.values(evaluation).filter(Boolean).length;
  const overallScore = raw.overallScore ?? 0;

  const approved =
    raw.approved === true && passCount >= 5 && overallScore >= MIN_STRATEGY_SCORE;

  return {
    approved,
    overallScore,
    evaluation,
    rejectionReasons: raw.rejectionReasons ?? [],
    strategicGap: raw.strategicGap ?? "",
    strongerDirections: normalizeStrongerDirections(raw.strongerDirections),
    recommendedPositioningAngle: raw.recommendedPositioningAngle ?? "",
    directorVerdict: raw.directorVerdict ?? "",
    iteration,
  };
}

export async function reviewStrategy(
  brief: CreativeBrief,
  iteration: number
): Promise<StrategyReviewResult> {
  const raw = await generateJSON<RawStrategyReviewResponse>(
    STRATEGY_REVIEW_SYSTEM,
    buildStrategyReviewPrompt(brief)
  );
  return normalizeStrategyReview(raw, iteration);
}

export async function reviseBriefForStrategy(
  brief: CreativeBrief,
  rejection: StrategyReviewResult
): Promise<CreativeBrief> {
  const userPrompt = buildStrategyRevisionPrompt(brief, rejection);
  const raw = await generateJSON<RawCreativeBriefResponse>(
    EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM,
    userPrompt
  );

  const normalized = normalizeBriefResponse(
    raw,
    brief.assetType,
    brief.brandId,
    brief.conceptStyle,
    brief.version + 1
  );

  return {
    id: generateId(),
    ...normalized,
    headline: sanitizeNoEmDash(normalized.headline),
    supportingCopy: sanitizeNoEmDash(normalized.supportingCopy),
    cta: sanitizeNoEmDash(normalized.cta),
    campaignGoal: sanitizeNoEmDash(normalized.campaignGoal),
    createdAt: new Date().toISOString(),
  };
}

export async function runStrategyReviewLoop(
  brief: CreativeBrief,
  onProgress?: (message: string) => void
): Promise<{
  brief: CreativeBrief;
  approved: boolean;
  history: StrategyReviewAttempt[];
  finalRationale?: string;
}> {
  let currentBrief = brief;
  const history: StrategyReviewAttempt[] = [];

  for (let iteration = 1; iteration <= MAX_STRATEGY_ITERATIONS; iteration++) {
    onProgress?.(
      iteration === 1
        ? "Creative Director evaluating strategic direction…"
        : `Strategic revision ${iteration}/${MAX_STRATEGY_ITERATIONS}…`
    );

    const result = await reviewStrategy(currentBrief, iteration);
    history.push({
      iteration,
      briefSnapshot: { ...currentBrief },
      result,
      improvedDirections: result.strongerDirections,
    });

    if (result.approved) {
      onProgress?.(
        `Strategic direction approved (${result.overallScore}/100). ${result.directorVerdict.slice(0, 100)}…`
      );
      return {
        brief: currentBrief,
        approved: true,
        history,
        finalRationale: result.directorVerdict,
      };
    }

    onProgress?.(result.directorVerdict || `Strategy rejected — ${result.strategicGap}`);

    if (iteration >= MAX_STRATEGY_ITERATIONS) {
      onProgress?.("Max strategy iterations reached. Image production blocked.");
      return { brief: currentBrief, approved: false, history };
    }

    if (!result.rejectionReasons.length && !result.strongerDirections.length) {
      return { brief: currentBrief, approved: false, history };
    }

    onProgress?.("Regenerating stronger strategic direction…");
    currentBrief = await reviseBriefForStrategy(currentBrief, result);
  }

  return { brief: currentBrief, approved: false, history };
}

export function normalizeVariationGate(
  raw: RawVariationGateResponse,
  variations: ConceptVariation[]
): VariationGateResult {
  const topScore = raw.topScore ?? Math.max(...variations.map((v) => v.score), 0);
  const approved = raw.approved === true && topScore >= MIN_VARIATION_TOP_SCORE;

  const selectedStyle = raw.selectedStyle;
  const selectedConcept = selectedStyle
    ? variations.find((v) => v.style === selectedStyle)
    : [...variations].sort((a, b) => b.score - a.score)[0];

  return {
    approved,
    topScore,
    rejectionReasons: raw.rejectionReasons ?? [],
    strategicGap: raw.strategicGap ?? "",
    strongerDirections: normalizeStrongerDirections(raw.strongerDirections),
    recommendedPositioningAngle: raw.recommendedPositioningAngle ?? "",
    directorVerdict: raw.directorVerdict ?? "",
    selectedConcept,
  };
}

export async function runVariationStrategyGate(
  variations: ConceptVariation[],
  onProgress?: (message: string) => void
): Promise<VariationGateResult> {
  onProgress?.("Final strategic gate — evaluating concepts before image production…");

  const raw = await generateJSON<RawVariationGateResponse>(
    VARIATION_GATE_SYSTEM,
    buildVariationGatePrompt(
      variations.map((v) => ({
        name: v.strategy.name,
        style: v.style,
        score: v.score,
        layoutArchetype: v.layoutArchetype ?? v.brief.layoutArchetype,
        brief: v.brief,
      }))
    )
  );

  return normalizeVariationGate(raw, variations);
}
