/** Active pipelines with last-touch timestamp for stale lock recovery. */
const activePipelines = new Map<string, number>();

/** Release locks older than this — recovers from navigation/HMR without endPipeline. */
const STALE_LOCK_MS = 10 * 60 * 1000;

function isStale(campaignId: string): boolean {
  const touched = activePipelines.get(campaignId);
  if (!touched) return false;
  return Date.now() - touched > STALE_LOCK_MS;
}

export function isPipelineActive(campaignId: string): boolean {
  if (isStale(campaignId)) {
    activePipelines.delete(campaignId);
    return false;
  }
  return activePipelines.has(campaignId);
}

export function beginPipeline(campaignId: string): boolean {
  if (isPipelineActive(campaignId)) return false;
  activePipelines.set(campaignId, Date.now());
  return true;
}

export function touchPipeline(campaignId: string): void {
  if (activePipelines.has(campaignId)) {
    activePipelines.set(campaignId, Date.now());
  }
}

export function endPipeline(campaignId: string): void {
  activePipelines.delete(campaignId);
}

export function forceEndPipeline(campaignId: string): void {
  activePipelines.delete(campaignId);
}
