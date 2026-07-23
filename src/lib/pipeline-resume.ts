import { needsCreativeResume } from "./creative/checkpoint";
import type { CampaignRun, ReviewResult } from "./types";

type GetResult = (id: string) => ReviewResult | undefined;

const SETTLED_KEY_PREFIX = "shmorox:campaign-settled:";

export function markCampaignPipelineSettled(campaignId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${SETTLED_KEY_PREFIX}${campaignId}`, "1");
}

export function isCampaignPipelineSettled(campaignId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(`${SETTLED_KEY_PREFIX}${campaignId}`) === "1";
}

/** Campaign already produced ads — never auto-run pipeline again on revisit. */
export function campaignHasGeneratedAds(campaign: CampaignRun): boolean {
  if (campaign.ads.length === 0) return false;
  if (adCardsAreGenerated(campaign)) return true;
  return campaign.ads.every(
    (ad) => Boolean(ad.headline?.trim()) && Boolean(ad.platform)
  );
}

/** Ad cards were rendered at least once (images may live in cache/storage only). */
export function adCardsAreGenerated(campaign: CampaignRun): boolean {
  return (
    campaign.ads.length > 0 &&
    campaign.ads.every((ad) => Boolean(ad.imageDataUrl || ad.renderedLayoutVersion))
  );
}

export function getStoredLegalResult(
  campaign: CampaignRun,
  getResult: GetResult
): ReviewResult | undefined {
  if (!campaign.legalReviewId) return undefined;
  return getResult(campaign.legalReviewId);
}

export function isLegalReviewPassed(campaign: CampaignRun, getResult: GetResult): boolean {
  return getStoredLegalResult(campaign, getResult)?.overallRisk === "clear";
}

export function isPackagingComplete(campaign: CampaignRun): boolean {
  if (campaign.phase === "ready_to_post" || campaign.phase === "posted") return true;
  if (campaign.completedAt) return true;
  const captions = campaign.captionsByPlatform;
  return Boolean(captions && campaign.platforms.every((p) => captions[p]?.trim()));
}

const RESUMABLE_PHASES = [
  "generating",
  "legal_review",
  "fixing",
  "packaging",
  "approved",
] as const;

export type ResumablePhase = (typeof RESUMABLE_PHASES)[number];

export function isResumablePhase(phase: CampaignRun["phase"]): phase is ResumablePhase {
  return (RESUMABLE_PHASES as readonly string[]).includes(phase);
}

/** True when creative + ad cards + legal are done — only packaging may remain. */
export function needsPackagingOnlyResume(campaign: CampaignRun, getResult: GetResult): boolean {
  if (!isResumablePhase(campaign.phase)) return false;
  if (isPackagingComplete(campaign)) return false;
  return adCardsAreGenerated(campaign) && isLegalReviewPassed(campaign, getResult);
}

/** Whether opening the campaign should invoke resumeCampaignPipeline at all. */
export function shouldResumeCampaignPipeline(
  campaign: CampaignRun,
  _getResult: GetResult
): boolean {
  if (isCampaignPipelineSettled(campaign.id)) return false;
  if (campaign.status !== "running") return false;
  if (campaignHasGeneratedAds(campaign)) return false;
  if (campaign.completedAt || campaign.phase === "ready_to_post" || campaign.phase === "posted") {
    return false;
  }

  if (!isResumablePhase(campaign.phase)) return false;

  // Only resume mid-flight creative work before any ads exist (tab closed during generation).
  return campaign.phase === "generating" && needsCreativeResume(campaign);
}

/** Skip client-side re-render; hydrate from IndexedDB / storage instead. */
export function shouldSkipAdCardRerender(campaign: CampaignRun, getResult: GetResult): boolean {
  if (isCampaignPipelineSettled(campaign.id)) return true;
  if (campaignHasGeneratedAds(campaign)) return true;
  if (adCardsAreGenerated(campaign)) return true;
  if (isLegalReviewPassed(campaign, getResult)) return true;
  return campaign.phase === "ready_to_post" || campaign.phase === "posted";
}

export function shouldAutoStartFreshPipeline(campaign: CampaignRun): boolean {
  if (isCampaignPipelineSettled(campaign.id)) return false;
  if (campaign.status !== "running") return false;
  if (campaign.phase !== "generating") return false;
  if (campaign.ads.length > 0) return false;
  const step = campaign.creativePipelineStep ?? "pending";
  if (step !== "pending") return false;
  return true;
}
