import type { CampaignRun, CampaignStatus, PipelinePhase } from "@/lib/types";

const STATUS_RANK: Record<CampaignStatus, number> = {
  draft: 0,
  running: 1,
  approved: 2,
  posted: 3,
  failed: 1,
};

const PHASE_RANK: Record<PipelinePhase, number> = {
  generating: 0,
  legal_review: 1,
  fixing: 2,
  approved: 3,
  packaging: 4,
  ready_to_post: 5,
  posted: 6,
  failed: 0,
};

function adProgressScore(campaign: CampaignRun): number {
  if (campaign.ads.length === 0) return 0;
  const withCopy = campaign.ads.filter((ad) => ad.headline?.trim()).length;
  const withRender = campaign.ads.filter(
    (ad) => Boolean(ad.imageDataUrl || ad.renderedLayoutVersion)
  ).length;
  return campaign.ads.length * 10 + withCopy * 5 + withRender;
}

function pickRicherAds(local: CampaignRun, remote: CampaignRun) {
  if (adProgressScore(local) > adProgressScore(remote)) {
    if (remote.ads.length === 0) return local.ads;
    return local.ads.map((ad) => {
      const remoteAd = remote.ads.find((r) => r.id === ad.id);
      if (!remoteAd) return ad;
      return {
        ...ad,
        imageDataUrl: ad.imageDataUrl || remoteAd.imageDataUrl,
        creativeAssetUrl: ad.creativeAssetUrl || remoteAd.creativeAssetUrl,
        renderedLayoutVersion: ad.renderedLayoutVersion ?? remoteAd.renderedLayoutVersion,
      };
    });
  }

  if (adProgressScore(remote) > adProgressScore(local)) {
    if (local.ads.length === 0) return remote.ads;
    return remote.ads.map((ad) => {
      const localAd = local.ads.find((l) => l.id === ad.id);
      if (!localAd) return ad;
      return {
        ...ad,
        imageDataUrl: ad.imageDataUrl || localAd.imageDataUrl,
        creativeAssetUrl: ad.creativeAssetUrl || localAd.creativeAssetUrl,
        renderedLayoutVersion: ad.renderedLayoutVersion ?? localAd.renderedLayoutVersion,
      };
    });
  }

  // Tie: prefer whichever still has inline image payloads.
  const localInline = local.ads.filter((ad) => ad.imageDataUrl).length;
  const remoteInline = remote.ads.filter((ad) => ad.imageDataUrl).length;
  return localInline >= remoteInline ? local.ads : remote.ads;
}

/**
 * Merge a server campaign into local state without letting a stale remote
 * snapshot wipe fresher ads / completion status from an in-flight pipeline.
 */
export function mergeRemoteCampaign(local: CampaignRun, remote: CampaignRun): CampaignRun {
  const preferLocalStatus = STATUS_RANK[local.status] > STATUS_RANK[remote.status];
  const preferLocalPhase = PHASE_RANK[local.phase] > PHASE_RANK[remote.phase];
  const preferLocalCompleted = Boolean(local.completedAt) && !remote.completedAt;

  return {
    ...remote,
    ads: pickRicherAds(local, remote),
    status: preferLocalStatus ? local.status : remote.status,
    phase: preferLocalPhase ? local.phase : remote.phase,
    completedAt: preferLocalCompleted ? local.completedAt : remote.completedAt ?? local.completedAt,
    progressMessage:
      preferLocalPhase || preferLocalStatus
        ? local.progressMessage ?? remote.progressMessage
        : remote.progressMessage ?? local.progressMessage,
    masterImageUrl: local.masterImageUrl || remote.masterImageUrl,
    adaptedImages: local.adaptedImages ?? remote.adaptedImages,
    // Keep richer local creative checkpoint if remote is behind on ads/phase.
    creativePipelineStep:
      preferLocalPhase || adProgressScore(local) > adProgressScore(remote)
        ? local.creativePipelineStep ?? remote.creativePipelineStep
        : remote.creativePipelineStep ?? local.creativePipelineStep,
    creativeBrief: remote.creativeBrief ?? local.creativeBrief,
    originalBrief: remote.originalBrief ?? local.originalBrief,
    selectedConcept: remote.selectedConcept ?? local.selectedConcept,
    creativeJob: remote.creativeJob ?? local.creativeJob,
    captionsByPlatform: remote.captionsByPlatform ?? local.captionsByPlatform,
    hashtagsByPlatform: remote.hashtagsByPlatform ?? local.hashtagsByPlatform,
    caption: remote.caption ?? local.caption,
    hashtags: remote.hashtags?.length ? remote.hashtags : local.hashtags,
    generationCost: remote.generationCost ?? local.generationCost,
    legalReviewId: remote.legalReviewId ?? local.legalReviewId,
    fixHistory: remote.fixHistory?.length ? remote.fixHistory : local.fixHistory,
    iteration: Math.max(local.iteration ?? 0, remote.iteration ?? 0),
  };
}
