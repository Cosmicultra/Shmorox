import type { CampaignRun } from "@/lib/types";
import { collectCampaignImageAssets, type CampaignAssetUpload } from "./campaign-assets";

function describeAsset(asset: CampaignAssetUpload): string {
  switch (asset.type) {
    case "master":
      return asset.type;
    case "adapted":
    case "panel":
      return `${asset.type} ${asset.aspect}`;
    default:
      return `${asset.type} ${asset.adId}`;
  }
}

async function uploadCampaignAsset(campaignId: string, asset: CampaignAssetUpload): Promise<void> {
  const res = await fetch(`/api/campaigns/${campaignId}/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to upload campaign asset (${res.status})`);
  }
}

/**
 * Upload inline images one at a time so each request stays under the body size
 * limit. Throws if any upload fails: the caller strips data URLs before writing
 * the row, so saving after a failed upload would drop an image that never
 * reached Storage. The rejection names every failure rather than only the first.
 */
export async function uploadCampaignImagesClient(campaign: CampaignRun): Promise<void> {
  const assets = collectCampaignImageAssets(campaign);
  const results = await Promise.allSettled(
    assets.map((asset) => uploadCampaignAsset(campaign.id, asset))
  );

  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [`${describeAsset(assets[index])}: ${result.reason?.message ?? result.reason}`]
      : []
  );

  if (failures.length) {
    throw new Error(
      `Failed to upload ${failures.length} of ${assets.length} campaign assets — ${failures.join("; ")}`
    );
  }
}
