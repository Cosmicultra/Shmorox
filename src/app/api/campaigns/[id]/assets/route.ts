import { NextResponse } from "next/server";
import {
  assetStoragePath,
  type CampaignAssetUpload,
} from "@/lib/campaigns/campaign-assets";
import { CAMPAIGN_ASSETS_BUCKET } from "@/lib/campaigns/persistence";
import { isDataUrl } from "@/lib/campaigns/strip-images";
import { createClient } from "@/lib/supabase/server";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * A declared asset type that reaches here has no validation case, which would
 * silently 400 every upload of that type. Typed as `never` so adding a variant
 * to CampaignAssetUpload without handling it fails the build instead.
 */
function rejectUnhandledAssetType(asset: never): false {
  const type = (asset as { type?: unknown })?.type;
  console.warn(`[campaign-assets] rejected unknown asset type: ${String(type)}`);
  return false;
}

function isValidAsset(value: unknown): value is CampaignAssetUpload {
  if (!value || typeof value !== "object") return false;
  const asset = value as CampaignAssetUpload;
  if (!("type" in asset) || !("dataUrl" in asset) || !isDataUrl(asset.dataUrl)) return false;

  switch (asset.type) {
    case "master":
      return true;
    case "adapted":
    case "panel":
      return typeof asset.aspect === "string";
    case "ad":
    case "ad-creative":
    case "ad-panel":
      return typeof asset.adId === "string" && asset.adId.length > 0;
    default:
      return rejectUnhandledAssetType(asset);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const asset = (body as { asset?: unknown })?.asset;
  if (!isValidAsset(asset)) {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
  }

  const path = assetStoragePath(user.id, campaignId, asset);
  const buffer = dataUrlToBuffer(asset.dataUrl);

  const { error } = await supabase.storage.from(CAMPAIGN_ASSETS_BUCKET).upload(path, buffer, {
    contentType: "image/png",
    upsert: true,
  });

  if (error) {
    return NextResponse.json({ error: `Failed to upload asset: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, path });
}
