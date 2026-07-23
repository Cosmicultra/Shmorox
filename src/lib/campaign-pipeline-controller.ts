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

export type PipelineControllerDeps = {
  getCampaign: (id: string) => CampaignRun | undefined;
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
      await runCampaignPipeline(
        campaignId,
        {
          contentPillarId: campaign.contentPillar,
          platforms: campaign.platforms,
          generateConceptImages: campaign.generateConceptImages,
          layoutStyle: campaign.layoutStyle,
          canvasStyle: campaign.canvasStyle,
          customRequest: campaign.customRequest,
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
      isLegalReviewPassed(campaign, deps.getResult) &&
      isPackagingComplete(campaign)
    ) {
      markCampaignPipelineSettled(campaign.id);
      deps.updateCampaign(campaign.id, {
        status: "approved",
        phase: "ready_to_post",
        progressMessage: "Campaign package ready for posting!",
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
