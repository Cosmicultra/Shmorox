import { CONCEPT_STYLES, CONCEPT_STRATEGIES } from "./types";
import type { LayoutArchetypeId } from "./layout-archetypes";
import { getLayoutArchetypeBlock } from "./layout-archetypes";
import { buildExplorationInputContext } from "./prompt-context";
import type { ConceptStyle, CreativeDirectorInput } from "./types";

export const EXPLORATION_SYSTEM = `You are the Executive Creative Director for AdvisorPilot enterprise marketing.

Your job in ONE response:
1. Build a campaign brief
2. Critique it honestly (senior creative director notes)
3. Approve or reject strategic direction
4. Develop THREE distinct text-only concept directions
5. Score each concept and select the winner
6. Gate production readiness before any image generation

Rules:
- Enterprise tone: McKinsey meets Apple. No hype, no Canva energy.
- Each concept MUST use its assigned layout archetype — composition must differ.
- Concepts are TEXT ONLY — no image generation.
- Be direct in critique and verdicts.
- Return valid JSON only. No markdown.`;

export function buildExplorationUserPrompt(
  input: CreativeDirectorInput,
  archetypes: LayoutArchetypeId[]
): string {
  const context = buildExplorationInputContext(input);

  const conceptBlocks = CONCEPT_STYLES.map((style, i) => {
    const strategy = CONCEPT_STRATEGIES[style];
    const archetype = archetypes[i];
    return `### ${style}
Strategy: ${strategy.name} — ${strategy.goal}
Layout archetype (required): ${archetype}
${getLayoutArchetypeBlock(archetype)}`;
  }).join("\n\n");

  return `Run the full Phase 1 exploration for this campaign.

${context}

Develop exactly 3 concepts with these strategy + layout pairings:
${conceptBlocks}

Return JSON in exactly this shape:
{
  "brief": {
    "campaignGoal": "...",
    "campaignType": "...",
    "audience": "...",
    "feature": "...",
    "customerPain": "...",
    "transformation": "...",
    "emotionalGoal": "...",
    "headline": "...",
    "supportingCopy": "...",
    "cta": "...",
    "visualConcept": "...",
    "composition": "...",
    "typography": "...",
    "productPlacement": "...",
    "uiPriority": "...",
    "spacingSystem": "8-point grid",
    "background": "...",
    "lighting": "...",
    "colorPalette": ["Primary Navy", "Primary Blue", "White", "Slate", "Soft Gray"],
    "designLanguage": "...",
    "layoutArchetype": "...",
    "visualComposition": {
      "layoutArchetype": "...",
      "visualHierarchy": "...",
      "compositionStyle": "...",
      "heroElement": "...",
      "supportingElements": ["..."],
      "typographyTreatment": "...",
      "imageUiUsage": "...",
      "negativeSpaceStrategy": "..."
    },
    "imagePrompt": "...",
    "negativePrompt": "...",
    "reviewChecklist": ["..."]
  },
  "critique": {
    "publish_ready": true,
    "overallScore": 85,
    "scores": { "apple": true, "stripe": true, "mercury": true, "ramp": true, "blackrock": true, "bloomberg": true },
    "strengths": ["..."],
    "weaknesses": ["..."],
    "required_changes": [],
    "critique": "...",
    "director_notes": "..."
  },
  "strategyApproved": true,
  "strategyRationale": "One paragraph strategic verdict",
  "concepts": [
    {
      "style": "editorial-authority",
      "layoutArchetype": "${archetypes[0]}",
      "headline": "...",
      "supportingCopy": "...",
      "cta": "...",
      "visualConcept": "...",
      "composition": "...",
      "typography": "...",
      "productPlacement": "...",
      "uiPriority": "...",
      "background": "...",
      "lighting": "...",
      "colorPalette": ["..."],
      "designLanguage": "...",
      "imagePrompt": "...",
      "negativePrompt": "...",
      "visualComposition": { "layoutArchetype": "${archetypes[0]}", "visualHierarchy": "...", "compositionStyle": "...", "heroElement": "...", "supportingElements": ["..."], "typographyTreatment": "...", "imageUiUsage": "...", "negativeSpaceStrategy": "..." }
    }
  ],
  "scores": [
    { "style": "editorial-authority", "score": 85, "rationale": "...", "strengths": ["..."], "weaknesses": ["..."] },
    { "style": "product-demonstration", "score": 80, "rationale": "...", "strengths": ["..."], "weaknesses": ["..."] },
    { "style": "emotional-pain", "score": 78, "rationale": "...", "strengths": ["..."], "weaknesses": ["..."] }
  ],
  "selectedStyle": "editorial-authority",
  "selectionRationale": "Why this concept wins",
  "productionApproved": true,
  "productionVerdict": "Ready for single master image generation"
}

CRITICAL: Use exact style IDs in concepts[].style, scores[].style, and selectedStyle:
editorial-authority | product-demonstration | emotional-pain`;
}

export interface RawExplorationConcept {
  style?: string;
  layoutArchetype?: string;
  headline?: string;
  supportingCopy?: string;
  cta?: string;
  visualConcept?: string;
  composition?: string;
  typography?: string;
  productPlacement?: string;
  uiPriority?: string;
  background?: string;
  lighting?: string;
  colorPalette?: string[];
  designLanguage?: string;
  imagePrompt?: string;
  negativePrompt?: string;
  visualComposition?: import("./types").VisualComposition;
}

export interface RawExplorationScore {
  style?: string;
  score?: number;
  rationale?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface RawExplorationResponse {
  brief?: import("./director-prompts").RawCreativeBriefResponse;
  critique?: import("./review-prompts").RawCreativeReviewResponse;
  strategyApproved?: boolean | string;
  strategy_approved?: boolean | string;
  strategyRationale?: string;
  strategy_rationale?: string;
  concepts?: RawExplorationConcept[];
  scores?: RawExplorationScore[];
  selectedStyle?: string;
  selected_style?: string;
  selectionRationale?: string;
  selection_rationale?: string;
  productionApproved?: boolean | string;
  production_approved?: boolean | string;
  productionVerdict?: string;
  production_verdict?: string;
}

export function normalizeRawExplorationResponse(
  raw: RawExplorationResponse
): RawExplorationResponse {
  const scores = (raw.scores ?? []).map((entry, index) => {
    const loose = entry as RawExplorationScore & { concept_style?: string };
    return {
      ...entry,
      style: entry.style ?? loose.concept_style ?? CONCEPT_STYLES[index],
      score: coerceExplorationScore(entry.score),
    };
  });

  return {
    ...raw,
    strategyApproved: raw.strategyApproved ?? raw.strategy_approved,
    strategyRationale: raw.strategyRationale ?? raw.strategy_rationale,
    selectedStyle: raw.selectedStyle ?? raw.selected_style,
    selectionRationale: raw.selectionRationale ?? raw.selection_rationale,
    productionApproved: raw.productionApproved ?? raw.production_approved,
    productionVerdict: raw.productionVerdict ?? raw.production_verdict,
    scores,
    concepts: raw.concepts?.map((concept, index) => {
      const loose = concept as RawExplorationConcept & { concept_style?: string };
      return {
        ...concept,
        style: concept.style ?? loose.concept_style ?? CONCEPT_STYLES[index],
      };
    }),
  };
}

export function normalizeConceptStyle(value?: string): ConceptStyle | undefined {
  if (!value) return undefined;

  const slug = value
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/--+/g, "-")
    .trim();

  if (CONCEPT_STYLES.includes(slug as ConceptStyle)) {
    return slug as ConceptStyle;
  }

  for (const style of CONCEPT_STYLES) {
    if (slug.includes(style) || style.includes(slug)) {
      return style;
    }
  }

  const keywords: Array<{ match: string[]; style: ConceptStyle }> = [
    { match: ["editorial", "authority"], style: "editorial-authority" },
    { match: ["product", "demonstration", "demo"], style: "product-demonstration" },
    { match: ["emotional", "pain"], style: "emotional-pain" },
  ];

  for (const { match, style } of keywords) {
    if (match.some((word) => slug.includes(word))) {
      return style;
    }
  }

  for (const style of CONCEPT_STYLES) {
    const nameSlug = CONCEPT_STRATEGIES[style].name.toLowerCase().replace(/\s+/g, "-");
    if (slug.includes(nameSlug) || nameSlug.includes(slug)) {
      return style;
    }
  }

  return undefined;
}

export function parseExplorationBoolean(
  value: boolean | string | undefined,
  fallback: boolean
): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

export function coerceExplorationScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(Math.max(0, Math.min(100, value)));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed)) {
      return Math.round(Math.max(0, Math.min(100, parsed)));
    }
  }
  return 0;
}
