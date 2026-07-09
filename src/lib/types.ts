export type AssetType =
  | "video"
  | "display-ad"
  | "social-campaign"
  | "influencer"
  | "email"
  | "packaging"
  | "print"
  | "other";

import type { LayoutVariant } from "./ad/visual-config";

export type ReviewStatus = "draft" | "analyzing" | "complete";

export type RiskLevel = "clear" | "caution" | "action-required";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export interface ReviewSubmission {
  id: string;
  title: string;
  brand: string;
  market: string;
  assetType: AssetType;
  files: UploadedFile[];
  claimsDescription: string;
  targetAudience: string;
  launchDate: string;
  notes: string;
  status: ReviewStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Finding {
  id: string;
  category: string;
  title: string;
  summary: string;
  detail: string;
  risk: RiskLevel;
  regulation?: string;
  recommendation: string;
  location?: string;
}

export interface ReviewResult {
  submissionId: string;
  overallRisk: RiskLevel;
  confidence: number;
  summary: string;
  plainLanguageSummary: string;
  findings: Finding[];
  checklist: { label: string; passed: boolean; note?: string }[];
  nextSteps: string[];
}

export const ASSET_TYPES: {
  id: AssetType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "video",
    label: "Video & TV",
    description: "Commercials, pre-roll, streaming ads, video scripts",
    icon: "video",
  },
  {
    id: "display-ad",
    label: "Display & Digital Ads",
    description: "Banner ads, ad cards, paid social units, programmatic",
    icon: "layout",
  },
  {
    id: "social-campaign",
    label: "Social Campaign",
    description: "Organic posts, carousels, stories, brand social content",
    icon: "share",
  },
  {
    id: "influencer",
    label: "Influencer Content",
    description: "Creator posts, UGC, sponsorships, endorsements",
    icon: "users",
  },
  {
    id: "email",
    label: "Email & CRM",
    description: "Newsletters, promotional emails, lifecycle messaging",
    icon: "mail",
  },
  {
    id: "packaging",
    label: "Packaging & Label",
    description: "On-pack claims, inserts, shelf talkers",
    icon: "package",
  },
  {
    id: "print",
    label: "Print & OOH",
    description: "Magazines, direct mail, billboards, retail signage",
    icon: "file",
  },
  {
    id: "other",
    label: "Other Material",
    description: "Press releases, websites, sales sheets, anything else",
    icon: "folder",
  },
];

export const MARKETS = [
  "United States",
  "Canada",
  "European Union",
  "United Kingdom",
  "Australia",
  "Global / Multi-market",
];

export type SocialPlatform = "linkedin" | "instagram" | "x" | "tiktok";

export type AspectRatio = "1:1" | "9:16";

export type PipelinePhase =
  | "generating"
  | "legal_review"
  | "fixing"
  | "approved"
  | "packaging"
  | "ready_to_post"
  | "posted"
  | "failed";

export type CampaignStatus =
  | "draft"
  | "running"
  | "approved"
  | "posted"
  | "failed";

export interface GeneratedAd {
  id: string;
  platform: SocialPlatform;
  aspectRatio: AspectRatio;
  contentPillarId?: string;
  layoutVariant?: LayoutVariant;
  headline: string;
  subhead: string;
  cta: string;
  disclaimer: string;
  /** Raw AI creative output before marketing packaging */
  creativeAssetUrl?: string;
  /** Final marketing-ready asset with logo, disclaimer, QR */
  imageDataUrl?: string;
  width: number;
  height: number;
}

export type {
  CampaignAssetType,
  ConceptVariation,
  CreativeBrief,
  CreativeJob,
  CreativeReviewResult,
  StrategicDirection,
  StrategyReviewAttempt,
  StrategyReviewResult,
  VariationGateAttempt,
  VariationGateResult,
} from "./creative/types";

export interface FixIteration {  iteration: number;
  findings: Finding[];
  headlineBefore: string;
  headlineAfter: string;
  subheadBefore: string;
  subheadAfter: string;
}

export interface CampaignRun {
  id: string;
  brand: "AdvisorPilot";
  contentPillar: string;
  platforms: SocialPlatform[];
  phase: PipelinePhase;
  status: CampaignStatus;
  ads: GeneratedAd[];
  legalReviewId?: string;
  iteration: number;
  fixHistory: FixIteration[];
  caption?: string;
  captionsByPlatform?: Partial<Record<SocialPlatform, string>>;
  hashtags: string[];
  hashtagsByPlatform?: Partial<Record<SocialPlatform, string[]>>;
  qrUrl: string;
  progressMessage?: string;
  creativeBrief?: import("./creative/types").CreativeBrief;
  originalBrief?: import("./creative/types").CreativeBrief;
  creativeReview?: import("./creative/types").CreativeReviewResult;
  strategyApproved?: boolean;
  strategyReviewHistory?: import("./creative/types").StrategyReviewAttempt[];
  finalStrategyRationale?: string;
  conceptVariations?: import("./creative/types").ConceptVariation[];
  visualDiversityReport?: import("./creative/types").VisualDiversityReport;
  variationGateHistory?: import("./creative/types").VariationGateAttempt[];
  selectedConcept?: import("./creative/types").ConceptVariation;
  creativeJob?: import("./creative/types").CreativeJob;
  masterImageUrl?: string;
  imagesBlocked?: boolean;
  creativePipelineStep?: import("./creative/types").CreativePipelineStep;
  adaptedImages?: Partial<Record<AspectRatio, string>>;
  selectionRationale?: string;
  createdAt: string;
  completedAt?: string;
  postedAt?: string;
  postResults?: Partial<Record<SocialPlatform, { success: boolean; message: string }>>;
  /** When true, generates AI preview images for every concept (expensive). */
  generateConceptImages?: boolean;
  generationCost?: import("./openai/cost-tracker").GenerationCostReport;
}

export const SOCIAL_PLATFORMS: {
  id: SocialPlatform;
  label: string;
  description: string;
  aspectRatios: AspectRatio[];
  hashtagLimit: number;
  charLimit: number;
}[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Professional network for RIAs and wealth managers",
    aspectRatios: ["1:1"],
    hashtagLimit: 5,
    charLimit: 3000,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Feed posts and Stories for visual brand content",
    aspectRatios: ["1:1", "9:16"],
    hashtagLimit: 15,
    charLimit: 2200,
  },
  {
    id: "x",
    label: "X (Twitter)",
    description: "Short-form updates and industry conversation",
    aspectRatios: ["1:1"],
    hashtagLimit: 3,
    charLimit: 280,
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Vertical video and image content for reach",
    aspectRatios: ["9:16"],
    hashtagLimit: 8,
    charLimit: 2200,
  },
];
