import { buildFullPostText } from "./ad/caption-generator";
import type { CampaignRun, SocialPlatform } from "./types";

export function getFullPostForPlatform(
  campaign: CampaignRun,
  platform: SocialPlatform
): string {
  const caption = campaign.captionsByPlatform?.[platform] ?? campaign.caption ?? "";
  const hashtags = campaign.hashtagsByPlatform?.[platform] ?? campaign.hashtags;
  return buildFullPostText(caption, hashtags, platform, campaign.qrUrl);
}

export function exportPackageFilename(campaign: CampaignRun, platform: SocialPlatform): string {
  return `advisorpilot-${campaign.contentPillar}-${platform}-${campaign.id.slice(0, 8)}`;
}
