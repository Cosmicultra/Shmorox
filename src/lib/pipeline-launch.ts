const LAUNCH_KEY_PREFIX = "shmorox:pipeline-launch:";

/** Set when user clicks Launch on the new-campaign wizard (before navigating to detail). */
export function markCampaignForInitialPipelineRun(campaignId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(`${LAUNCH_KEY_PREFIX}${campaignId}`, "1");
}

export function hasPendingInitialPipelineRun(campaignId: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(`${LAUNCH_KEY_PREFIX}${campaignId}`) === "1";
}

export function clearInitialPipelineRun(campaignId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(`${LAUNCH_KEY_PREFIX}${campaignId}`);
}
