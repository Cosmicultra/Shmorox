import { ADVISORPILOT_KNOWLEDGE, getPillarById } from "../knowledge/advisorpilot";
import { SOCIAL_PLATFORMS, type AspectRatio, type SocialPlatform } from "../types";

/**
 * Ad copy generation has moved to src/lib/creative/ (Executive Creative Director pipeline).
 * This file retains caption prompts and variant request helpers.
 */

export interface AdVariantRequest {
  platform: SocialPlatform;
  aspectRatio: AspectRatio;
}

export function buildAdVariantRequests(platforms: SocialPlatform[]): AdVariantRequest[] {
  const variants: AdVariantRequest[] = [];

  for (const platform of platforms) {
    const config = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!config) continue;

    for (const aspectRatio of config.aspectRatios) {
      variants.push({ platform, aspectRatio });
    }
  }

  return variants;
}

export function buildAdGenerationPrompt(
  contentPillarId: string,
  variants: AdVariantRequest[]
): { system: string; user: string } {
  const pillar = getPillarById(contentPillarId);
  if (!pillar) {
    throw new Error(`Unknown content pillar: ${contentPillarId}`);
  }

  const system = `You are a senior creative copywriter for ${ADVISORPILOT_KNOWLEDGE.brandMark}, a workflow platform for independent RIAs.

Write compliant organic social ad copy. Return valid JSON only.

Brand voice:
${ADVISORPILOT_KNOWLEDGE.voice.map((line) => `- ${line}`).join("\n")}

Approved phrases you may use:
${ADVISORPILOT_KNOWLEDGE.approvedPhrases.map((line) => `- ${line}`).join("\n")}

Never use these prohibited claims:
${ADVISORPILOT_KNOWLEDGE.prohibitedClaims.map((line) => `- ${line}`).join("\n")}

Rules:
- No em-dashes or en-dashes. Use commas or periods instead.
- Do not promise investment returns, outperformance, or guaranteed outcomes.
- Position AI as workflow assistance, not investment advice.
- Do not claim SEC, FINRA, or regulatory approval.
- Headlines may include a line break as \\n for visual emphasis.
- Keep copy concise and platform-appropriate.
- CTAs should be short action phrases like "Request a demo" or "See the workflow".`;

  const variantSpecs = variants
    .map((variant) => {
      const config = SOCIAL_PLATFORMS.find((p) => p.id === variant.platform);
      const limits =
        variant.platform === "x"
          ? "headline max 55 chars, subhead max 50 chars, cta max 10 chars"
          : variant.platform === "instagram" || variant.platform === "tiktok"
            ? "subhead max 60 chars"
            : "headline max 90 chars, subhead max 140 chars";

      return `- ${variant.platform} (${variant.aspectRatio}): ${limits}, char limit ${config?.charLimit ?? 300}`;
    })
    .join("\n");

  const user = `Content pillar: ${pillar.title}
Pillar headline seed: ${pillar.headline}
Pillar subhead seed: ${pillar.subhead}
Pillar CTA seed: ${pillar.cta}
Pillar description: ${pillar.description}

Generate one unique ad variant for each item below:
${variantSpecs}

Return JSON in this shape:
{
  "variants": [
    {
      "platform": "linkedin",
      "aspectRatio": "1:1",
      "headline": "...",
      "subhead": "...",
      "cta": "..."
    }
  ]
}`;

  return { system, user };
}

export function buildCaptionGenerationPrompt(
  contentPillarId: string,
  platforms: SocialPlatform[],
  customRequest?: string
): { system: string; user: string } {
  const pillar = getPillarById(contentPillarId);
  if (!pillar) {
    throw new Error(`Unknown content pillar: ${contentPillarId}`);
  }

  const system = `You write organic social captions for ${ADVISORPILOT_KNOWLEDGE.brandMark}.

Return valid JSON only. Do not include URLs or hashtags in captions.

Rules:
- No em-dashes or en-dashes.
- Professional, fiduciary-aware tone for RIAs.
- No guaranteed returns, outperformance, or regulatory approval claims.
- AI assists workflow preparation, not investment advice.
- Match each platform's typical style and length.
- Ground captions in real AdvisorPilot capabilities (statement intake, analysis, client-ready materials).
- If a custom request topic is provided, address that angle while staying product-accurate.`;

  const platformSpecs = platforms
    .map((platform) => {
      const config = SOCIAL_PLATFORMS.find((p) => p.id === platform);
      return `- ${platform}: max ${config?.charLimit ?? 300} characters`;
    })
    .join("\n");

  const customBlock = customRequest?.trim()
    ? `\nCustom request topic (address this angle):\n"""${customRequest.trim()}"""\n`
    : "";

  const user = `Content pillar: ${pillar.title}
Description: ${pillar.description}
Headline seed: ${pillar.headline}
Subhead seed: ${pillar.subhead}
${customBlock}
Write one caption per platform:
${platformSpecs}

Return JSON in this shape:
{
  "captions": {
    "linkedin": "...",
    "instagram": "..."
  }
}`;

  return { system, user };
}
