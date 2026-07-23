import { NextRequest, NextResponse } from "next/server";
import { getOpenAIConfig } from "@/lib/openai/config";
import { generateAdsFromTemplates, type AdGenerationInput } from "@/lib/ad/template-generator";
import { runCreativeToAds } from "@/lib/creative/pipeline";

export async function POST(req: NextRequest) {
  let input: AdGenerationInput;

  try {
    input = (await req.json()) as AdGenerationInput;
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
      ads: generateAdsFromTemplates(input),
      source: "template",
      demoMode: true,
      message: "Add OPENAI_API_KEY to .env.local to enable the Creative Director pipeline.",
    });
  }

  try {
    const result = await runCreativeToAds({
      contentPillarId: input.contentPillarId,
      customRequest: input.customRequest,
      platforms: input.platforms,
    });

    return NextResponse.json({
      ads: result.ads,
      source: result.source,
      model: getOpenAIConfig().model,
      creativeBrief: result.brief,
      originalBrief: result.originalBrief,
      creativeReview: result.review,
      strategyApproved: result.strategyApproved,
      strategyReviewHistory: result.strategyReviewHistory,
      finalStrategyRationale: result.finalStrategyRationale,
      conceptVariations: result.variations,
      variationGateHistory: result.variationGateHistory,
      selectedConcept: result.selectedConcept,
      creativeJob: result.job,
      masterImageUrl: result.masterImageUrl,
      imagesBlocked: result.imagesBlocked,
      fallback: result.fallback,
      message: result.message,
    });
  } catch (error) {
    console.error("Creative Director pipeline failed:", error);

    return NextResponse.json({
      ads: generateAdsFromTemplates(input),
      source: "template",
      fallback: true,
      message:
        error instanceof Error ? error.message : "Creative Director pipeline failed. Used template fallback.",
    });
  }
}
