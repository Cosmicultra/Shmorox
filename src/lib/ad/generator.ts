import type { GeneratedAd, AspectRatio } from "../types";
import type { AdGenerationInput } from "./template-generator";
import type {
  CreativeBrief,
  ConceptVariation,
  CreativeReviewResult,
  CreativeJob,
  StrategyReviewAttempt,
  VariationGateAttempt,
  CreativePipelineCheckpoint,
  CreativePipelineStep,
} from "../creative/types";
import {
  explorationAlreadyComplete,
  isStepComplete,
  normalizeResumeStep,
} from "../creative/checkpoint";
import {
  createCreativeJob,
  updateJobStage,
  attachExplorationToJob,
  attachImagesToJob,
  attachLayoutAdaptationToJob,
  blockImagesOnJob,
  completeJob,
  setJobStatus,
} from "../creative/job";
import { getOpenAIConfig } from "../openai/config";
import { getBrandDNA } from "../creative/brand-dna";
import { buildMasterImagePrompt } from "../creative/image-prompts";
import { adaptMasterToAspectRatios } from "./layout-adapter";
import {
  applyApprovedAssetCost,
  emptyCostReport,
  mergeCostDeltas,
  type GenerationCostDelta,
  type GenerationCostReport,
} from "../openai/cost-tracker";
import { generateId } from "../utils";
import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";
import { sanitizeNoEmDash } from "./content-guardrails";
import { AD_DIMENSIONS, validateCreative } from "./creative-rules";
import { enrichGeneratedAd } from "./ad-creative-content";
import { getLayoutForPillar } from "./visual-config";
import { generateAdsFromTemplates } from "./template-generator";
import { SOCIAL_PLATFORMS } from "../types";

export type { AdGenerationInput };

export interface GenerateAdsOptions {
  input: AdGenerationInput;
  checkpoint?: CreativePipelineCheckpoint;
  onProgress?: (step: string) => void;
  onCheckpoint?: (checkpoint: CreativePipelineCheckpoint) => void;
}

export interface GenerateAdsResult {
  ads: GeneratedAd[];
  creativeBrief?: CreativeBrief;
  originalBrief?: CreativeBrief;
  creativeReview?: CreativeReviewResult;
  strategyApproved?: boolean;
  strategyReviewHistory?: StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  conceptVariations?: ConceptVariation[];
  visualDiversityReport?: import("../creative/types").VisualDiversityReport;
  variationGateHistory?: VariationGateAttempt[];
  selectedConcept?: ConceptVariation;
  masterImageUrl?: string;
  adaptedImages?: Partial<Record<AspectRatio, string>>;
  imagesBlocked?: boolean;
  creativeJob?: CreativeJob;
  creativePipelineStep?: CreativePipelineStep;
  generationCost?: GenerationCostReport;
  source: "creative-director" | "template";
}

function getRequiredAspectRatios(platforms: AdGenerationInput["platforms"]): AspectRatio[] {
  const ratios = new Set<AspectRatio>();
  for (const platform of platforms) {
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!platformConfig) continue;
    for (const ratio of platformConfig.aspectRatios) ratios.add(ratio);
  }
  return [...ratios];
}

function accumulateCost(
  current: GenerationCostReport,
  delta?: GenerationCostDelta
): GenerationCostReport {
  if (!delta) return current;
  return mergeCostDeltas(current, delta);
}

async function applyLayoutAdaptation(
  masterImageUrl: string,
  platforms: AdGenerationInput["platforms"],
  onProgress?: (step: string) => void
): Promise<Partial<Record<AspectRatio, string>>> {
  const aspectRatios = getRequiredAspectRatios(platforms);
  const needsLayoutAdapt = aspectRatios.some((ratio) => ratio !== "1:1");

  if (!needsLayoutAdapt) {
    return { "1:1": masterImageUrl };
  }

  onProgress?.("Adapting master image to platform layouts via rendering (no AI)…");
  return adaptMasterToAspectRatios(masterImageUrl, aspectRatios);
}

async function runCreativeStep<T>(step: string, body: Record<string, unknown>): Promise<T & {
  costDelta?: GenerationCostDelta;
}> {
  const response = await fetch("/api/creative/step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, ...body }),
  });

  const data = (await response.json()) as T & { error?: string; costDelta?: GenerationCostDelta };
  if (!response.ok) {
    throw new Error(data.error ?? `Creative step "${step}" failed`);
  }
  return data;
}

function buildAdsFromBrief(
  contentPillarId: string,
  platforms: AdGenerationInput["platforms"],
  brief: CreativeBrief,
  adaptedImages: Partial<Record<AspectRatio, string>>
): GeneratedAd[] {
  const layoutVariant = getLayoutForPillar(contentPillarId);
  const ads: GeneratedAd[] = [];

  for (const platform of platforms) {
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!platformConfig) continue;

    for (const aspectRatio of platformConfig.aspectRatios) {
      const headline = sanitizeNoEmDash(brief.headline);
      const subhead = sanitizeNoEmDash(brief.supportingCopy);
      const cta = sanitizeNoEmDash(brief.cta);
      validateCreative(headline, subhead, cta, aspectRatio);
      const dims = AD_DIMENSIONS[aspectRatio];

      ads.push(
        enrichGeneratedAd({
          id: generateId(),
          platform,
          aspectRatio,
          contentPillarId,
          layoutVariant,
          headline,
          subhead,
          cta,
          disclaimer: sanitizeNoEmDash(ADVISORPILOT_KNOWLEDGE.standardDisclaimer),
          creativeAssetUrl: adaptedImages[aspectRatio],
          width: dims.width,
          height: dims.height,
        })
      );
    }
  }

  return ads;
}

function saveCheckpoint(
  state: CreativePipelineCheckpoint,
  onCheckpoint?: (checkpoint: CreativePipelineCheckpoint) => void
) {
  onCheckpoint?.({ ...state });
}

export async function generateAds(
  inputOrOptions: AdGenerationInput | GenerateAdsOptions,
  legacyOnProgress?: (step: string) => void
): Promise<GenerateAdsResult> {
  const options: GenerateAdsOptions =
    "contentPillarId" in inputOrOptions
      ? { input: inputOrOptions, onProgress: legacyOnProgress }
      : inputOrOptions;

  const { input, checkpoint, onProgress, onCheckpoint } = options;
  let resumeStep = normalizeResumeStep(checkpoint?.step ?? "pending");

  const gateApproved = checkpoint?.variationGateHistory?.at(-1)?.result.approved;
  const hasCreativeAssets =
    Boolean(checkpoint?.masterImageUrl) ||
    Object.keys(checkpoint?.adaptedImages ?? {}).length > 0;

  if (checkpoint && explorationAlreadyComplete(checkpoint) && resumeStep === "exploration") {
    resumeStep = hasCreativeAssets
      ? "complete"
      : gateApproved === true
        ? "images"
        : "complete";
  }

  if (
    resumeStep === "complete" &&
    checkpoint?.imagesBlocked &&
    checkpoint?.selectedConcept &&
    gateApproved === true &&
    !hasCreativeAssets
  ) {
    resumeStep = "images";
  }

  if (resumeStep === "complete" && checkpoint?.selectedConcept) {
    const winner = checkpoint.selectedConcept;
    const adaptedImages = checkpoint.adaptedImages ?? {};
    onProgress?.("Finalizing ads from completed creative pipeline…");
    return {
      ads: buildAdsFromBrief(input.contentPillarId, input.platforms, winner.brief, adaptedImages),
      creativeBrief: checkpoint.creativeBrief,
      originalBrief: checkpoint.originalBrief,
      creativeReview: checkpoint.creativeReview,
      strategyApproved: checkpoint.strategyApproved,
      strategyReviewHistory: checkpoint.strategyReviewHistory,
      finalStrategyRationale: checkpoint.finalStrategyRationale,
      conceptVariations: checkpoint.conceptVariations,
      visualDiversityReport: checkpoint.visualDiversityReport,
      variationGateHistory: checkpoint.variationGateHistory,
      selectedConcept: winner,
      masterImageUrl: checkpoint.masterImageUrl,
      adaptedImages,
      imagesBlocked: checkpoint.imagesBlocked,
      creativeJob: checkpoint.creativeJob,
      creativePipelineStep: "complete",
      generationCost: checkpoint.generationCost,
      source: "creative-director",
    };
  }

  let job = checkpoint?.creativeJob ?? createCreativeJob("social-ad", "Social Campaign");
  if (!checkpoint?.creativeJob) {
    job = updateJobStage(job, "brand_dna", "complete", "AdvisorPilot Brand DNA loaded");
    job = { ...job, brandDna: getBrandDNA() };
  }

  const state: CreativePipelineCheckpoint = {
    step: resumeStep,
    ...checkpoint,
    creativeJob: job,
  };

  try {
    let originalBrief = state.originalBrief;
    let reviewedBrief = state.creativeBrief;
    let review = state.creativeReview;
    let strategyBrief = state.creativeBrief;
    let strategyApproved = state.strategyApproved;
    let strategyHistory = state.strategyReviewHistory;
    let finalStrategyRationale = state.finalStrategyRationale;
    let variations = state.conceptVariations;
    let visualDiversityReport = state.visualDiversityReport;
    let selectedConcept = state.selectedConcept;
    let selectionRationale = state.selectionRationale;
    let gateHistory = state.variationGateHistory;
    const gateResultApproved = gateHistory?.at(-1)?.result.approved;
    let productionApproved =
      Boolean(state.selectedConcept) &&
      (gateResultApproved ?? state.imagesBlocked === false);
    let winner = state.selectedConcept;
    let adaptedImages = state.adaptedImages ?? {};
    let masterImageUrl = state.masterImageUrl;
    let imagesBlocked = state.imagesBlocked;
    let generationCost = state.generationCost ?? emptyCostReport();

    if (!isStepComplete(resumeStep, "exploration") && !explorationAlreadyComplete(state)) {
      onProgress?.("Phase 1 — strategic exploration (brief, critique, concepts, scoring)…");
      const explorationResult = await runCreativeStep<{
        brief: CreativeBrief;
        originalBrief: CreativeBrief;
        review: CreativeReviewResult;
        strategyApproved: boolean;
        strategyReviewHistory: StrategyReviewAttempt[];
        finalStrategyRationale?: string;
        variations: ConceptVariation[];
        selectedConcept: ConceptVariation;
        selectionRationale?: string;
        visualDiversityReport?: import("../creative/types").VisualDiversityReport;
        variationGateHistory: VariationGateAttempt[];
        productionApproved: boolean;
      }>("exploration", {
        input: {
          contentPillarId: input.contentPillarId,
          assetType: "social-ad",
          platforms: input.platforms,
          generateConceptImages: input.generateConceptImages,
        },
      });

      generationCost = accumulateCost(generationCost, explorationResult.costDelta);
      originalBrief = explorationResult.originalBrief;
      reviewedBrief = explorationResult.brief;
      strategyBrief = explorationResult.brief;
      review = explorationResult.review;
      strategyApproved = explorationResult.strategyApproved;
      strategyHistory = explorationResult.strategyReviewHistory;
      finalStrategyRationale = explorationResult.finalStrategyRationale;
      variations = explorationResult.variations;
      visualDiversityReport = explorationResult.visualDiversityReport;
      selectedConcept = explorationResult.selectedConcept;
      selectionRationale = explorationResult.selectionRationale;
      winner = selectedConcept;
      gateHistory = explorationResult.variationGateHistory;
      productionApproved = explorationResult.productionApproved;
      imagesBlocked = !productionApproved;

      job = attachExplorationToJob(
        job,
        explorationResult.brief,
        explorationResult.review,
        explorationResult.strategyApproved,
        explorationResult.strategyReviewHistory,
        explorationResult.finalStrategyRationale,
        explorationResult.variations,
        explorationResult.selectedConcept,
        explorationResult.selectionRationale ?? "",
        explorationResult.variationGateHistory,
        productionApproved
      );

      state.step = productionApproved ? "images" : "complete";
      state.originalBrief = originalBrief;
      state.creativeBrief = reviewedBrief;
      state.creativeReview = review;
      state.strategyApproved = strategyApproved;
      state.strategyReviewHistory = strategyHistory;
      state.finalStrategyRationale = finalStrategyRationale;
      state.conceptVariations = variations;
      state.visualDiversityReport = visualDiversityReport;
      state.selectedConcept = winner;
      state.selectionRationale = selectionRationale;
      state.variationGateHistory = gateHistory;
      state.imagesBlocked = imagesBlocked;
      state.creativeJob = job;
      state.generationCost = generationCost;
      saveCheckpoint(state, onCheckpoint);

      const tokens = explorationResult.costDelta?.totalTokens ?? 0;
      console.info(`[creative] exploration complete — 1 call, ${tokens} tokens`);

      if (!productionApproved) {
        onProgress?.("Strategic exploration did not approve production. Images blocked.");
        return {
          ads: buildAdsFromBrief(input.contentPillarId, input.platforms, winner!.brief, {}),
          creativeBrief: strategyBrief,
          originalBrief,
          creativeReview: review,
          strategyApproved: strategyApproved ?? false,
          strategyReviewHistory: strategyHistory,
          finalStrategyRationale,
          conceptVariations: variations,
          variationGateHistory: gateHistory,
          selectedConcept: winner,
          imagesBlocked: true,
          creativeJob: job,
          creativePipelineStep: "complete",
          generationCost,
          source: "creative-director",
        };
      }
    }

    if (
      !isStepComplete(resumeStep, "premium_revision") &&
      getOpenAIConfig().premiumRevisionEnabled &&
      winner &&
      (winner.score < 70 || !productionApproved)
    ) {
      onProgress?.("Optional premium revision (gpt-5.5)…");
      const revisionResult = await runCreativeStep<{ brief: CreativeBrief }>("premium_revision", {
        brief: winner.brief,
        critique: review?.directorNotes ?? review?.critique ?? "",
      });
      generationCost = accumulateCost(generationCost, revisionResult.costDelta);
      winner = { ...winner, brief: revisionResult.brief };
      state.step = "images";
      state.selectedConcept = winner;
      state.generationCost = generationCost;
      saveCheckpoint(state, onCheckpoint);
    }

    if (!isStepComplete(resumeStep, "images")) {
      if (!winner) throw new Error("Missing selected concept for image generation");

      const hasExistingImages =
        state.adaptedImages && Object.keys(state.adaptedImages).length > 0;

      if (hasExistingImages) {
        adaptedImages = state.adaptedImages!;
        masterImageUrl = state.masterImageUrl;
        imagesBlocked = state.imagesBlocked ?? false;
        onProgress?.("Using generated creative assets from checkpoint…");
      } else {
        try {
          onProgress?.("Phase 3 — generating single master image for winning concept…");
          const imageResult = await runCreativeStep<{
            masterImageUrl: string;
            adaptedImages: Partial<Record<AspectRatio, string>>;
          }>("images", {
            brief: winner.brief,
            platforms: input.platforms,
            strategyApproved: productionApproved,
            productionApproved,
            generateConceptImages: input.generateConceptImages,
            variations,
          });

          generationCost = accumulateCost(generationCost, imageResult.costDelta);
          masterImageUrl = imageResult.masterImageUrl;
          imagesBlocked = false;

          job = attachImagesToJob(job, masterImageUrl, {
            master: buildMasterImagePrompt(winner.brief),
          });

          adaptedImages = await applyLayoutAdaptation(
            masterImageUrl,
            input.platforms,
            onProgress
          );

          job = attachLayoutAdaptationToJob(job, adaptedImages);
        } catch (err) {
          const reason =
            err instanceof Error ? err.message : "Image generation failed";
          onProgress?.(`Image generation failed (${reason}). Template renderer will be used.`);
          job = blockImagesOnJob(job, reason);
          imagesBlocked = true;
        }
      }

      const imagesSucceeded = !imagesBlocked && Boolean(masterImageUrl);
      state.step = imagesSucceeded ? "complete" : "images";
      state.adaptedImages = adaptedImages;
      state.masterImageUrl = masterImageUrl;
      state.imagesBlocked = imagesBlocked;
      state.creativeJob = job;
      state.generationCost = generationCost;
      saveCheckpoint(state, onCheckpoint);
    } else if (resumeStep === "complete" && winner) {
      adaptedImages = state.adaptedImages ?? {};
      masterImageUrl = state.masterImageUrl;
      imagesBlocked = state.imagesBlocked;
    }

    if (!winner) throw new Error("Creative pipeline completed without a selected concept");

    const hasCreativeAssets = Boolean(masterImageUrl || Object.keys(adaptedImages).length > 0);
    job = hasCreativeAssets && !imagesBlocked
      ? completeJob(job)
      : setJobStatus(job, "packaging");
    onProgress?.("Finalizing ad variants…");

    const ads = buildAdsFromBrief(input.contentPillarId, input.platforms, winner.brief, adaptedImages);
    const finalCost = applyApprovedAssetCost(generationCost, ads.length);

    return {
      ads,
      creativeBrief: strategyBrief ?? winner.brief,
      originalBrief,
      creativeReview: review,
      strategyApproved: strategyApproved ?? true,
      strategyReviewHistory: strategyHistory,
      finalStrategyRationale,
      conceptVariations: variations,
      visualDiversityReport,
      variationGateHistory: gateHistory,
      selectedConcept: winner,
      masterImageUrl,
      adaptedImages,
      imagesBlocked,
      creativeJob: job,
      creativePipelineStep: imagesBlocked && !hasCreativeAssets ? "images" : "complete",
      generationCost: finalCost,
      source: "creative-director",
    };
  } catch (error) {
    saveCheckpoint(state, onCheckpoint);
    onProgress?.("Creative Director unavailable, using template fallback…");
    console.error("Creative pipeline error:", error);
    return { ads: generateAdsFromTemplates(input), source: "template" };
  }
}

export { getAdDimensions } from "./creative-rules";
