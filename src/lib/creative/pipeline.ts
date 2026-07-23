import { buildMasterImagePrompt } from "./image-prompts";
import { generateAdaptedImages, isImageGenerationAvailable } from "./image-generator";
import { runExplorationPhase } from "./exploration";
import {
  createCreativeJob,
  updateJobStage,
  attachExplorationToJob,
  attachImagesToJob,
  attachLayoutAdaptationToJob,
  completeJob,
  blockImagesOnJob,
} from "./job";
import { getBrandDNA } from "./brand-dna";
import { CONCEPT_STRATEGIES } from "./types";
import type {
  ConceptVariation,
  CreativeBrief,
  CreativeDirectorInput,
  CreativePipelineCallbacks,
  CreativePipelineResult,
  CreativeReviewResult,
  VariationGateAttempt,
} from "./types";
import { generateId } from "../utils";
import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";
import { sanitizeNoEmDash } from "../ad/content-guardrails";
import { AD_DIMENSIONS, validateCreative } from "../ad/creative-rules";
import { getLayoutForPillar } from "../ad/visual-config";
import { generateAdsFromTemplates } from "../ad/template-generator";
import { SOCIAL_PLATFORMS, type AspectRatio, type GeneratedAd, type SocialPlatform } from "../types";

export interface CreativeToAdsInput {
  contentPillarId: string;
  platforms: SocialPlatform[];
  skipImages?: boolean;
  generateConceptImages?: boolean;
  /** Freeform topic/angle for custom-request campaigns */
  customRequest?: string;
}

export interface CreativeToAdsResult {
  ads: GeneratedAd[];
  brief: CreativeBrief;
  originalBrief: CreativeBrief;
  review: CreativeReviewResult;
  strategyApproved: boolean;
  strategyReviewHistory: import("./types").StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  variations: ConceptVariation[];
  variationGateHistory: VariationGateAttempt[];
  selectedConcept: ConceptVariation;
  job?: import("./types").CreativeJob;
  masterImageUrl?: string;
  imagesBlocked?: boolean;
  source: "creative-director" | "template";
  fallback?: boolean;
  message?: string;
}


function getRequiredAspectRatios(platforms: SocialPlatform[]): AspectRatio[] {
  const ratios = new Set<AspectRatio>();
  for (const platform of platforms) {
    const config = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!config) continue;
    for (const ratio of config.aspectRatios) ratios.add(ratio);
  }
  return [...ratios];
}

function adjustCopyForPlatform(brief: CreativeBrief, platform: SocialPlatform) {
  const base = { headline: brief.headline, subhead: brief.supportingCopy, cta: brief.cta };
  switch (platform) {
    case "x":
      return { headline: base.headline.slice(0, 55), subhead: base.subhead.slice(0, 50), cta: base.cta.slice(0, 10) || "Demo" };
    case "instagram":
    case "tiktok":
      return { headline: base.headline, subhead: base.subhead.slice(0, 60), cta: base.cta };
    case "linkedin":
      return { headline: base.headline, subhead: base.subhead, cta: base.cta || "Request a demo" };
    default:
      return base;
  }
}

function buildAdsFromCreative(
  contentPillarId: string,
  platforms: SocialPlatform[],
  brief: CreativeBrief,
  adaptedImages: Partial<Record<AspectRatio, string>>
): GeneratedAd[] {
  const layoutVariant = getLayoutForPillar(contentPillarId);
  const ads: GeneratedAd[] = [];

  for (const platform of platforms) {
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!platformConfig) continue;
    const copy = adjustCopyForPlatform(brief, platform);

    for (const aspectRatio of platformConfig.aspectRatios) {
      const headline = sanitizeNoEmDash(copy.headline);
      const subhead = sanitizeNoEmDash(copy.subhead);
      const cta = sanitizeNoEmDash(copy.cta);
      validateCreative(headline, subhead, cta, aspectRatio);
      const dims = AD_DIMENSIONS[aspectRatio];

      ads.push({
        id: generateId(),
        platform,
        aspectRatio,
        contentPillarId,
        layoutVariant,
        headline,
        subhead,
        cta,
        disclaimer: sanitizeNoEmDash(ADVISORPILOT_KNOWLEDGE.standardDisclaimer),
        creativeAssetUrl: adaptedImages[aspectRatio],
        width: dims.width,
        height: dims.height,
      });
    }
  }

  return ads;
}

export async function runCreativePipeline(
  input: CreativeDirectorInput,
  callbacks?: CreativePipelineCallbacks
): Promise<CreativePipelineResult> {
  const onProgress = callbacks?.onProgress;
  const onJobUpdate = callbacks?.onJobUpdate;

  let job = createCreativeJob(
    input.assetType,
    input.campaignType ?? "Enterprise Campaign",
    input.brandId
  );
  job = updateJobStage(job, "brand_dna", "complete", `${getBrandDNA(input.brandId).brand} Brand DNA loaded`);
  job = { ...job, brandDna: getBrandDNA(input.brandId) };
  onJobUpdate?.(job);

  const exploration = await runExplorationPhase(input, onProgress);

  job = attachExplorationToJob(
    job,
    exploration.brief,
    exploration.review,
    exploration.strategyApproved,
    exploration.strategyReviewHistory,
    exploration.finalStrategyRationale,
    exploration.variations,
    exploration.selectedConcept,
    exploration.selectionRationale,
    exploration.variationGateHistory,
    exploration.productionApproved
  );
  onJobUpdate?.(job);

  const originalBrief = exploration.originalBrief;
  const review = exploration.review;
  const strategyBrief = exploration.brief;
  const strategyApproved = exploration.strategyApproved;
  const strategyHistory = exploration.strategyReviewHistory;
  const finalRationale = exploration.finalStrategyRationale;
  const variations = exploration.variations;
  const selected = exploration.selectedConcept;
  const gateHistory = exploration.variationGateHistory;
  const gateApproved = exploration.productionApproved;

  if (!strategyApproved || !gateApproved) {
    onProgress?.("Strategic exploration did not approve production. Image production blocked.");
    job = blockImagesOnJob(job, "Exploration did not approve production");
    job = completeJob(job);
    onJobUpdate?.(job);

    return {
      job,
      brief: strategyBrief,
      originalBrief,
      review,
      strategyApproved: false,
      strategyReviewHistory: strategyHistory,
      finalStrategyRationale: finalRationale,
      variations,
      variationGateHistory: gateHistory,
      selectedConcept: selected,
      adaptedImages: {},
      imagesBlocked: true,
    };
  }

  let masterImageUrl: string | undefined;
  let adaptedImages: Partial<Record<AspectRatio, string>> = {};
  let imagesBlocked = false;

  if (!input.customBrief && isImageGenerationAvailable()) {
    const aspectRatios = input.platforms?.length
      ? getRequiredAspectRatios(input.platforms)
      : (["1:1", "9:16"] as AspectRatio[]);

    try {
      const images = await generateAdaptedImages(
        selected.brief,
        aspectRatios,
        onProgress,
        {
          generateConceptImages: input.generateConceptImages,
          conceptBriefs: input.generateConceptImages
            ? variations.map((variation) => variation.brief)
            : undefined,
        }
      );
      masterImageUrl = images.masterImageUrl;
      adaptedImages = images.adaptedImages;

      job = attachImagesToJob(job, masterImageUrl, {
        master: buildMasterImagePrompt(selected.brief),
      });
      job = attachLayoutAdaptationToJob(job, adaptedImages);
    } catch (error) {
      console.error("Image generation failed:", error);
      onProgress?.("Image generation unavailable. Template renderer will be used.");
      job = blockImagesOnJob(job, "Image generation failed");
      imagesBlocked = true;
    }
  } else if (!gateApproved) {
    onProgress?.("Production gate blocked image generation. Copy and strategy available.");
    job = blockImagesOnJob(job, "Variation gate did not approve production");
  }

  job = completeJob(job);
  onJobUpdate?.(job);

  return {
    job,
    brief: strategyBrief,
    originalBrief,
    review,
    strategyApproved,
    strategyReviewHistory: strategyHistory,
    finalStrategyRationale: finalRationale,
    variations,
    variationGateHistory: gateHistory,
    selectedConcept: selected,
    masterImageUrl,
    adaptedImages,
    imagesBlocked,
  };
}

export async function runCreativeToAds(
  input: CreativeToAdsInput,
  onProgress?: (message: string) => void
): Promise<CreativeToAdsResult> {
  const directorInput: CreativeDirectorInput = {
    contentPillarId: input.contentPillarId,
    assetType: "social-ad",
    platforms: input.platforms,
    generateConceptImages: input.generateConceptImages,
    customRequest: input.customRequest,
  };

  try {
    const pipeline = await runCreativePipeline(directorInput, { onProgress });
    const ads = buildAdsFromCreative(
      input.contentPillarId,
      input.platforms,
      pipeline.selectedConcept.brief,
      pipeline.adaptedImages
    );

    if (!ads.length) throw new Error("No ads produced from creative brief");

    return {
      ads,
      brief: pipeline.brief,
      originalBrief: pipeline.originalBrief,
      review: pipeline.review,
      strategyApproved: pipeline.strategyApproved,
      strategyReviewHistory: pipeline.strategyReviewHistory,
      finalStrategyRationale: pipeline.finalStrategyRationale,
      variations: pipeline.variations,
      variationGateHistory: pipeline.variationGateHistory,
      selectedConcept: pipeline.selectedConcept,
      job: pipeline.job,
      masterImageUrl: pipeline.masterImageUrl,
      imagesBlocked: pipeline.imagesBlocked,
      source: "creative-director",
    };
  } catch (error) {
    console.error("Creative Director pipeline failed, using templates:", error);

    const fallbackBrief = createFallbackBrief(input.contentPillarId);

    return {
      ads: generateAdsFromTemplates({
        contentPillarId: input.contentPillarId,
        platforms: input.platforms,
      }),
      brief: fallbackBrief,
      originalBrief: fallbackBrief,
      review: {
        publishReady: false,
        passed: false,
        scores: { apple: false, stripe: false, mercury: false, ramp: false, blackrock: false, bloomberg: false },
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        requiredChanges: [],
        critique: "Pipeline fell back to templates",
        directorNotes: "Pipeline fell back to templates",
        revisions: [],
        iteration: 0,
      },
      strategyApproved: false,
      strategyReviewHistory: [],
      variations: [],
      variationGateHistory: [],
      selectedConcept: {
        style: "editorial-authority",
        strategy: CONCEPT_STRATEGIES["editorial-authority"],
        brief: fallbackBrief,
        score: 0,
        rationale: "Template fallback",
        strengths: [],
        weaknesses: [],
      },
      source: "template",
      fallback: true,
      message: error instanceof Error ? error.message : "Creative pipeline failed",
    };
  }
}

function createFallbackBrief(contentPillarId: string): CreativeBrief {
  const pillar = ADVISORPILOT_KNOWLEDGE.contentPillars.find((p) => p.id === contentPillarId);

  return {
    id: generateId(),
    brandId: "advisorpilot",
    campaignGoal: pillar?.description ?? "Enterprise campaign",
    campaignType: pillar?.title ?? "Campaign",
    audience: ADVISORPILOT_KNOWLEDGE.targetAudience.join(", "),
    feature: pillar?.title ?? "",
    customerPain: pillar?.transformationBefore ?? "",
    transformation: pillar?.transformationAfter ?? "",
    emotionalGoal: "Trust and authority",
    headline: pillar?.headline ?? "",
    supportingCopy: pillar?.subhead ?? "",
    cta: pillar?.cta ?? "",
    visualConcept: "",
    composition: "",
    typography: "",
    productPlacement: "",
    uiPriority: "",
    spacingSystem: "8-point grid",
    background: "",
    lighting: "",
    colorPalette: [],
    designLanguage: "",
    imagePrompt: "",
    negativePrompt: "",
    reviewChecklist: [],
    assetType: "social-ad",
    version: 0,
    createdAt: new Date().toISOString(),
  };
}
