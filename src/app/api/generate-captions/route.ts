import { NextRequest, NextResponse } from "next/server";
import { sanitizeNoEmDash } from "@/lib/ad/content-guardrails";
import { generateCaptionsFromTemplates } from "@/lib/ad/template-generator";
import { getOpenAIConfig } from "@/lib/openai/config";
import { deltaToReport } from "@/lib/openai/cost-tracker";
import { withCostTracking } from "@/lib/openai/cost-tracker-server";
import { generateJSON } from "@/lib/openai/server";
import { buildCaptionGenerationPrompt } from "@/lib/openai/prompts";
import type { SocialPlatform } from "@/lib/types";

interface CaptionGenerationRequest {
  contentPillarId: string;
  platforms: SocialPlatform[];
  demoUrl?: string;
  customRequest?: string;
}

interface CaptionAIResponse {
  captions: Partial<Record<SocialPlatform, string>>;
}

export async function POST(req: NextRequest) {
  let input: CaptionGenerationRequest;

  try {
    input = (await req.json()) as CaptionGenerationRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!input.contentPillarId || !Array.isArray(input.platforms) || input.platforms.length === 0) {
    return NextResponse.json(
      { error: "contentPillarId and platforms are required" },
      { status: 400 }
    );
  }

  const { enabled } = getOpenAIConfig();

  if (!enabled) {
    return NextResponse.json({
      captions: generateCaptionsFromTemplates(input.contentPillarId, input.platforms),
      source: "template",
      demoMode: true,
      message: "Add OPENAI_API_KEY to .env.local to enable AI-generated captions.",
    });
  }

  try {
    const { value: captions, cost } = await withCostTracking(async () => {
      const { system, user } = buildCaptionGenerationPrompt(
        input.contentPillarId,
        input.platforms,
        input.customRequest
      );
      const aiResult = await generateJSON<CaptionAIResponse>(system, user);
      const generated = {} as Record<SocialPlatform, string>;

      for (const platform of input.platforms) {
        const caption = aiResult.captions?.[platform];
        if (!caption) {
          throw new Error(`OpenAI did not return a caption for ${platform}`);
        }
        generated[platform] = sanitizeNoEmDash(caption);
      }

      return generated;
    });

    return NextResponse.json({
      captions,
      source: "openai",
      model: getOpenAIConfig().model,
      costDelta: cost,
      costReport: deltaToReport(cost),
    });
  } catch (error) {
    console.error("OpenAI caption generation failed, using templates:", error);

    return NextResponse.json({
      captions: generateCaptionsFromTemplates(input.contentPillarId, input.platforms),
      source: "template",
      fallback: true,
      message:
        error instanceof Error ? error.message : "OpenAI request failed. Used template fallback.",
    });
  }
}
