import type { CampaignRun } from "@/lib/types";
import { collectCampaignImageAssets, type CampaignAssetUpload } from "./campaign-assets";

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

/** Upload inline images one at a time so each request stays under the body size limit. */
export async function uploadCampaignImagesClient(campaign: CampaignRun): Promise<void> {
  const assets = collectCampaignImageAssets(campaign);
  await Promise.all(assets.map((asset) => uploadCampaignAsset(campaign.id, asset)));
}
