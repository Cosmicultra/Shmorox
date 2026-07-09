import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";

/**
 * Brand DNA is the foundation layer. Every creative asset inherits from it.
 * This is the moat — reusable across agencies, brands, and asset types.
 */
export interface BrandDNA {
  brandId: string;
  brand: string;
  brandMark: string;
  voice: string;
  positioning: string;
  audience: string[];
  typography: {
    headline: string;
    body: string;
    mono: string;
  };
  colors: {
    primaryNavy: string;
    primaryBlue: string;
    white: string;
    slate: string;
    softGray: string;
    accent?: string;
  };
  visualLanguage: string[];
  avoid: string[];
  competitors: string[];
  approvedPhrases: string[];
  prohibitedClaims: string[];
  logoPath: string;
  approvedWorkExamples: string[];
}

export const ADVISORPILOT_BRAND_DNA: BrandDNA = {
  brandId: "advisorpilot",
  brand: "AdvisorPilot",
  brandMark: ADVISORPILOT_KNOWLEDGE.brandMark,
  voice: "McKinsey meets Apple. Short, confident, editorial. Fiduciary-aware. Never hype-driven.",
  positioning:
    "Enterprise workflow software for independent RIAs. Wirehouse-grade discipline without wirehouse infrastructure.",
  audience: ADVISORPILOT_KNOWLEDGE.targetAudience,
  typography: {
    headline: "Fraunces — editorial serif for headlines",
    body: "Inter — clean sans for supporting copy",
    mono: "JetBrains Mono — data and technical elements",
  },
  colors: {
    primaryNavy: ADVISORPILOT_KNOWLEDGE.visualTokens.navy,
    primaryBlue: ADVISORPILOT_KNOWLEDGE.visualTokens.blue,
    white: "#FFFFFF",
    slate: "#64748B",
    softGray: ADVISORPILOT_KNOWLEDGE.visualTokens.mist,
    accent: ADVISORPILOT_KNOWLEDGE.visualTokens.accent,
  },
  visualLanguage: [
    "navy and white premium enterprise palette",
    "consistent typography families — composition varies per archetype",
    "real product interfaces when archetype calls for UI",
    "soft paper texture backgrounds",
    "ambient premium lighting",
    "8-point grid spacing",
    "editorial hierarchy",
    "high information density with restraint",
  ],
  avoid: [
    "crypto aesthetics",
    "cheap SaaS graphics",
    "stock photography",
    "fake dashboards",
    "Canva templates",
    "startup landing page layouts",
    "generic Tailwind cards",
    "neon colors",
    "cartoon illustrations",
    "exaggerated gradients",
    "buzzword-heavy copy",
    "AI-generated aesthetic",
  ],
  competitors: [
    "Generic RIA CRM tools",
    "Spreadsheet-based review prep",
    "Wirehouse proprietary systems",
    "Consumer fintech apps",
  ],
  approvedPhrases: ADVISORPILOT_KNOWLEDGE.approvedPhrases,
  prohibitedClaims: ADVISORPILOT_KNOWLEDGE.prohibitedClaims,
  logoPath: ADVISORPILOT_KNOWLEDGE.logoPath,
  approvedWorkExamples: [
    "Apple product launch pages — typography as hero",
    "Stripe editorial blog headers — clean data presentation",
    "Mercury product screenshots — real UI, premium shadows",
    "Bloomberg terminal aesthetics — institutional authority",
    "McKinsey insight reports — restrained executive tone",
  ],
};

const BRAND_REGISTRY: Record<string, BrandDNA> = {
  advisorpilot: ADVISORPILOT_BRAND_DNA,
};

export function getBrandDNA(brandId = "advisorpilot"): BrandDNA {
  return BRAND_REGISTRY[brandId] ?? ADVISORPILOT_BRAND_DNA;
}

export function getBrandDNAContextBlock(dna: BrandDNA): string {
  return `BRAND DNA (every asset must inherit this):

Brand: ${dna.brandMark}
Voice: ${dna.voice}
Positioning: ${dna.positioning}
Audience: ${dna.audience.join(", ")}

Typography:
- Headlines: ${dna.typography.headline}
- Body: ${dna.typography.body}
- Data: ${dna.typography.mono}

Colors:
- Navy: ${dna.colors.primaryNavy}
- Blue: ${dna.colors.primaryBlue}
- White: ${dna.colors.white}
- Slate: ${dna.colors.slate}
- Soft Gray: ${dna.colors.softGray}

Visual Language:
${dna.visualLanguage.map((v) => `- ${v}`).join("\n")}

NEVER use:
${dna.avoid.map((a) => `- ${a}`).join("\n")}

Competitive differentiation (we are NOT):
${dna.competitors.map((c) => `- ${c}`).join("\n")}

Approved phrases:
${dna.approvedPhrases.map((p) => `- ${p}`).join("\n")}

Prohibited claims:
${dna.prohibitedClaims.map((p) => `- ${p}`).join("\n")}

Quality references:
${dna.approvedWorkExamples.map((e) => `- ${e}`).join("\n")}`;
}
