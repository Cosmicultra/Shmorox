const PIPELINE_LOCK_PREFIX = "shmorox:pipeline:";

export function getPipelineLockKey(campaignId: string): string {
  return `${PIPELINE_LOCK_PREFIX}${campaignId}`;
}

export function isPipelineLockedInSession(campaignId: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(getPipelineLockKey(campaignId)) === "1";
}

export function lockPipelineInSession(campaignId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(getPipelineLockKey(campaignId), "1");
}

export function unlockPipelineInSession(campaignId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(getPipelineLockKey(campaignId));
}
