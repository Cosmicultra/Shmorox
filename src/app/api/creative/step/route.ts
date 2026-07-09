import { NextRequest, NextResponse } from "next/server";
import { getOpenAIConfig } from "@/lib/openai/config";
import { deltaToReport } from "@/lib/openai/cost-tracker";
import { withCostTracking } from "@/lib/openai/cost-tracker-server";
import { runExplorationPhase, runPremiumRevision } from "@/lib/creative/exploration";
import { generateAdaptedImages } from "@/lib/creative/image-generator";
import type { AspectRatio, SocialPlatform } from "@/lib/types";
import { SOCIAL_PLATFORMS } from "@/lib/types";
import type { CreativeBrief, CreativeDirectorInput } from "@/lib/creative/types";

type CreativeStep = "exploration" | "premium_revision" | "images";

/** @deprecated Legacy steps — kept for checkpoint resume only */
type LegacyCreativeStep =
  | "brief"
  | "review"
  | "strategy"
  | "variations"
  | "variation_gate";

type StepRequest = {
  step: CreativeStep | LegacyCreativeStep;
  input?: CreativeDirectorInput;
  brief?: CreativeBrief;
  platforms?: SocialPlatform[];
  strategyApproved?: boolean;
  variations?: import("@/lib/creative/types").ConceptVariation[];
  generateConceptImages?: boolean;
  critique?: string;
  selectedConcept?: import("@/lib/creative/types").ConceptVariation;
  productionApproved?: boolean;
  legacyPipeline?: boolean;
};

function getRequiredAspectRatios(platforms: SocialPlatform[]): AspectRatio[] {
  const ratios = new Set<AspectRatio>();
  for (const platform of platforms) {
    const config = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!config) continue;
    for (const ratio of config.aspectRatios) ratios.add(ratio);
  }
  return [...ratios];
}

export async function POST(req: NextRequest) {
  let body: StepRequest;

  try {
    body = (await req.json()) as StepRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!getOpenAIConfig().enabled) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
  }

  const stepStartedAt = Date.now();

  try {
    const { value: result, cost } = await withCostTracking(async () => {
      switch (body.step) {
        case "exploration": {
          if (!body.input?.assetType) {
            throw new Error("input.assetType is required");
          }
          const exploration = await runExplorationPhase(body.input);
          return {
            brief: exploration.brief,
            originalBrief: exploration.originalBrief,
            review: exploration.review,
            strategyApproved: exploration.strategyApproved,
            strategyReviewHistory: exploration.strategyReviewHistory,
            finalStrategyRationale: exploration.finalStrategyRationale,
            variations: exploration.variations,
            selectedConcept: exploration.selectedConcept,
            selectionRationale: exploration.selectionRationale,
            visualDiversityReport: exploration.visualDiversityReport,
            variationGateHistory: exploration.variationGateHistory,
            productionApproved: exploration.productionApproved,
          };
        }

        case "premium_revision": {
          if (!body.brief) throw new Error("brief is required");
          const revised = await runPremiumRevision(body.brief, body.critique ?? "");
          return { brief: revised };
        }

        case "images": {
          if (!body.brief) throw new Error("brief is required");
          if (body.strategyApproved === false || body.productionApproved === false) {
            throw new Error(
              "Creative Director has not approved strategic direction. Images blocked."
            );
          }

          const aspectRatios = body.platforms?.length
            ? getRequiredAspectRatios(body.platforms)
            : (["1:1", "9:16"] as AspectRatio[]);

          const conceptBriefs = body.generateConceptImages
            ? body.variations?.map((variation) => variation.brief)
            : undefined;

          const { masterImageUrl, adaptedImages } = await generateAdaptedImages(
            body.brief,
            aspectRatios,
            undefined,
            {
              generateConceptImages: body.generateConceptImages,
              conceptBriefs,
            }
          );

          return { masterImageUrl, adaptedImages };
        }

        default:
          throw new Error(
            `Legacy step "${body.step}" is deprecated. Use "exploration" instead. Set legacyPipeline=true to resume old checkpoints.`
          );
      }
    });

    const durationMs = Date.now() - stepStartedAt;
    const tracker = cost;
    console.info(
      `[creative/step] ${body.step} completed in ${durationMs}ms — ` +
        `calls: ${tracker.textCalls}, images: ${tracker.imageGenerations}, ` +
        `tokens: ${tracker.totalTokens ?? 0}`
    );

    const costReport = deltaToReport(cost);

    return NextResponse.json({
      ...result,
      stepTiming: { step: body.step, durationMs },
      costDelta: cost,
      costReport,
    });
  } catch (error) {
    const durationMs = Date.now() - stepStartedAt;
    console.error(`Creative step "${body.step}" failed after ${durationMs}ms:`, error);

    const message = error instanceof Error ? error.message : "Creative step failed";
    const status =
      message.includes("required") ||
      message.includes("not approved") ||
      message.includes("deprecated") ||
      message.includes("Unknown step")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
