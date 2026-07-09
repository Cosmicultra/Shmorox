import type { SocialPlatform } from "../types";
import { sanitizeNoEmDash } from "./content-guardrails";

interface HashtagTier {
  tier: number;
  label: string;
  tags: string[];
}

const HASHTAG_TIERS: HashtagTier[] = [
  {
    tier: 1,
    label: "Brand",
    tags: ["AdvisorPilot", "BuiltByAdvisors"],
  },
  {
    tier: 2,
    label: "Industry",
    tags: [
      "RIA",
      "WealthManagement",
      "FinancialAdvisor",
      "IndependentAdvisor",
      "FinancialPlanning",
      "WealthTech",
    ],
  },
  {
    tier: 3,
    label: "Topic",
    tags: [
      "PortfolioReview",
      "FinTech",
      "AdvisorTech",
      "ClientReview",
      "ProspectMeeting",
      "StatementAnalysis",
      "RIAtech",
    ],
  },
  {
    tier: 4,
    label: "Reach",
    tags: [
      "Investing",
      "PersonalFinance",
      "FinancialServices",
      "BusinessGrowth",
      "Productivity",
      "WorkflowAutomation",
      "AIforAdvisors",
    ],
  },
];

const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  linkedin: 5,
  instagram: 15,
  x: 3,
  tiktok: 8,
};

const PLATFORM_PREFERRED: Record<SocialPlatform, string[]> = {
  linkedin: ["RIA", "WealthManagement", "AdvisorTech", "FinancialAdvisor", "AdvisorPilot"],
  instagram: [
    "AdvisorPilot",
    "BuiltByAdvisors",
    "RIA",
    "WealthManagement",
    "FinTech",
    "AdvisorTech",
    "PortfolioReview",
    "FinancialAdvisor",
    "WealthTech",
    "ClientReview",
    "ProspectMeeting",
    "StatementAnalysis",
    "FinancialPlanning",
    "Investing",
    "AIforAdvisors",
  ],
  x: ["AdvisorPilot", "RIA", "WealthTech"],
  tiktok: [
    "AdvisorPilot",
    "RIA",
    "WealthManagement",
    "FinTech",
    "AdvisorTech",
    "FinancialAdvisor",
    "PortfolioReview",
    "AIforAdvisors",
  ],
};

export function getHashtagsForPlatform(platform: SocialPlatform): string[] {
  const limit = PLATFORM_LIMITS[platform];
  const preferred = PLATFORM_PREFERRED[platform];
  const selected = preferred.slice(0, limit);
  return selected.map((tag) => sanitizeNoEmDash(`#${tag}`));
}

export function getHashtagsForPlatforms(
  platforms: SocialPlatform[]
): Record<SocialPlatform, string[]> {
  const result = {} as Record<SocialPlatform, string[]>;
  for (const platform of platforms) {
    result[platform] = getHashtagsForPlatform(platform);
  }
  return result;
}

export function formatHashtagsForCaption(hashtags: string[]): string {
  return hashtags.join(" ");
}

export function getAllHashtagTiers(): HashtagTier[] {
  return HASHTAG_TIERS;
}

export function getBestHashtagsSummary(platforms: SocialPlatform[]): string {
  const counts = platforms.map((p) => {
    const limit = PLATFORM_LIMITS[p];
    return `${p}: ${limit} hashtags`;
  });
  return counts.join(" · ");
}
