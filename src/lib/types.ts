export type AssetType =
  | "video"
  | "display-ad"
  | "social-campaign"
  | "influencer"
  | "email"
  | "packaging"
  | "print"
  | "other";

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
