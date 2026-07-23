import type { CampaignRun } from "@/lib/types";

/** Backfill defaults for campaigns saved before schema changes. */
export function normalizeCampaign(raw: Partial<CampaignRun> & { id: string }): CampaignRun {
  const phase = raw.phase ?? "generating";
  const layoutStyle = raw.layoutStyle ?? "split-graphic";
  const canvasStyle = raw.canvasStyle ?? "gradient";
  const defaultStatus =
    phase === "ready_to_post" || phase === "posted"
      ? "approved"
      : phase === "failed"
        ? "failed"
        : ["generating", "legal_review", "fixing", "packaging", "approved"].includes(phase)
          ? "running"
          : "draft";

  return {
    id: raw.id,
    brand: "AdvisorPilot",
    contentPillar: raw.contentPillar ?? "prospect-workflow",
    platforms: raw.platforms ?? [],
    phase,
    status: raw.status ?? defaultStatus,
    ads: Array.isArray(raw.ads)
      ? raw.ads.map((ad) => {
          const adLayoutStyle = ad.layoutStyle ?? layoutStyle;
          return {
            ...ad,
            layoutStyle: adLayoutStyle,
            canvasStyle: ad.canvasStyle ?? canvasStyle,
            templateId:
              adLayoutStyle === "text-only" ? "text-focused" : ad.templateId,
          };
        })
      : [],
    legalReviewId: raw.legalReviewId,
    iteration: raw.iteration ?? 0,
    fixHistory: Array.isArray(raw.fixHistory) ? raw.fixHistory : [],
    caption: raw.caption,
    captionsByPlatform: raw.captionsByPlatform,
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    hashtagsByPlatform: raw.hashtagsByPlatform,
    qrUrl: raw.qrUrl ?? "",
    progressMessage: raw.progressMessage,
    creativeBrief: raw.creativeBrief,
    originalBrief: raw.originalBrief,
    creativeReview: raw.creativeReview,
    strategyApproved: raw.strategyApproved,
    strategyReviewHistory: raw.strategyReviewHistory,
    finalStrategyRationale: raw.finalStrategyRationale,
    conceptVariations: raw.conceptVariations,
    visualDiversityReport: raw.visualDiversityReport,
    variationGateHistory: raw.variationGateHistory,
    selectedConcept: raw.selectedConcept,
    creativeJob: raw.creativeJob,
    masterImageUrl: raw.masterImageUrl,
    imagesBlocked: raw.imagesBlocked,
    creativePipelineStep: raw.creativePipelineStep,
    adaptedImages: raw.adaptedImages,
    selectionRationale: raw.selectionRationale,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    completedAt: raw.completedAt,
    postedAt: raw.postedAt,
    postResults: raw.postResults,
    generateConceptImages: raw.generateConceptImages,
    layoutStyle,
    canvasStyle,
    customRequest: raw.customRequest,
    generationCost: raw.generationCost,
    pipelineFallbackReason: raw.pipelineFallbackReason,
  };
}
