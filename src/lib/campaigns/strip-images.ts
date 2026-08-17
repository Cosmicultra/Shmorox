import type { CampaignRun } from "@/lib/types";

export function isDataUrl(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

/** Remove inline image blobs before saving JSON to Postgres. */
export function stripCampaignImages(campaign: CampaignRun): CampaignRun {
  return {
    ...campaign,
    masterImageUrl: isDataUrl(campaign.masterImageUrl) ? undefined : campaign.masterImageUrl,
    adaptedImages: campaign.adaptedImages
      ? Object.fromEntries(
          Object.entries(campaign.adaptedImages).map(([k, v]) => [
            k,
            isDataUrl(v) ? undefined : v,
          ])
        )
      : campaign.adaptedImages,
    // Panel artwork is persisted per-ad in Storage; the campaign-level map is
    // only a generation checkpoint and must not bloat the Postgres row.
    panelImages: campaign.panelImages
      ? Object.fromEntries(
          Object.entries(campaign.panelImages).map(([k, v]) => [
            k,
            isDataUrl(v) ? undefined : v,
          ])
        )
      : campaign.panelImages,
    ads: campaign.ads.map((ad) => ({
      ...ad,
      imageDataUrl: isDataUrl(ad.imageDataUrl) ? undefined : ad.imageDataUrl,
      creativeAssetUrl: isDataUrl(ad.creativeAssetUrl) ? undefined : ad.creativeAssetUrl,
      panelImageUrl: isDataUrl(ad.panelImageUrl) ? undefined : ad.panelImageUrl,
    })),
  };
}
