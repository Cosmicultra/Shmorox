import {
  ADVISORPILOT_DEMO_URL,
  ADVISORPILOT_POST_LINK_LABEL,
  getPillarTitle as getPillarTitleFromConstants,
} from "../knowledge/constants";
import type { SocialPlatform } from "../types";
import { sanitizeNoEmDash } from "./content-guardrails";

const X_CHAR_LIMIT = 280;
const POST_LINK_MARKDOWN_RE = /\[([^\]]+)\]\(([^)]+)\)/;

export function formatPostDemoLink(demoUrl: string = ADVISORPILOT_DEMO_URL): string {
  return `[${ADVISORPILOT_POST_LINK_LABEL}](${demoUrl})`;
}

/** Converts markdown demo links to plain text for platform APIs. */
export function formatPostTextForApi(text: string, platform: SocialPlatform): string {
  return text.replace(POST_LINK_MARKDOWN_RE, (_, label: string, url: string) => {
    if (platform === "instagram" || platform === "tiktok") return label;
    if (platform === "x") return `${label} ${url}`;
    return `${label}\n${url}`;
  });
}

interface GenerateCaptionsResponse {
  captions: Record<SocialPlatform, string>;
  source: "openai" | "template";
  demoMode?: boolean;
  fallback?: boolean;
  message?: string;
  costDelta?: import("../openai/cost-tracker").GenerationCostDelta;
}

export async function generateCaptionsForPlatforms(
  pillarId: string,
  platforms: SocialPlatform[],
  demoUrl: string
): Promise<{
  captions: Record<SocialPlatform, string>;
  costDelta?: import("../openai/cost-tracker").GenerationCostDelta;
}> {
  const response = await fetch("/api/generate-captions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentPillarId: pillarId,
      platforms,
      demoUrl,
    }),
  });

  const data = (await response.json()) as GenerateCaptionsResponse & { error?: string };

  if (!response.ok || !data.captions) {
    throw new Error(data.error ?? data.message ?? "Caption generation failed");
  }

  return {
    captions: data.captions,
    costDelta: data.costDelta,
  };
}

export function buildFullPostText(
  caption: string,
  hashtags: string[],
  platform: SocialPlatform,
  demoUrl: string = ADVISORPILOT_DEMO_URL
): string {
  const cleanCaption = sanitizeNoEmDash(caption);
  const cleanHashtags = hashtags.map(sanitizeNoEmDash);
  const hashtagStr = cleanHashtags.join(" ");
  const linkPart = formatPostDemoLink(demoUrl);

  if (platform === "linkedin") {
    return sanitizeNoEmDash(`${cleanCaption}\n\n${linkPart}\n\n${hashtagStr}`);
  }

  if (platform === "x") {
    const hashtagPart = hashtagStr;
    const reserved =
      linkPart.length +
      1 +
      (hashtagPart ? hashtagPart.length + 1 : 0);
    const maxCaptionLen = Math.max(0, X_CHAR_LIMIT - reserved);
    let body = cleanCaption;

    if (body.length > maxCaptionLen) {
      body = `${body.slice(0, Math.max(0, maxCaptionLen - 1)).trimEnd()}…`;
    }

    return sanitizeNoEmDash([body, hashtagPart, linkPart].filter(Boolean).join(" "));
  }

  return sanitizeNoEmDash(`${cleanCaption}\n\n${hashtagStr}\n\n${linkPart}`);
}

export function getPillarTitle(pillarId: string): string {
  return getPillarTitleFromConstants(pillarId);
}
