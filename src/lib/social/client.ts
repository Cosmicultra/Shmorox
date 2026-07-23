import type { SocialPost, SocialPostResult } from "./types";

export async function postToLinkedIn(post: SocialPost): Promise<SocialPostResult> {
  const res = await fetch("/api/social/linkedin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: post.text,
      imageDataUrl: post.imageDataUrl,
    }),
  });

  const data = await res.json();
  return {
    platform: "linkedin",
    success: data.success ?? false,
    message: data.message ?? "Unknown response",
    postId: data.postId,
  };
}

export async function postToMeta(
  post: SocialPost,
  platform: "instagram" | "facebook" = "instagram"
): Promise<SocialPostResult> {
  const res = await fetch("/api/social/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: post.text,
      imageDataUrl: post.imageDataUrl,
      platform,
    }),
  });

  const data = await res.json();
  return {
    platform: platform === "instagram" ? "instagram" : "instagram",
    success: data.success ?? false,
    message: data.message ?? "Unknown response",
    postId: data.postId,
  };
}

export async function postToX(post: SocialPost): Promise<SocialPostResult> {
  const res = await fetch("/api/social/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: post.text,
      imageDataUrl: post.imageDataUrl,
    }),
  });

  const data = await res.json();
  return {
    platform: "x",
    success: data.success ?? false,
    message: data.message ?? "Unknown response",
    postId: data.postId,
  };
}

export async function postToTikTok(post: SocialPost): Promise<SocialPostResult> {
  const res = await fetch("/api/social/tiktok", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: post.text,
      imageDataUrl: post.imageDataUrl,
    }),
  });

  const data = await res.json();
  return {
    platform: "tiktok",
    success: data.success ?? false,
    message: data.message ?? "Unknown response",
    postId: data.postId,
  };
}

export async function postToPlatform(post: SocialPost): Promise<SocialPostResult> {
  switch (post.platform) {
    case "linkedin":
      return postToLinkedIn(post);
    case "instagram":
      return postToMeta(post, "instagram");
    case "x":
      return postToX(post);
    case "tiktok":
      return postToTikTok(post);
    default:
      return { platform: post.platform, success: false, message: "Unknown platform" };
  }
}

export type ConnectionStatus = {
  connected: boolean;
  accountName?: string;
  personName?: string;
  postAs?: "person" | "organization";
  organizationId?: string;
  organizationName?: string;
  demoMode?: boolean;
};

export async function checkConnection(platform: string): Promise<ConnectionStatus> {
  const res = await fetch(`/api/social/${platform === "instagram" ? "meta" : platform}`);
  if (!res.ok) return { connected: false };
  return res.json();
}

export async function setLinkedInPostAs(
  postAs: "person" | "organization"
): Promise<ConnectionStatus & { success?: boolean; message?: string }> {
  const res = await fetch("/api/social/linkedin", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postAs }),
  });
  return res.json();
}
