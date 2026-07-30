import { collectPriorCustomHeadlines } from "@/lib/creative/custom-headline-history";
import { isPersonalBrandCampaign } from "@/lib/knowledge/personal-brand";
import type { PersonalBrandCategoryId } from "@/lib/knowledge/personal-brand";
import { hasPendingInitialPipelineRun } from "@/lib/pipeline-launch";
import { lockPipelineInSession } from "@/lib/pipeline-lock";
import {
  campaignHasGeneratedAds,
  isCampaignPipelineSettled,
  isLegalReviewPassed,
  isPackagingComplete,
  markCampaignPipelineSettled,
  needsPackagingOnlyResume,
  shouldAutoStartFreshPipeline,
  shouldResumeCampaignPipeline,
} from "@/lib/pipeline-resume";
import { isPipelineActive } from "@/lib/pipeline-state";
import type { CampaignRun, ReviewResult, ReviewSubmission } from "@/lib/types";

function collectRecentPersonalBrandCategories(
  campaigns: CampaignRun[],
  excludeCampaignId: string
): PersonalBrandCategoryId[] {
  return campaigns
    .filter(
      (c) =>
        c.id !== excludeCampaignId &&
        isPersonalBrandCampaign(c.contentPillar, c.contentMode) &&
        c.personalBrandCategory
    )
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .map((c) => c.personalBrandCategory!)
    .slice(0, 8);
}

function collectRecentPersonalBrandTopics(
  campaigns: CampaignRun[],
  excludeCampaignId: string
): string[] {
  return campaigns
    .filter(
      (c) =>
        c.id !== excludeCampaignId &&
        isPersonalBrandCampaign(c.contentPillar, c.contentMode) &&
        (c.personalBrandTopic || c.customRequest)
    )
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .map((c) => c.personalBrandTopic || c.customRequest || "")
    .filter(Boolean)
    .slice(0, 10);
}

export type PipelineControllerDeps = {
  getCampaign: (id: string) => CampaignRun | undefined;
  getCampaigns: () => CampaignRun[];
  updateCampaign: (id: string, patch: Partial<CampaignRun>) => void;
  addReview: (review: ReviewSubmission) => void;
  setResult: (id: string, result: ReviewResult) => void;
  updateReview: (id: string, patch: Partial<ReviewSubmission>) => void;
  getResult: (id: string) => ReviewResult | undefined;
};

const startedIds = new Set<string>();

function buildCallbacks(campaignId: string, deps: PipelineControllerDeps) {
  return {
    onProgress: (message: string, phase: CampaignRun["phase"]) => {
      deps.updateCampaign(campaignId, { phase, progressMessage: message });
    },
    onCampaignUpdate: (patch: Partial<CampaignRun>) => {
      deps.updateCampaign(campaignId, patch);
    },
    addReview: deps.addReview,
    setResult: deps.setResult,
    updateReview: deps.updateReview,
    getResult: deps.getResult,
    getAvoidedHeadlines: (excludeCampaignId: string) =>
      collectPriorCustomHeadlines(deps.getCampaigns(), excludeCampaignId),
  };
}

function shouldContinueIncompleteCampaign(
  campaign: CampaignRun,
  getResult: PipelineControllerDeps["getResult"]
): boolean {
  if (isCampaignPipelineSettled(campaign.id)) return false;
  if (campaign.status !== "running") return false;
  if (campaign.completedAt || campaign.phase === "ready_to_post" || campaign.phase === "posted") {
    return false;
  }
  if (needsPackagingOnlyResume(campaign, getResult)) return true;
  if (["packaging", "approved"].includes(campaign.phase) && !isPackagingComplete(campaign)) {
    return true;
  }
  return false;
}

/** Start or resume a campaign pipeline in the background (survives route changes). */
export async function ensureCampaignPipeline(
  campaignId: string,
  deps: PipelineControllerDeps
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (startedIds.has(campaignId) || isPipelineActive(campaignId)) return false;

  const campaign = deps.getCampaign(campaignId);
  if (!campaign) return false;

  const pendingLaunch = hasPendingInitialPipelineRun(campaignId);
  const shouldResume = shouldResumeCampaignPipeline(campaign, deps.getResult);
  const shouldAutoStart = shouldAutoStartFreshPipeline(campaign);
  const shouldContinue = shouldContinueIncompleteCampaign(campaign, deps.getResult);

  if (!pendingLaunch && !shouldResume && !shouldAutoStart && !shouldContinue) return false;

  startedIds.add(campaignId);
  lockPipelineInSession(campaignId);

  try {
    const { runCampaignPipeline, resumeCampaignPipeline } = await import("@/lib/pipeline");
    const callbacks = buildCallbacks(campaignId, deps);

    if (pendingLaunch || shouldAutoStart) {
      const allCampaigns = deps.getCampaigns();
      await runCampaignPipeline(
        campaignId,
        {
          contentPillarId: campaign.contentPillar,
          platforms: campaign.platforms,
          generateConceptImages: campaign.generateConceptImages,
          layoutStyle: campaign.layoutStyle,
          canvasStyle: campaign.canvasStyle,
          customRequest: campaign.customRequest,
          avoidedHeadlines:
            campaign.contentPillar === "custom-request"
              ? collectPriorCustomHeadlines(allCampaigns, campaignId)
              : undefined,
          contentMode: campaign.contentMode,
          personalBrandCategory: campaign.personalBrandCategory,
          storyAnswers: campaign.storyAnswers,
          recentPersonalBrandCategories: isPersonalBrandCampaign(
            campaign.contentPillar,
            campaign.contentMode
          )
            ? collectRecentPersonalBrandCategories(allCampaigns, campaignId)
            : undefined,
          avoidedPersonalBrandTopics: isPersonalBrandCampaign(
            campaign.contentPillar,
            campaign.contentMode
          )
            ? collectRecentPersonalBrandTopics(allCampaigns, campaignId)
            : undefined,
        },
        callbacks
      );
    } else {
      await resumeCampaignPipeline(campaign, callbacks);
    }

    return true;
  } catch (err) {
    console.error("Background campaign pipeline failed:", err);
    deps.updateCampaign(campaignId, {
      status: "failed",
      phase: "failed",
      progressMessage:
        err instanceof Error ? err.message : "Campaign pipeline failed unexpectedly.",
    });
    return false;
  } finally {
    startedIds.delete(campaignId);
  }
}

/** Scan loaded campaigns for launch/resume work and stuck "running" status. */
export function syncBackgroundPipelines(
  campaigns: CampaignRun[],
  deps: PipelineControllerDeps
): void {
  for (const campaign of campaigns) {
    void ensureCampaignPipeline(campaign.id, deps);

    if (campaign.status !== "running") continue;
    if (isPipelineActive(campaign.id) || startedIds.has(campaign.id)) continue;

    if (
      isPackagingComplete(campaign) &&
      (isPersonalBrandCampaign(campaign.contentPillar, campaign.contentMode) ||
        isLegalReviewPassed(campaign, deps.getResult))
    ) {
      markCampaignPipelineSettled(campaign.id);
      deps.updateCampaign(campaign.id, {
        status: "approved",
        phase: "ready_to_post",
        progressMessage: isPersonalBrandCampaign(
          campaign.contentPillar,
          campaign.contentMode
        )
          ? "Personal brand post ready to publish!"
          : "Campaign package ready for posting!",
      });
      continue;
    }

    if (campaignHasGeneratedAds(campaign) && isPackagingComplete(campaign)) {
      markCampaignPipelineSettled(campaign.id);
      deps.updateCampaign(campaign.id, {
        status: "approved",
        progressMessage: campaign.progressMessage ?? "Generation complete.",
      });
    }
  }
}

export function isCampaignPipelineControllerActive(campaignId: string): boolean {
  return startedIds.has(campaignId) || isPipelineActive(campaignId);
}
