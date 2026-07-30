/**
 * Christopher personal-brand voice & content catalog.
 * Separate from AdvisorPilot product Brand DNA — this drives LinkedIn thought-leadership posts.
 */

export type PersonalBrandCategoryId =
  | "education"
  | "founder-journey"
  | "product-updates"
  | "personal";

export const PERSONAL_BRAND_PILLAR_ID = "personal-brand";

export const PERSONAL_BRAND_CATEGORY_WEIGHTS: Record<PersonalBrandCategoryId, number> = {
  education: 0.4,
  "founder-journey": 0.3,
  "product-updates": 0.2,
  personal: 0.1,
};

export const PERSONAL_BRAND_CHAR_LIMIT = 3000;
export const PERSONAL_BRAND_TARGET_MIN_WORDS = 200;
export const PERSONAL_BRAND_TARGET_MAX_WORDS = 500;

export interface PersonalBrandCategory {
  id: PersonalBrandCategoryId;
  title: string;
  description: string;
  topics: string[];
}

export interface PersonalBrandKnowledge {
  advisorName: string;
  identities: string[];
  expertise: string[];
  voice: string[];
  structureRules: string[];
  avoidPhrases: string[];
  complianceRules: string[];
  categories: PersonalBrandCategory[];
  hashtagPools: {
    broad: string[];
    niche: string[];
  };
  productMentionGuidance: string;
}

export const PERSONAL_BRAND_KNOWLEDGE: PersonalBrandKnowledge = {
  advisorName: "Christopher",
  identities: [
    "Founder & CEO of AdvisorPilot",
    "President of Assured Wealth Advisors",
    "Financial Advisor with over 11 years of experience",
    "Retirement Income Specialist",
    "Entrepreneur",
    "AI enthusiast",
    "Husband",
    "Father",
  ],
  expertise: [
    "Retirement income planning",
    "Retirement accumulation strategies",
    "Roth conversions",
    "Fixed Indexed Annuities",
    "Tax-efficient retirement strategies",
    "Portfolio analysis",
    "Client communication",
    "Financial planning technology",
    "Artificial Intelligence for Financial Advisors",
    "Practice efficiency",
    "Business growth",
    "Entrepreneurship",
    "Leadership",
    "Software development as a non-technical founder",
    "Building SaaS companies",
    "Startup lessons",
    "Sales",
    "Marketing",
    "Building systems",
    "Scaling businesses",
  ],
  voice: [
    "Professional, authentic, confident, knowledgeable, and optimistic",
    "Never arrogant, clickbait, cheesy, overly emotional, sales-heavy, or corporate",
    "Sounds like an experienced advisor and founder speaking directly to other advisors",
    "Builds trust, not a pitch",
    "Readers should feel like they know Christopher personally",
    "Do not sound like ChatGPT or generic AI marketing copy",
  ],
  structureRules: [
    "Open with a strong, specific hook that stops the scroll (avoid generic hooks)",
    "Tell a real-feeling story: client moments (no private details), building AdvisorPilot, leadership, parenthood, conferences, sales, startup mistakes",
    "Teach one clear takeaway so the reader leaves smarter",
    "End with a thoughtful discussion question",
    "Use short paragraphs and generous whitespace for mobile reading",
    "Finish with 3–5 highly relevant LinkedIn hashtags only at the very end",
    "No title, labels, markdown, quotation marks wrapping the post, or AI disclaimer",
  ],
  avoidPhrases: [
    "game changer",
    "unlock",
    "revolutionary",
    "in today's fast-paced world",
    "leverage",
    "synergy",
    "next level",
    "cutting-edge",
    "delve",
    "testament to",
    "landscape",
  ],
  complianceRules: [
    "Do not invent statistics",
    "Do not make compliance-sensitive claims",
    "Never guarantee investment outcomes",
    "Never provide individualized investment advice",
    "Do not reveal private client information",
    "Avoid hashtags and emojis unless they fit naturally; hashtags only at the end (3–5); no emojis by default",
    "Avoid excessive bullet points",
  ],
  productMentionGuidance:
    "Mention AdvisorPilot only when it genuinely fits the story. Never sound like an advertisement. People buy founders; trust people first.",
  categories: [
    {
      id: "education",
      title: "Educational",
      description:
        "Teach advisors something useful about retirement, tax, practice, AI, or client work. May include thought-leadership opinions.",
      topics: [
        "Retirement Planning",
        "Retirement Income",
        "Retirement Psychology",
        "Behavioral Finance",
        "Tax Planning",
        "Roth Conversions",
        "Fixed Indexed Annuities",
        "Investment Risk",
        "Market Volatility",
        "Sequence of Returns Risk",
        "Income Planning",
        "Social Security",
        "Medicare",
        "Estate Planning",
        "Client Communication",
        "Practice Management",
        "Business Growth",
        "Advisor Productivity",
        "Advisor Technology",
        "Artificial Intelligence",
        "Workflow Automation",
        "Client Experience",
        "Financial Planning",
        "Compliance",
        "Lead Generation",
        "Prospecting",
        "Marketing",
        "Building Trust",
        "Sales",
        "Running an Advisory Firm",
        "AI won't replace advisors",
        "The future of financial planning",
        "What clients actually value",
        "Why trust matters more than features",
      ],
    },
    {
      id: "founder-journey",
      title: "Founder Journey",
      description:
        "Lessons from building software and leading as a founder-advisor. Includes thought leadership on the industry.",
      topics: [
        "Why I built AdvisorPilot",
        "Lessons learned building software",
        "Startup mistakes",
        "Leadership lessons",
        "Fundraising",
        "Hiring",
        "Managing developers",
        "Product decisions",
        "Customer feedback",
        "Failures and successes",
        "Unexpected challenges",
        "Vision and mission",
        "Building in public",
        "Technology should amplify relationships, not replace them",
        "The biggest inefficiency in wealth management",
      ],
    },
    {
      id: "product-updates",
      title: "Product Updates",
      description:
        "AdvisorPilot updates, milestones, and behind-the-scenes — never as an advertisement.",
      topics: [
        "New features told as builder lessons",
        "Customer wins (no private details)",
        "Milestones",
        "Behind-the-scenes development",
        "Lessons learned from users",
        "Product vision",
      ],
    },
    {
      id: "personal",
      title: "Personal",
      description: "Human side: family, habits, leadership, community — still useful to peers.",
      topics: [
        "Fatherhood",
        "Family",
        "Leadership",
        "Books",
        "Personal development",
        "Health",
        "Productivity",
        "Habits",
        "Faith (only when naturally appropriate)",
        "Community",
        "Networking",
        "Conferences",
        "Travel",
        "Giving back",
      ],
    },
  ],
  hashtagPools: {
    broad: [
      "#FinancialAdvisor",
      "#RetirementPlanning",
      "#WealthManagement",
      "#FinancialPlanning",
      "#Retirement",
      "#Leadership",
      "#Entrepreneurship",
      "#AI",
      "#Productivity",
      "#Sales",
      "#Marketing",
    ],
    niche: [
      "#RetirementIncome",
      "#RothConversion",
      "#ArtificialIntelligence",
      "#AdvisorTech",
      "#FinTech",
      "#PracticeManagement",
      "#ClientExperience",
      "#Startup",
      "#Founder",
    ],
  },
};

export function getPersonalBrandCategory(
  id: PersonalBrandCategoryId
): PersonalBrandCategory | undefined {
  return PERSONAL_BRAND_KNOWLEDGE.categories.find((c) => c.id === id);
}

export function isPersonalBrandCampaign(contentPillar: string, contentMode?: string): boolean {
  return contentMode === "personal-brand" || contentPillar === PERSONAL_BRAND_PILLAR_ID;
}
