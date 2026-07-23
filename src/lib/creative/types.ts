import type { AspectRatio } from "../types";
import type { BrandDNA } from "./brand-dna";
import type { LayoutArchetypeId } from "./layout-archetypes";

export type { LayoutArchetypeId } from "./layout-archetypes";

export type ConceptStyle =
  | "editorial-authority"
  | "product-demonstration"
  | "emotional-pain";

export const CONCEPT_STYLES: ConceptStyle[] = [
  "editorial-authority",
  "product-demonstration",
  "emotional-pain",
];

export interface ConceptStrategy {
  id: ConceptStyle;
  name: string;
  inspiration: string;
  goal: string;
  visualDirection: string;
  sampleHeadline: string;
}

export const CONCEPT_STRATEGIES: Record<ConceptStyle, ConceptStrategy> = {
  "editorial-authority": {
    id: "editorial-authority",
    name: "Editorial Authority",
    inspiration: "McKinsey / Bloomberg",
    goal: "Build trust and institutional credibility",
    visualDirection:
      "Clean typography, data visualization, executive feel. Large editorial headlines. Minimal UI. Typography dominates at 60%+.",
    sampleHeadline:
      "Most advisors don't have a technology problem. They have a process problem.",
  },
  "product-demonstration": {
    id: "product-demonstration",
    name: "Product Demonstration",
    inspiration: "Stripe / Mercury",
    goal: "Drive demos by showing the machine",
    visualDirection:
      "Real UI screenshots, workflows, before/after states. Software is the hero at 35-40%. Typography supports the product story.",
    sampleHeadline: "Statement in. Materials out.",
  },
  "emotional-pain": {
    id: "emotional-pain",
    name: "Emotional Pain",
    inspiration: "Problem agitation / conversion",
    goal: "Create urgency through recognized advisor pain",
    visualDirection:
      "Advisor overwhelmed by tabs, client review stress, operational chaos. Emotional contrast with calm AdvisorPilot solution. Never melodramatic.",
    sampleHeadline: "Your best asset in a prospect meeting is you, not hours of prep.",
  },
};

/** Reusable across social, email, print, conference, and other enterprise assets. */
export type CampaignAssetType =
  | "social-ad"
  | "feature-launch"
  | "product-announcement"
  | "blog-graphic"
  | "email-header"
  | "webinar-banner"
  | "landing-hero"
  | "conference-asset"
  | "print-collateral";

export const CAMPAIGN_ASSET_TYPES: {
  id: CampaignAssetType;
  label: string;
  description: string;
}[] = [
  { id: "social-ad", label: "Social Ad", description: "Organic and paid social units" },
  { id: "feature-launch", label: "Feature Launch", description: "New capability announcements" },
  { id: "product-announcement", label: "Product Announcement", description: "Major product updates" },
  { id: "blog-graphic", label: "Blog Graphic", description: "Editorial blog headers and inline art" },
  { id: "email-header", label: "Email Header", description: "Newsletter and campaign email heroes" },
  { id: "webinar-banner", label: "Webinar Banner", description: "Event registration and reminder assets" },
  { id: "landing-hero", label: "Landing Hero", description: "Website hero sections and above-the-fold art" },
  { id: "conference-asset", label: "Conference Asset", description: "Booth graphics and event collateral" },
  { id: "print-collateral", label: "Print Collateral", description: "Brochures, one-pagers, and leave-behinds" },
];

/** Per-concept layout system — varies per execution while brand stays fixed. */
export interface VisualComposition {
  layoutArchetype: LayoutArchetypeId;
  visualHierarchy: string;
  compositionStyle: string;
  heroElement: string;
  supportingElements: string[];
  typographyTreatment: string;
  imageUiUsage: string;
  negativeSpaceStrategy: string;
}

/** Single source of truth for every creative output. */
export interface CreativeBrief {
  id: string;
  brandId: string;
  campaignGoal: string;
  campaignType: string;
  audience: string;
  feature: string;
  customerPain: string;
  transformation: string;
  emotionalGoal: string;
  headline: string;
  supportingCopy: string;
  cta: string;
  visualConcept: string;
  composition: string;
  typography: string;
  productPlacement: string;
  uiPriority: string;
  spacingSystem: string;
  background: string;
  lighting: string;
  colorPalette: string[];
  designLanguage: string;
  imagePrompt: string;
  negativePrompt: string;
  reviewChecklist: string[];
  assetType: CampaignAssetType;
  conceptStyle?: ConceptStyle;
  layoutArchetype?: LayoutArchetypeId;
  visualComposition?: VisualComposition;
  version: number;
  createdAt: string;
}

export interface CreativeReviewScores {
  apple: boolean;
  stripe: boolean;
  mercury: boolean;
  ramp: boolean;
  blackrock: boolean;
  bloomberg: boolean;
}

/** Senior Creative Director critique — opinionated notes, not a binary gate. */
export interface CreativeReviewResult {
  publishReady: boolean;
  /** @deprecated Use publishReady */
  passed: boolean;
  overallScore: number;
  scores: CreativeReviewScores;
  strengths: string[];
  weaknesses: string[];
  requiredChanges: string[];
  critique: string;
  directorNotes: string;
  /** @deprecated Use requiredChanges */
  revisions: string[];
  iteration: number;
}

export interface ConceptVariation {
  style: ConceptStyle;
  strategy: ConceptStrategy;
  brief: CreativeBrief;
  layoutArchetype?: LayoutArchetypeId;
  visualComposition?: VisualComposition;
  score: number;
  rationale: string;
  strengths: string[];
  weaknesses: string[];
}

export interface PairwiseSimilarity {
  conceptA: ConceptStyle;
  conceptB: ConceptStyle;
  layoutSimilarity: number;
  headlinePlacementSimilarity: number;
  visualStructureSimilarity: number;
  dominantObjectSimilarity: number;
  overallSimilarity: number;
  tooSimilar: boolean;
}

export interface VisualDiversityReport {
  pairwise: PairwiseSimilarity[];
  visualDiversityScore: number;
  approved: boolean;
  rejectionReasons: string[];
}

export interface StrategicDirection {
  name: string;
  headline: string;
  positioningAngle: string;
  rationale: string;
  whyStronger: string;
}

export interface StrategyEvaluation {
  differentiated: boolean;
  messageStrength: boolean;
  curiosityOrUrgency: boolean;
  premiumEnterpriseWorthy: boolean;
  positioningClear: boolean;
  painPointStrong: boolean;
  hasStrategicReason: boolean;
}

/** Strategic gatekeeper review before concept variations or images. */
export interface StrategyReviewResult {
  approved: boolean;
  overallScore: number;
  evaluation: StrategyEvaluation;
  rejectionReasons: string[];
  strategicGap: string;
  strongerDirections: StrategicDirection[];
  recommendedPositioningAngle: string;
  directorVerdict: string;
  iteration: number;
}

export interface StrategyReviewAttempt {
  iteration: number;
  briefSnapshot: CreativeBrief;
  result: StrategyReviewResult;
  improvedDirections: StrategicDirection[];
}

/** Final gate before image production — validates scored concept strategies. */
export interface VariationGateResult {
  approved: boolean;
  topScore: number;
  rejectionReasons: string[];
  strategicGap: string;
  strongerDirections: StrategicDirection[];
  recommendedPositioningAngle: string;
  directorVerdict: string;
  selectedConcept?: ConceptVariation;
}

export interface VariationGateAttempt {
  iteration: number;
  variations: ConceptVariation[];
  result: VariationGateResult;
}

export interface CreativeDirectorInput {
  brandId?: string;
  contentPillarId?: string;
  assetType: CampaignAssetType;
  campaignType?: string;
  audience?: string;
  platforms?: import("../types").SocialPlatform[];
  customBrief?: Partial<CreativeBrief>;
  /** Freeform topic/angle for custom-request campaigns */
  customRequest?: string;
  /** Expensive: generate AI images for all concepts before selection. Default false. */
  generateConceptImages?: boolean;
}

export type CreativeJobStatus =
  | "pending"
  | "brand_dna"
  | "exploration"
  | "concept_selection"
  | "images"
  | "adaptation"
  | "packaging"
  | "complete"
  | "failed"
  /** @deprecated legacy statuses for resumed jobs */
  | "brief"
  | "review"
  | "strategy_review"
  | "variations"
  | "variation_gate";

export type PipelineStageStatus = "pending" | "running" | "complete" | "failed" | "skipped";

export interface CreativePipelineStage {
  id: string;
  label: string;
  status: PipelineStageStatus;
  message?: string;
  completedAt?: string;
}

export interface CreativeJob {
  id: string;
  assetType: CampaignAssetType;
  campaignType: string;
  brandId: string;
  status: CreativeJobStatus;
  stages: CreativePipelineStage[];
  brandDna?: BrandDNA;
  brief?: CreativeBrief;
  review?: CreativeReviewResult;
  strategyApproved?: boolean;
  strategyReviewHistory?: StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  originalBrief?: CreativeBrief;
  variationGateHistory?: VariationGateAttempt[];
  concepts?: ConceptVariation[];
  selectedConcept?: ConceptVariation;
  selectionRationale?: string;
  creativeAssets?: Partial<Record<AspectRatio, string>>;
  marketingAssets?: Partial<Record<AspectRatio, string>>;
  masterImageUrl?: string;
  imagePrompts?: {
    master?: string;
    adaptations?: Partial<Record<AspectRatio, string>>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreativePipelineResult {
  job: CreativeJob;
  brief: CreativeBrief;
  originalBrief: CreativeBrief;
  review: CreativeReviewResult;
  strategyApproved: boolean;
  strategyReviewHistory: StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  variations: ConceptVariation[];
  variationGateHistory: VariationGateAttempt[];
  selectedConcept: ConceptVariation;
  masterImageUrl?: string;
  adaptedImages: Partial<Record<AspectRatio, string>>;
  imagesBlocked?: boolean;
}

export interface CreativePipelineCallbacks {
  onProgress?: (message: string) => void;
  onJobUpdate?: (job: CreativeJob) => void;
  onCheckpoint?: (checkpoint: CreativePipelineCheckpoint) => void;
}

/** Tracks resumable progress through the client-side creative pipeline. */
export type CreativePipelineStep =
  | "pending"
  | "exploration"
  | "premium_revision"
  | "images"
  | "complete"
  /** @deprecated legacy steps — mapped to exploration on resume */
  | "brief"
  | "review"
  | "strategy"
  | "variations"
  | "variation_gate";

export interface CreativePipelineCheckpoint {
  step: CreativePipelineStep;
  originalBrief?: CreativeBrief;
  creativeBrief?: CreativeBrief;
  creativeReview?: CreativeReviewResult;
  strategyApproved?: boolean;
  strategyReviewHistory?: StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  conceptVariations?: ConceptVariation[];
  visualDiversityReport?: VisualDiversityReport;
  variationGateHistory?: VariationGateAttempt[];
  selectedConcept?: ConceptVariation;
  selectionRationale?: string;
  masterImageUrl?: string;
  adaptedImages?: Partial<Record<AspectRatio, string>>;
  imagesBlocked?: boolean;
  creativeJob?: CreativeJob;
  generationCost?: import("../openai/cost-tracker").GenerationCostReport;
}
