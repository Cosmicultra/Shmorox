/**
 * Bump when AdCardTemplate layout/styling changes materially.
 * Opening a campaign re-renders ads whose renderedLayoutVersion is behind this.
 */
export const AD_CARD_LAYOUT_VERSION = 12;

export function adHasCurrentLayout(ad: {
  imageDataUrl?: string;
  renderedLayoutVersion?: number;
}): boolean {
  return Boolean(ad.imageDataUrl) && ad.renderedLayoutVersion === AD_CARD_LAYOUT_VERSION;
}

export function adsNeedLayoutRerender(
  ads: Array<{ imageDataUrl?: string; renderedLayoutVersion?: number }>
): boolean {
  return ads.some((ad) => !adHasCurrentLayout(ad));
}
