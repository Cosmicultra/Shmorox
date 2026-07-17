import { generateId } from "./utils";
import { runAIReview } from "./review-engine";
import { buildDemoUrl, ADVISORPILOT_KNOWLEDGE } from "./knowledge/advisorpilot";
import { sanitizeNoEmDash } from "./ad/content-guardrails";
import { generateAds } from "./ad/generator";
import { campaignPatchFromCheckpoint, checkpointFromCampaign, needsCreativeResume } from "./creative/checkpoint";
import { fixAdCopy, buildClaimsText } from "./ad/creative-fixer";
import { lintAdBatch } from "./ad/ad-layout-linter";
import { renderAllAds, renderAdsForPipeline, invalidateAdRenderCache } from "./ad/image-renderer";
import { getHashtagsForPlatforms } from "./ad/hashtags";
import { generateCaptionsForPlatforms } from "./ad/caption-generator";
import type {
  CampaignRun,
  GeneratedAd,
  ReviewResult,
  ReviewSubmission,
  SocialPlatform,
  FixIteration,
} from "./types";
import { beginPipeline, endPipeline, touchPipeline, forceEndPipeline } from "./pipeline-state";
import { unlockPipelineInSession } from "./pipeline-lock";
import {
  applyApprovedAssetCost,
  mergeCostDeltas,
  type GenerationCostReport,
} from "./openai/cost-tracker";

export { isPipelineActive } from "./pipeline-state";
export { getFullPostForPlatform, exportPackageFilename } from "./post-package";

const MAX_FIX_ITERATIONS = 3;

function markPipelineFailed(callbacks: PipelineCallbacks): void {
  callbacks.onProgress("Max fix iterations reached — flagged for human review.", "failed");
  callbacks.onCampaignUpdate({
    phase: "failed",
    status: "failed",
    progressMessage: "Legal review did not pass after 3 fix attempts. Human review required.",
  });
}

export interface PipelineCallbacks {
  onProgress: (message: string, phase: CampaignRun["phase"]) => void;
  onCampaignUpdate: (patch: Partial<CampaignRun>) => void;
  addReview: (review: ReviewSubmission) => void;
  setResult: (id: string, result: ReviewResult) => void;
  updateReview: (id: string, patch: Partial<ReviewSubmission>) => void;
  getResult: (id: string) => ReviewResult | undefined;
}

export interface PipelineInput {
  contentPillarId: string;
  platforms: SocialPlatform[];
  generateConceptImages?: boolean;
  layoutStyle?: import("./ad/ad-template-registry").AdLayoutStyle;
  canvasStyle?: import("./ad/ad-template-registry").CanvasStyle;
}

async function runLegalReview(
  campaign: CampaignRun,
  ads: GeneratedAd[],
  callbacks: PipelineCallbacks
): Promise<{ passed: boolean; reviewId: string; result: ReviewResult }> {
  const claimsText = ads.map((ad) => buildClaimsText(ad)).join(" ");

  const reviewId = generateId();
  const submission: ReviewSubmission = {
    id: reviewId,
    title: sanitizeNoEmDash(`${ADVISORPILOT_KNOWLEDGE.brandMark} Campaign, ${campaign.contentPillar}`),
    brand: ADVISORPILOT_KNOWLEDGE.brandMark,
    market: "United States",
    assetType: "social-campaign",
    files: [],
    claimsDescription: claimsText,
    targetAudience: "Independent RIAs, lead advisors, analysts",
    launchDate: new Date().toISOString().split("T")[0],
    notes: `Auto-generated campaign review. Iteration ${campaign.iteration}.`,
    status: "analyzing",
    createdAt: new Date().toISOString(),
  };

  callbacks.addReview(submission);
  callbacks.onCampaignUpdate({ legalReviewId: reviewId });

  const result = await runAIReview(submission, (step) => {
    callbacks.onProgress(step, "legal_review");
  });

  callbacks.setResult(reviewId, result);
  callbacks.updateReview(reviewId, {
    status: "complete",
    completedAt: new Date().toISOString(),
  });

  return { passed: result.overallRisk === "clear", reviewId, result };
}

async function runLegalFixLoop(
  campaignId: string,
  input: PipelineInput,
  ads: GeneratedAd[],
  startIteration: number,
  fixHistory: FixIteration[],
  callbacks: PipelineCallbacks,
  qrUrl?: string,
  options?: { resumeFromFixing?: boolean; pendingFindings?: FixIteration["findings"] }
): Promise<{ ads: GeneratedAd[]; legalPassed: boolean; iteration: number; fixHistory: FixIteration[] }> {
  let iteration = startIteration;
  let legalPassed = false;
  let currentAds = ads;
  const history = [...fixHistory];
  let skipReview = options?.resumeFromFixing ?? false;
  let pendingFindings = options?.pendingFindings;

  if (startIteration >= MAX_FIX_ITERATIONS) {
    markPipelineFailed(callbacks);
    return { ads: currentAds, legalPassed: false, iteration: startIteration, fixHistory: history };
  }

  while (!legalPassed && iteration < MAX_FIX_ITERATIONS) {
    if (!skipReview) {
      iteration++;
      callbacks.onCampaignUpdate({ iteration });

      callbacks.onProgress(
        iteration === 1 ? "Running legal compliance review…" : `Re-checking after fix (attempt ${iteration})…`,
        "legal_review"
      );

      const { passed, result } = await runLegalReview(
        { id: campaignId, contentPillar: input.contentPillarId, iteration } as CampaignRun,
        currentAds,
        callbacks
      );

      if (passed) {
        legalPassed = true;
        callbacks.onProgress("Legal review passed!", "approved");
        callbacks.onCampaignUpdate({ phase: "approved" });
        break;
      }

      if (iteration >= MAX_FIX_ITERATIONS) {
        markPipelineFailed(callbacks);
        break;
      }

      pendingFindings = result.findings;
    } else {
      skipReview = false;
    }

    if (!pendingFindings?.length) break;

    callbacks.onProgress("Creative team fixing flagged issues…", "fixing");
    callbacks.onCampaignUpdate({ phase: "fixing" });

    const fixedAds: GeneratedAd[] = [];

    for (const ad of currentAds) {
      const before = { headline: ad.headline, subhead: ad.subhead, cta: ad.cta, disclaimer: ad.disclaimer };
      const fixed = fixAdCopy(before, pendingFindings);

      history.push({
        iteration,
        findings: pendingFindings,
        headlineBefore: before.headline,
        headlineAfter: fixed.headline,
        subheadBefore: before.subhead,
        subheadAfter: fixed.subhead,
      });

      fixedAds.push({ ...ad, ...fixed, imageDataUrl: undefined, renderedLayoutVersion: undefined });
    }

    await invalidateAdRenderCache(
      campaignId,
      fixedAds.map((ad) => ad.id)
    );
    currentAds = await renderAllAds(fixedAds, true, qrUrl ?? buildDemoUrl("social", campaignId), {
      campaignId,
      force: true,
    });
    callbacks.onCampaignUpdate({ ads: currentAds, fixHistory: history });
  }

  return { ads: currentAds, legalPassed, iteration, fixHistory: history };
}

async function runPackagingPhase(
  campaignId: string,
  input: PipelineInput,
  ads: GeneratedAd[],
  iteration: number,
  fixHistory: FixIteration[],
  qrUrl: string,
  callbacks: PipelineCallbacks,
  generationCost?: GenerationCostReport
): Promise<{
  ads: GeneratedAd[];
  hashtagsByPlatform: ReturnType<typeof getHashtagsForPlatforms>;
  captionsByPlatform: Record<SocialPlatform, string>;
  generationCost?: GenerationCostReport;
}> {
  callbacks.onProgress("Generating captions and hashtags…", "packaging");
  callbacks.onCampaignUpdate({ phase: "packaging" });

  const hashtagsByPlatform = getHashtagsForPlatforms(input.platforms);
  const captionResult = await generateCaptionsForPlatforms(
    input.contentPillarId,
    input.platforms,
    qrUrl
  );
  const captionsByPlatform = captionResult.captions;
  const mergedCost = captionResult.costDelta
    ? applyApprovedAssetCost(
        mergeCostDeltas(
          {
            textCalls: generationCost?.textCalls ?? 0,
            imageGenerations: generationCost?.imageGenerations ?? 0,
          },
          captionResult.costDelta
        ),
        ads.length
      )
    : generationCost
      ? applyApprovedAssetCost(generationCost, ads.length)
      : undefined;

  const allHashtags = [...new Set(Object.values(hashtagsByPlatform).flat())];

  const lintResult = lintAdBatch(ads);
  if (!lintResult.passed) {
    const hardIssues = lintResult.issues.filter((i) => i.severity === "error");
    callbacks.onProgress(
      `Layout QA: ${hardIssues.length} issue(s) before export — proceeding with warnings logged.`,
      "packaging"
    );
    console.warn("[ad-layout-linter]", lintResult.issues);
  }

  callbacks.onProgress("Adding QR codes to ad cards…", "packaging");
  const packagedAds =
    ads.length > 0 && ads.every((ad) => ad.imageDataUrl)
      ? ads
      : await renderAdsForPipeline(ads, true, qrUrl, { campaignId });

  callbacks.onProgress("Campaign package ready for posting!", "ready_to_post");
  callbacks.onCampaignUpdate({
    phase: "ready_to_post",
    status: "approved",
    ads: packagedAds,
    hashtags: allHashtags,
    hashtagsByPlatform,
    captionsByPlatform,
    caption: captionsByPlatform[input.platforms[0]],
    fixHistory,
    completedAt: new Date().toISOString(),
    generationCost: mergedCost,
  });

  return { ads: packagedAds, hashtagsByPlatform, captionsByPlatform, generationCost: mergedCost };
}

export async function runCampaignPipeline(
  campaignId: string,
  input: PipelineInput,
  callbacks: PipelineCallbacks
): Promise<CampaignRun> {
  if (!beginPipeline(campaignId)) {
    return {
      id: campaignId,
      brand: "AdvisorPilot",
      contentPillar: input.contentPillarId,
      platforms: input.platforms,
      phase: "generating",
      status: "running",
      ads: [],
      iteration: 0,
      fixHistory: [],
      hashtags: [],
      qrUrl: buildDemoUrl("social", campaignId),
      createdAt: new Date().toISOString(),
    };
  }

  try {
  const qrUrl = buildDemoUrl("social", campaignId);
  const fixHistory: FixIteration[] = [];

  callbacks.onProgress("Starting campaign generation…", "generating");
  callbacks.onCampaignUpdate({ status: "running", phase: "generating", qrUrl });
  touchPipeline(campaignId);

  const creativeResult = await generateAds({
    input: {
      contentPillarId: input.contentPillarId,
      platforms: input.platforms,
      generateConceptImages: input.generateConceptImages,
      layoutStyle: input.layoutStyle,
      canvasStyle: input.canvasStyle,
    },
    onProgress: (step) => {
      touchPipeline(campaignId);
      callbacks.onProgress(step, "generating");
    },
    onCheckpoint: (checkpoint) => {
      touchPipeline(campaignId);
      callbacks.onCampaignUpdate(campaignPatchFromCheckpoint(checkpoint));
    },
  });

  let ads = creativeResult.ads;

  callbacks.onCampaignUpdate({
    creativeBrief: creativeResult.creativeBrief,
    originalBrief: creativeResult.originalBrief,
    creativeReview: creativeResult.creativeReview,
    strategyApproved: creativeResult.strategyApproved,
    strategyReviewHistory: creativeResult.strategyReviewHistory,
    finalStrategyRationale: creativeResult.finalStrategyRationale,
    conceptVariations: creativeResult.conceptVariations,
    visualDiversityReport: creativeResult.visualDiversityReport,
    variationGateHistory: creativeResult.variationGateHistory,
    selectedConcept: creativeResult.selectedConcept,
    creativeJob: creativeResult.creativeJob,
    masterImageUrl: creativeResult.masterImageUrl,
    adaptedImages: creativeResult.adaptedImages,
    imagesBlocked: creativeResult.imagesBlocked,
    creativePipelineStep: creativeResult.creativePipelineStep ?? "complete",
    generationCost: creativeResult.generationCost,
    pipelineFallbackReason:
      creativeResult.source === "template" ? creativeResult.fallbackReason : undefined,
  });

  const needsTemplateRender = ads.some((ad) => !ad.imageDataUrl);
  callbacks.onProgress("Rendering ad card visuals from template…", "generating");
  ads = await renderAllAds(ads, true, qrUrl, { campaignId });

  callbacks.onCampaignUpdate({ ads });

  const { ads: reviewedAds, legalPassed, iteration, fixHistory: history } = await runLegalFixLoop(
    campaignId,
    input,
    ads,
    0,
    fixHistory,
    callbacks,
    qrUrl
  );

  if (!legalPassed) {
    return {
      id: campaignId,
      brand: "AdvisorPilot",
      contentPillar: input.contentPillarId,
      platforms: input.platforms,
      phase: "failed",
      status: "failed",
      ads: reviewedAds,
      iteration,
      fixHistory: history,
      hashtags: [],
      qrUrl,
      createdAt: new Date().toISOString(),
    };
  }

  const { ads: packagedAds, hashtagsByPlatform, captionsByPlatform, generationCost: finalCost } =
    await runPackagingPhase(
    campaignId,
    input,
    reviewedAds,
    iteration,
    history,
    qrUrl,
    callbacks,
    creativeResult.generationCost
  );

  return {
    id: campaignId,
    brand: "AdvisorPilot",
    contentPillar: input.contentPillarId,
    platforms: input.platforms,
    phase: "ready_to_post",
    status: "approved",
    ads: packagedAds,
    iteration,
    fixHistory: history,
    hashtags: [...new Set(Object.values(hashtagsByPlatform).flat())],
    hashtagsByPlatform,
    captionsByPlatform,
    caption: captionsByPlatform[input.platforms[0]],
    qrUrl,
    generationCost: finalCost,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  } finally {
    endPipeline(campaignId);
    unlockPipelineInSession(campaignId);
  }
}

/** Continue an interrupted pipeline after reload or navigation. */
export async function resumeCampaignPipeline(
  campaign: CampaignRun,
  callbacks: PipelineCallbacks
): Promise<void> {
  if (!beginPipeline(campaign.id)) {
    if (needsCreativeResume(campaign)) {
      forceEndPipeline(campaign.id);
      if (!beginPipeline(campaign.id)) return;
    } else {
      return;
    }
  }

  try {
  const input: PipelineInput = {
    contentPillarId: campaign.contentPillar,
    platforms: campaign.platforms,
    generateConceptImages: campaign.generateConceptImages,
    layoutStyle: campaign.layoutStyle,
    canvasStyle: campaign.canvasStyle,
  };
  const qrUrl = campaign.qrUrl || buildDemoUrl("social", campaign.id);
  let ads = campaign.ads;
  let iteration = campaign.iteration ?? 0;
  const fixHistory = campaign.fixHistory ?? [];

  callbacks.onCampaignUpdate({ status: "running", qrUrl });

  if (campaign.phase === "packaging" || campaign.phase === "approved") {
    await runPackagingPhase(
      campaign.id,
      input,
      ads,
      iteration,
      fixHistory,
      qrUrl,
      callbacks,
      campaign.generationCost
    );
    return;
  }

  if (
    iteration >= MAX_FIX_ITERATIONS &&
    ["generating", "legal_review", "fixing"].includes(campaign.phase)
  ) {
    markPipelineFailed(callbacks);
    return;
  }

  if (campaign.phase === "generating" && needsCreativeResume(campaign)) {
    const needsImageRetry =
      campaign.imagesBlocked &&
      Boolean(campaign.selectedConcept) &&
      (!campaign.adaptedImages || Object.keys(campaign.adaptedImages).length === 0);

    callbacks.onProgress(
      needsImageRetry ? "Retrying image generation…" : "Resuming Creative Director pipeline…",
      "generating"
    );
    touchPipeline(campaign.id);
    const creativeResult = await generateAds({
      input,
      checkpoint: checkpointFromCampaign(campaign),
      onProgress: (step) => {
        touchPipeline(campaign.id);
        callbacks.onProgress(step, "generating");
      },
      onCheckpoint: (checkpoint) => {
        touchPipeline(campaign.id);
        callbacks.onCampaignUpdate(campaignPatchFromCheckpoint(checkpoint));
      },
    });

    ads = creativeResult.ads;
    callbacks.onCampaignUpdate({
      creativeBrief: creativeResult.creativeBrief,
      originalBrief: creativeResult.originalBrief,
      creativeReview: creativeResult.creativeReview,
      strategyApproved: creativeResult.strategyApproved,
      strategyReviewHistory: creativeResult.strategyReviewHistory,
      finalStrategyRationale: creativeResult.finalStrategyRationale,
      conceptVariations: creativeResult.conceptVariations,
      visualDiversityReport: creativeResult.visualDiversityReport,
      variationGateHistory: creativeResult.variationGateHistory,
      selectedConcept: creativeResult.selectedConcept,
      creativeJob: creativeResult.creativeJob,
      masterImageUrl: creativeResult.masterImageUrl,
      adaptedImages: creativeResult.adaptedImages,
      imagesBlocked: creativeResult.imagesBlocked,
      creativePipelineStep: creativeResult.creativePipelineStep ?? "complete",
      generationCost: creativeResult.generationCost,
      ads,
    });

    callbacks.onProgress("Rendering ad card visuals from template…", "generating");
    ads = await renderAllAds(ads, true, qrUrl, { campaignId: campaign.id });
    callbacks.onCampaignUpdate({ ads });
  }

  if (campaign.phase === "generating" && ads.length > 0) {
    const needsRerender = ads.some((ad) => !ad.imageDataUrl);
    if (needsRerender) {
      callbacks.onProgress("Resuming ad rendering…", "generating");
      ads = await renderAllAds(ads, true, qrUrl, { campaignId: campaign.id });
      callbacks.onCampaignUpdate({ ads });
    }
  }

  if (["generating", "legal_review", "fixing"].includes(campaign.phase) && ads.length > 0) {
    const resumeFromFixing = campaign.phase === "fixing" && Boolean(campaign.legalReviewId);
    const pendingFindings =
      resumeFromFixing && campaign.legalReviewId
        ? callbacks.getResult(campaign.legalReviewId)?.findings
        : undefined;

    const { ads: reviewedAds, legalPassed, iteration: finalIteration, fixHistory: history } =
      await runLegalFixLoop(
        campaign.id,
        input,
        ads,
        iteration,
        fixHistory,
        callbacks,
        qrUrl,
        resumeFromFixing && pendingFindings?.length
          ? { resumeFromFixing: true, pendingFindings }
          : undefined
      );

    if (!legalPassed) return;

    await runPackagingPhase(
      campaign.id,
      input,
      reviewedAds,
      finalIteration,
      history,
      qrUrl,
      callbacks,
      campaign.generationCost
    );
  }
  } finally {
    endPipeline(campaign.id);
    unlockPipelineInSession(campaign.id);
  }
}

