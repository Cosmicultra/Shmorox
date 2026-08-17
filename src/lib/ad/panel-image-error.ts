/**
 * Raised when the AI graphic panel cannot be generated for a split-ai-panel ad.
 * Deliberately bypasses the template fallback so the campaign fails visibly
 * instead of shipping a card without the requested artwork.
 */
export class AdPanelImageError extends Error {
  constructor(reason: string) {
    super(`AI graphic panel generation failed: ${reason}`);
    this.name = "AdPanelImageError";
  }
}

export function isAdPanelImageError(error: unknown): error is AdPanelImageError {
  return error instanceof AdPanelImageError || (error as Error)?.name === "AdPanelImageError";
}
