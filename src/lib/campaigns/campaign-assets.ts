import type { AspectRatio, CampaignRun } from "@/lib/types";
import { isDataUrl } from "./strip-images";

export type CampaignAssetUpload =
  | { type: "master"; dataUrl: string }
  | { type: "adapted"; aspect: AspectRatio; dataUrl: string }
  /** Campaign-level generated panel artwork, keyed by aspect (a generation checkpoint). */
  | { type: "panel"; aspect: AspectRatio; dataUrl: string }
  | { type: "ad"; adId: string; dataUrl: string }
  | { type: "ad-creative"; adId: string; dataUrl: string }
  | { type: "ad-panel"; adId: string; dataUrl: string };

export function adImagePath(userId: string, campaignId: string, adId: string): string {
  return `${userId}/${campaignId}/ads/${adId}.png`;
}

export function masterImagePath(userId: string, campaignId: string): string {
  return `${userId}/${campaignId}/master.png`;
}

export function adaptedImagePath(userId: string, campaignId: string, aspect: AspectRatio): string {
  const slug = aspect.replace(":", "-");
  return `${userId}/${campaignId}/adapted/${slug}.png`;
}

export function adCreativeImagePath(userId: string, campaignId: string, adId: string): string {
  return `${userId}/${campaignId}/ads/${adId}-creative.png`;
}

export function adPanelImagePath(userId: string, campaignId: string, adId: string): string {
  return `${userId}/${campaignId}/ads/${adId}-panel.png`;
}

export function panelImagePath(userId: string, campaignId: string, aspect: AspectRatio): string {
  const slug = aspect.replace(":", "-");
  return `${userId}/${campaignId}/panels/${slug}.png`;
}

export function assetStoragePath(
  userId: string,
  campaignId: string,
  asset: CampaignAssetUpload
): string {
  switch (asset.type) {
    case "master":
      return masterImagePath(userId, campaignId);
    case "adapted":
      return adaptedImagePath(userId, campaignId, asset.aspect);
    case "panel":
      return panelImagePath(userId, campaignId, asset.aspect);
    case "ad":
      return adImagePath(userId, campaignId, asset.adId);
    case "ad-creative":
      return adCreativeImagePath(userId, campaignId, asset.adId);
    case "ad-panel":
      return adPanelImagePath(userId, campaignId, asset.adId);
  }
}

/** Collect inline images that need uploading before a metadata-only save. */
export function collectCampaignImageAssets(campaign: CampaignRun): CampaignAssetUpload[] {
  const assets: CampaignAssetUpload[] = [];

  if (isDataUrl(campaign.masterImageUrl)) {
    assets.push({ type: "master", dataUrl: campaign.masterImageUrl });
  }

  if (campaign.adaptedImages) {
    for (const [aspect, url] of Object.entries(campaign.adaptedImages) as [AspectRatio, string][]) {
      if (isDataUrl(url)) {
        assets.push({ type: "adapted", aspect, dataUrl: url });
      }
    }
  }

  // Checkpoints save panel artwork before any ad exists to carry it, so the
  // campaign-level map needs its own home in Storage or a resume regenerates it.
  if (campaign.panelImages) {
    for (const [aspect, url] of Object.entries(campaign.panelImages) as [AspectRatio, string][]) {
      if (isDataUrl(url)) {
        assets.push({ type: "panel", aspect, dataUrl: url });
      }
    }
  }

  for (const ad of campaign.ads) {
    if (isDataUrl(ad.imageDataUrl)) {
      assets.push({ type: "ad", adId: ad.id, dataUrl: ad.imageDataUrl });
    }
    if (isDataUrl(ad.creativeAssetUrl)) {
      assets.push({ type: "ad-creative", adId: ad.id, dataUrl: ad.creativeAssetUrl });
    }
    if (isDataUrl(ad.panelImageUrl)) {
      assets.push({ type: "ad-panel", adId: ad.id, dataUrl: ad.panelImageUrl });
    }
  }

  return assets;
}
