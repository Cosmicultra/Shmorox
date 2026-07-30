import { buildFullPostText } from "./ad/caption-generator";
import { ADVISORPILOT_DEMO_URL } from "./knowledge/constants";
import { isPersonalBrandCampaign } from "./knowledge/personal-brand";
import type { CampaignRun, SocialPlatform } from "./types";

export function getPostDemoUrl(campaign: CampaignRun): string {
  return campaign.qrUrl || ADVISORPILOT_DEMO_URL;
}

export function getFullPostForPlatform(
  campaign: CampaignRun,
  platform: SocialPlatform
): string {
  const caption = campaign.captionsByPlatform?.[platform] ?? campaign.caption ?? "";

  // Personal brand posts already include hashtags and must not append a demo link.
  if (isPersonalBrandCampaign(campaign.contentPillar, campaign.contentMode)) {
    return caption;
  }

  const hashtags = campaign.hashtagsByPlatform?.[platform] ?? campaign.hashtags;
  return buildFullPostText(caption, hashtags, platform, getPostDemoUrl(campaign));
}

export function exportPackageFilename(campaign: CampaignRun, platform: SocialPlatform): string {
  const prefix =
    campaign.contentMode === "personal-brand" ? "personal-brand" : "advisorpilot";
  return `${prefix}-${campaign.contentPillar}-${platform}-${campaign.id.slice(0, 8)}`;
}
