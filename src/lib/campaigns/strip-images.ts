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
    ads: campaign.ads.map((ad) => ({
      ...ad,
      imageDataUrl: isDataUrl(ad.imageDataUrl) ? undefined : ad.imageDataUrl,
      creativeAssetUrl: isDataUrl(ad.creativeAssetUrl) ? undefined : ad.creativeAssetUrl,
    })),
  };
}
