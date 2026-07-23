import type { SocialPlatform } from "../types";

export interface SocialPost {
  platform: SocialPlatform;
  text: string;
  imageDataUrl?: string;
  hashtags: string[];
}

export interface SocialPostResult {
  success: boolean;
  message: string;
  postId?: string;
  platform: SocialPlatform;
}

export interface SocialConnectionStatus {
  platform: SocialPlatform;
  connected: boolean;
  accountName?: string;
}

export const OAUTH_URLS: Record<SocialPlatform, string> = {
  linkedin: "/api/social/linkedin/auth",
  instagram: "/api/social/meta/auth?platform=instagram",
  x: "/api/social/x/auth",
  tiktok: "/api/social/tiktok/auth",
};

export function linkedInOAuthUrl(postAs: "person" | "organization" = "organization"): string {
  return `${OAUTH_URLS.linkedin}?as=${postAs}`;
}
