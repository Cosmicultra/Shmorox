import type { CampaignAssetType } from "./types";

export type LayoutArchetypeId =
  | "editorial-cover"
  | "product-spotlight"
  | "data-story"
  | "before-after"
  | "executive-statement"
  | "workflow-visualization"
  | "human-product"
  | "feature-announcement";

export interface LayoutArchetype {
  id: LayoutArchetypeId;
  name: string;
  description: string;
  bestFor: string[];
  visualHierarchy: string;
  compositionStyle: string;
  heroElement: string;
  supportingElements: string[];
  typographyTreatment: string;
  imageUiUsage: string;
  negativeSpaceStrategy: string;
}

export const LAYOUT_ARCHETYPES: Record<LayoutArchetypeId, LayoutArchetype> = {
  "editorial-cover": {
    id: "editorial-cover",
    name: "Editorial Cover",
    description: "Magazine-style cover with dominant headline and minimal supporting elements.",
    bestFor: ["thought leadership", "authority", "brand positioning", "editorial"],
    visualHierarchy: "Headline dominates 55-65%. Supporting line secondary. Logo minimal.",
    compositionStyle: "Asymmetric editorial grid. Headline may span full width or anchor a corner.",
    heroElement: "Large editorial headline typography",
    supportingElements: ["Single supporting line", "Subtle texture or gradient field", "Minimal logo mark"],
    typographyTreatment: "Oversized Fraunces headline. Generous line-height. Optical margin alignment.",
    imageUiUsage: "UI absent or whisper-thin accent only. Typography carries the story.",
    negativeSpaceStrategy: "60%+ negative space. Breathing room is the luxury signal.",
  },
  "product-spotlight": {
    id: "product-spotlight",
    name: "Product Spotlight",
    description: "Real product UI as hero with supporting copy framing the workflow.",
    bestFor: ["demo conversion", "feature clarity", "product proof", "workflow"],
    visualHierarchy: "Product UI 40-50%. Headline 30%. CTA and logo minimal.",
    compositionStyle: "Product surface floating on premium background. Copy wraps or flanks UI.",
    heroElement: "Authentic AdvisorPilot interface screenshot or realistic UI mock",
    supportingElements: ["Headline", "One proof-point line", "Soft shadow depth plane"],
    typographyTreatment: "Headline anchors beside or above product. Inter for supporting copy.",
    imageUiUsage: "Real UI is mandatory hero. Show believable enterprise software.",
    negativeSpaceStrategy: "UI floats in open space. No cramped dashboard collage.",
  },
  "data-story": {
    id: "data-story",
    name: "Data Story",
    description: "Charts, metrics, and insights as the narrative driver.",
    bestFor: ["ROI", "efficiency", "analytics", "performance", "insights"],
    visualHierarchy: "Data visualization 45%. Headline 35%. Context copy 15%.",
    compositionStyle: "Editorial data layout. One hero metric or chart with supporting context.",
    heroElement: "Single compelling chart, metric callout, or insight visualization",
    supportingElements: ["Context headline", "Source line or timeframe", "Subtle grid alignment"],
    typographyTreatment: "Mono accent for numbers. Serif headline. Clean data labels.",
    imageUiUsage: "Data may live inside product UI or as standalone editorial graphic.",
    negativeSpaceStrategy: "Data breathes. No chart junk. One insight per frame.",
  },
  "before-after": {
    id: "before-after",
    name: "Before/After Transformation",
    description: "Problem state versus solution state in deliberate contrast.",
    bestFor: ["pain agitation", "transformation", "efficiency", "workflow change"],
    visualHierarchy: "Split narrative 50/50 or 40/60. Headline bridges both states.",
    compositionStyle: "Diptych, split screen, or sequential panels. Clear visual contrast.",
    heroElement: "Contrast between chaotic before and calm after states",
    supportingElements: ["Bridge headline", "Minimal labels", "Transformation arrow or divider"],
    typographyTreatment: "Headline spans or sits between panels. States labeled sparingly.",
    imageUiUsage: "Before: abstract chaos or stressed workflow. After: clean AdvisorPilot UI.",
    negativeSpaceStrategy: "Each panel has internal breathing room. Divider is intentional.",
  },
  "executive-statement": {
    id: "executive-statement",
    name: "Executive Statement",
    description: "Bold statement with near-minimal design. Maximum conviction, minimum elements.",
    bestFor: ["positioning", "manifesto", "category definition", "thought leadership"],
    visualHierarchy: "Headline 70%+. Everything else whispers.",
    compositionStyle: "Centered or off-center statement on refined surface. Almost no decoration.",
    heroElement: "One unforgettable headline sentence",
    supportingElements: ["Optional single subline", "Logo mark", "Paper texture only"],
    typographyTreatment: "Monumental headline scale. Extreme restraint elsewhere.",
    imageUiUsage: "No UI. Pure typographic authority.",
    negativeSpaceStrategy: "70%+ negative space. Silence is the design.",
  },
  "workflow-visualization": {
    id: "workflow-visualization",
    name: "Workflow Visualization",
    description: "Process diagrams and step flows showing how work moves through the product.",
    bestFor: ["onboarding", "automation", "process", "workflow", "how it works"],
    visualHierarchy: "Process flow 45%. Headline 30%. Step labels 20%.",
    compositionStyle: "Horizontal or vertical step sequence. Connected nodes or stages.",
    heroElement: "3-5 step workflow diagram with product touchpoints",
    supportingElements: ["Outcome headline", "Step micro-labels", "Directional flow cues"],
    typographyTreatment: "Headline frames the process. Steps in concise Inter labels.",
    imageUiUsage: "UI appears at key workflow steps, not as a single static screenshot.",
    negativeSpaceStrategy: "Steps spaced on 8pt grid. Flow lines subtle, not busy.",
  },
  "human-product": {
    id: "human-product",
    name: "Human + Product",
    description: "Professional advisor context combined with product proof.",
    bestFor: ["trust", "relationship", "advisor empowerment", "client meeting"],
    visualHierarchy: "Human context 35%. Product 35%. Headline 25%.",
    compositionStyle: "Lifestyle-professional environment with product inset or overlay.",
    heroElement: "Professional advisor in client-meeting or planning context (no stock-photo feel)",
    supportingElements: ["Product UI inset", "Headline", "Environmental depth"],
    typographyTreatment: "Headline integrated with scene, not pasted on. Editorial crop.",
    imageUiUsage: "Product appears as screen, tablet, or inset. Must look real.",
    negativeSpaceStrategy: "Environmental depth with soft focus. Product inset crisp.",
  },
  "feature-announcement": {
    id: "feature-announcement",
    name: "Feature Announcement",
    description: "Product launch energy with clear new-capability focus.",
    bestFor: ["launch", "new feature", "release", "announcement", "update"],
    visualHierarchy: "Feature UI 40%. Announcement headline 35%. Badge or label 10%.",
    compositionStyle: "Launch poster energy. Feature callout with product reveal.",
    heroElement: "New feature UI with announcement headline treatment",
    supportingElements: ["New or updated label", "Benefit line", "CTA"],
    typographyTreatment: "Announcement headline with launch weight. Feature name highlighted.",
    imageUiUsage: "UI shows the specific new capability in context.",
    negativeSpaceStrategy: "Launch moment clarity. One feature, one frame.",
  },
};

export const ALL_LAYOUT_ARCHETYPE_IDS = Object.keys(LAYOUT_ARCHETYPES) as LayoutArchetypeId[];

const GOAL_ARCHETYPE_SETS: { keywords: string[]; archetypes: LayoutArchetypeId[] }[] = [
  {
    keywords: ["thought leadership", "authority", "editorial", "positioning", "manifesto"],
    archetypes: ["editorial-cover", "executive-statement", "data-story"],
  },
  {
    keywords: ["feature", "launch", "announcement", "release", "new"],
    archetypes: ["feature-announcement", "product-spotlight", "workflow-visualization"],
  },
  {
    keywords: ["demo", "product", "workflow", "how", "show"],
    archetypes: ["product-spotlight", "workflow-visualization", "feature-announcement"],
  },
  {
    keywords: ["pain", "problem", "transform", "before", "efficiency", "chaos"],
    archetypes: ["before-after", "human-product", "executive-statement"],
  },
  {
    keywords: ["data", "roi", "metric", "analytics", "insight", "performance"],
    archetypes: ["data-story", "editorial-cover", "product-spotlight"],
  },
  {
    keywords: ["trust", "credibility", "relationship", "advisor", "client"],
    archetypes: ["human-product", "editorial-cover", "executive-statement"],
  },
];

const DEFAULT_DIVERSE_SET: LayoutArchetypeId[] = [
  "editorial-cover",
  "product-spotlight",
  "before-after",
];

/** Pick 3 distinct layout archetypes suited to the campaign objective. */
export function pickDistinctArchetypes(
  campaignGoal: string,
  assetType?: CampaignAssetType
): LayoutArchetypeId[] {
  const goal = campaignGoal.toLowerCase();
  const asset = assetType?.toLowerCase() ?? "";

  for (const set of GOAL_ARCHETYPE_SETS) {
    if (set.keywords.some((kw) => goal.includes(kw) || asset.includes(kw))) {
      return set.archetypes;
    }
  }

  return DEFAULT_DIVERSE_SET;
}

export function getLayoutArchetype(id: LayoutArchetypeId): LayoutArchetype {
  return LAYOUT_ARCHETYPES[id];
}

export function getLayoutArchetypeBlock(archetypeId: LayoutArchetypeId): string {
  const archetype = getLayoutArchetype(archetypeId);
  return `Layout Archetype: ${archetype.name}
${archetype.description}

Visual Hierarchy: ${archetype.visualHierarchy}
Composition Style: ${archetype.compositionStyle}
Hero Element: ${archetype.heroElement}
Supporting Elements: ${archetype.supportingElements.join(", ")}
Typography Treatment: ${archetype.typographyTreatment}
Image/UI Usage: ${archetype.imageUiUsage}
Negative Space Strategy: ${archetype.negativeSpaceStrategy}`;
}

/** Suggest a different archetype not already used in the set. */
export function pickAlternateArchetype(used: LayoutArchetypeId[]): LayoutArchetypeId {
  const available = ALL_LAYOUT_ARCHETYPE_IDS.filter((id) => !used.includes(id));
  return available[0] ?? "workflow-visualization";
}
