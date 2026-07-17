import type { SupabaseClient } from "@supabase/supabase-js";
import type { AspectRatio, CampaignRun, GeneratedAd } from "@/lib/types";

export const CAMPAIGN_ASSETS_BUCKET = "campaign-assets";

function isDataUrl(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

async function bufferToDataUrl(buffer: Buffer, mime = "image/png"): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

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

export function campaignStoragePrefix(userId: string, campaignId: string): string {
  return `${userId}/${campaignId}`;
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

async function uploadIfDataUrl(
  supabase: SupabaseClient,
  dataUrl: string | undefined,
  path: string
): Promise<void> {
  if (!isDataUrl(dataUrl)) return;

  const buffer = dataUrlToBuffer(dataUrl);
  const { error } = await supabase.storage.from(CAMPAIGN_ASSETS_BUCKET).upload(path, buffer, {
    contentType: "image/png",
    upsert: true,
  });

  if (error) throw new Error(`Failed to upload ${path}: ${error.message}`);
}

async function downloadAsDataUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string | undefined> {
  const { data, error } = await supabase.storage.from(CAMPAIGN_ASSETS_BUCKET).download(path);
  if (error || !data) return undefined;
  const buffer = Buffer.from(await data.arrayBuffer());
  return bufferToDataUrl(buffer);
}

/** Upload all inline images for a campaign to Storage. */
export async function uploadCampaignImages(
  supabase: SupabaseClient,
  userId: string,
  campaign: CampaignRun
): Promise<void> {
  if (isDataUrl(campaign.masterImageUrl)) {
    await uploadIfDataUrl(supabase, campaign.masterImageUrl, masterImagePath(userId, campaign.id));
  }

  if (campaign.adaptedImages) {
    for (const [aspect, url] of Object.entries(campaign.adaptedImages) as [AspectRatio, string][]) {
      if (isDataUrl(url)) {
        await uploadIfDataUrl(supabase, url, adaptedImagePath(userId, campaign.id, aspect));
      }
    }
  }

  for (const ad of campaign.ads) {
    if (isDataUrl(ad.imageDataUrl)) {
      await uploadIfDataUrl(supabase, ad.imageDataUrl, adImagePath(userId, campaign.id, ad.id));
    }
    if (isDataUrl(ad.creativeAssetUrl)) {
      await uploadIfDataUrl(
        supabase,
        ad.creativeAssetUrl,
        `${userId}/${campaign.id}/ads/${ad.id}-creative.png`
      );
    }
  }
}

async function hydrateAdImages(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  ad: GeneratedAd
): Promise<GeneratedAd> {
  if (ad.imageDataUrl) return ad;

  const imageDataUrl = await downloadAsDataUrl(
    supabase,
    adImagePath(userId, campaignId, ad.id)
  );

  let creativeAssetUrl = ad.creativeAssetUrl;
  if (!creativeAssetUrl || isDataUrl(creativeAssetUrl)) {
    const stored = await downloadAsDataUrl(
      supabase,
      `${userId}/${campaignId}/ads/${ad.id}-creative.png`
    );
    if (stored) creativeAssetUrl = stored;
  }

  return {
    ...ad,
    ...(imageDataUrl ? { imageDataUrl } : {}),
    ...(creativeAssetUrl ? { creativeAssetUrl } : {}),
  };
}

/** Restore inline image data URLs from Storage (for detail view / posting). */
export async function hydrateCampaignImages(
  supabase: SupabaseClient,
  userId: string,
  campaign: CampaignRun,
  options: { includeAds?: boolean } = {}
): Promise<CampaignRun> {
  const includeAds = options.includeAds ?? true;

  let masterImageUrl = campaign.masterImageUrl;
  if (!masterImageUrl || isDataUrl(masterImageUrl)) {
    const stored = await downloadAsDataUrl(supabase, masterImagePath(userId, campaign.id));
    if (stored) masterImageUrl = stored;
  }

  let adaptedImages = campaign.adaptedImages;
  if (campaign.adaptedImages) {
    const next: Partial<Record<AspectRatio, string>> = { ...campaign.adaptedImages };
    for (const aspect of Object.keys(campaign.adaptedImages) as AspectRatio[]) {
      const current = next[aspect];
      if (!current || isDataUrl(current)) {
        const stored = await downloadAsDataUrl(
          supabase,
          adaptedImagePath(userId, campaign.id, aspect)
        );
        if (stored) next[aspect] = stored;
      }
    }
    adaptedImages = next;
  }

  const ads = includeAds
    ? await Promise.all(
        campaign.ads.map((ad) => hydrateAdImages(supabase, userId, campaign.id, ad))
      )
    : campaign.ads;

  return {
    ...campaign,
    masterImageUrl,
    adaptedImages,
    ads,
  };
}

async function listStorageRecursive(
  supabase: SupabaseClient,
  folder: string
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(CAMPAIGN_ASSETS_BUCKET).list(folder, {
    limit: 500,
  });

  if (error || !data) return [];

  const paths: string[] = [];

  for (const entry of data) {
    const fullPath = folder ? `${folder}/${entry.name}` : entry.name;
    if (entry.id == null) {
      paths.push(...(await listStorageRecursive(supabase, fullPath)));
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}

/** Delete all Storage objects for a campaign. */
export async function deleteCampaignStorage(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string
): Promise<void> {
  const prefix = campaignStoragePrefix(userId, campaignId);
  const paths = await listStorageRecursive(supabase, prefix);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(CAMPAIGN_ASSETS_BUCKET).remove(paths);
  if (error) throw new Error(`Failed to delete campaign assets: ${error.message}`);
}
