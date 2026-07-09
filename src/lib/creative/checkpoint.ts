import type { AspectRatio } from "../types";
import type { CampaignRun } from "../types";
import type {
  CreativePipelineCheckpoint,
  CreativePipelineStep,
} from "../creative/types";

const STEP_ORDER: CreativePipelineStep[] = [
  "pending",
  "exploration",
  "premium_revision",
  "images",
  "complete",
];

const LEGACY_STEPS: CreativePipelineStep[] = [
  "brief",
  "review",
  "strategy",
  "variations",
  "variation_gate",
];

/** Map legacy checkpoint steps to the new exploration-first pipeline. */
export function normalizeResumeStep(step: CreativePipelineStep): CreativePipelineStep {
  if (LEGACY_STEPS.includes(step)) return "exploration";
  return step;
}

export function stepIndex(step: CreativePipelineStep): number {
  const normalized = normalizeResumeStep(step);
  return STEP_ORDER.indexOf(normalized);
}

export function isStepComplete(current: CreativePipelineStep, target: CreativePipelineStep): boolean {
  const normalizedCurrent = normalizeResumeStep(current);
  const normalizedTarget = normalizeResumeStep(target);
  return stepIndex(normalizedCurrent) > stepIndex(normalizedTarget);
}

export function explorationAlreadyComplete(checkpoint: CreativePipelineCheckpoint): boolean {
  const hasConcepts =
    checkpoint.conceptVariations?.length &&
    checkpoint.selectedConcept &&
    checkpoint.creativeBrief;

  if (!hasConcepts) return false;

  const topScore = checkpoint.selectedConcept?.score ?? 0;
  const gateApproved = checkpoint.variationGateHistory?.at(-1)?.result.approved;
  const hasParsedScores = checkpoint.conceptVariations?.some((v) => v.score > 0) ?? false;

  return gateApproved === true || hasParsedScores || topScore > 0;
}

export function checkpointFromCampaign(campaign: CampaignRun): CreativePipelineCheckpoint {
  return {
    step: normalizeResumeStep(campaign.creativePipelineStep ?? "pending"),
    originalBrief: campaign.originalBrief,
    creativeBrief: campaign.creativeBrief,
    creativeReview: campaign.creativeReview,
    strategyApproved: campaign.strategyApproved,
    strategyReviewHistory: campaign.strategyReviewHistory,
    finalStrategyRationale: campaign.finalStrategyRationale,
    conceptVariations: campaign.conceptVariations,
    visualDiversityReport: campaign.visualDiversityReport,
    variationGateHistory: campaign.variationGateHistory,
    selectedConcept: campaign.selectedConcept,
    selectionRationale: campaign.selectionRationale,
    masterImageUrl: campaign.masterImageUrl,
    adaptedImages: campaign.adaptedImages,
    imagesBlocked: campaign.imagesBlocked,
    creativeJob: campaign.creativeJob,
    generationCost: campaign.generationCost,
  };
}

export function campaignPatchFromCheckpoint(
  checkpoint: CreativePipelineCheckpoint
): Partial<CampaignRun> {
  return {
    creativePipelineStep: checkpoint.step,
    originalBrief: checkpoint.originalBrief,
    creativeBrief: checkpoint.creativeBrief,
    creativeReview: checkpoint.creativeReview,
    strategyApproved: checkpoint.strategyApproved,
    strategyReviewHistory: checkpoint.strategyReviewHistory,
    finalStrategyRationale: checkpoint.finalStrategyRationale,
    conceptVariations: checkpoint.conceptVariations,
    variationGateHistory: checkpoint.variationGateHistory,
    selectedConcept: checkpoint.selectedConcept,
    selectionRationale: checkpoint.selectionRationale,
    masterImageUrl: checkpoint.masterImageUrl,
    adaptedImages: checkpoint.adaptedImages,
    imagesBlocked: checkpoint.imagesBlocked,
    creativeJob: checkpoint.creativeJob,
    generationCost: checkpoint.generationCost,
  };
}

export function needsCreativeResume(campaign: CampaignRun): boolean {
  if (campaign.phase !== "generating") return false;
  const step = normalizeResumeStep(campaign.creativePipelineStep ?? "pending");
  if (!step || step === "pending") return false;

  const needsImageRetry =
    campaign.imagesBlocked &&
    Boolean(campaign.selectedConcept) &&
    (!campaign.adaptedImages || Object.keys(campaign.adaptedImages).length === 0);

  if (needsImageRetry && (step === "images" || step === "complete")) {
    return true;
  }

  if (campaign.ads.length > 0) return false;
  if (step === "complete") return Boolean(campaign.selectedConcept);
  return true;
}

export function isCreativeStepDone(campaign: CampaignRun): boolean {
  return campaign.creativePipelineStep === "complete" && Boolean(campaign.selectedConcept);
}
