export type SocialPlatform = "linkedin" | "instagram" | "x" | "tiktok";

export interface SocialConnection {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  platform_user_id: string | null;
  account_name: string | null;
  connected_at: string;
  updated_at: string;
}
