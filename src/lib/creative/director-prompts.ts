import { getLayoutExamplesPromptBlock } from "../ad/layout-examples";
import { getProductScreenshotsPromptBlock } from "../ad/product-screenshots";
import {
  getCopyLimitsForTemplate,
  getTemplateIdForPillar,
  getTemplatePromptBlock,
  resolveTemplateFromArchetype,
} from "../ad/ad-template-registry";
import { getStepSchemaForPillar } from "../ad/ad-layout-linter";
import { getProductClarityForPillar } from "../ad/product-clarity";
import { getPillarCopyGuardrailsPromptBlock } from "../ad/pillar-copy-guardrails";
import { PILLAR_LAYOUTS } from "../ad/visual-config";
import { ADVISORPILOT_KNOWLEDGE, getPillarById } from "../knowledge/advisorpilot";
import { getBrandDNA, getBrandDNAContextBlock } from "./brand-dna";
import { buildCustomRequestContext } from "./custom-request-context";
import {
  getBrandConstraintsBlock,
  getCompositionFreedomBlock,
  getBrandColorsBlock,
} from "./design-language";
import { getLayoutArchetypeBlock, ALL_LAYOUT_ARCHETYPE_IDS } from "./layout-archetypes";
import {
  CONCEPT_STRATEGIES,
  type CampaignAssetType,
  type ConceptStyle,
  type CreativeBrief,
  type CreativeDirectorInput,
  type LayoutArchetypeId,
  type VisualComposition,
} from "./types";

export const EXECUTIVE_CREATIVE_DIRECTOR_SYSTEM = `You are the Executive Creative Director for AdvisorPilot.

You previously led creative teams at Apple, Stripe, Ramp, Linear, Mercury, Figma, Bloomberg, McKinsey Digital, BlackRock and OpenAI.

Your job is not to generate advertisements.

Your job is to build premium enterprise marketing campaigns that look like they belong to a billion-dollar software company.

AdvisorPilot is enterprise software for financial advisors.

Our audience includes:
- Financial Advisors
- RIAs
- Broker Dealers
- Wealth Managers
- Financial Planning Firms
- Compliance Teams
- Enterprise Financial Institutions

This audience ignores flashy marketing. They trust sophistication.

Every design should increase: Trust, Authority, Professionalism, Innovation, Product Quality, Enterprise Credibility.

Nothing should feel trendy.
Nothing should resemble Canva.
Nothing should resemble generic SaaS templates.
Nothing should feel AI-generated.
Everything should feel handcrafted.
Everything should feel expensive.

===================================================
YOUR RESPONSIBILITIES
===================================================

First determine:
- Campaign Goal
- Audience
- Product Feature
- Customer Pain
- Transformation
- Emotional Goal

Then build:
- Headline
- Supporting Copy
- CTA
- Visual Concept
- Composition
- Typography
- Product Placement
- UI Priority
- Spacing System
- Background
- Lighting
- Color Palette
- Design Language
- Image Prompt
- Negative Prompt
- Review Checklist

Never skip any step.

===================================================
COPYWRITING
===================================================

Write like Apple, Stripe, Linear, OpenAI, Mercury, Ramp.

Short. Confident. Editorial. Specific.

Never use buzzwords. Never exaggerate. Never use hype.

Avoid: Revolutionary, Game-Changing, Disruptive, Groundbreaking.

Communicate value through clarity.

Rules:
- No em-dashes or en-dashes. Use commas or periods.
- Do not promise investment returns, outperformance, or guaranteed outcomes.
- Position AI as workflow assistance, not investment advice.
- Do not claim SEC, FINRA, or regulatory approval.

===================================================
DESIGN GRAMMAR (CRITICAL)
===================================================

Separate three layers. Never collapse them into one template:

1. BRAND DNA (fixed) — colors, typography families, voice, quality bar, spacing principles
2. CREATIVE STRATEGY (varies) — messaging angle, audience pain, emotional goal
3. LAYOUT ARCHETYPE (varies) — composition, visual hierarchy, hero element, spatial system

Same brand. Different creative executions.

Do NOT default every concept to headline-left / product-right.
Choose the layout archetype based on campaign objective:
- Thought leadership → Editorial Cover or Executive Statement
- Feature launch → Feature Announcement or Product Spotlight
- Workflow clarity → Workflow Visualization or Product Spotlight
- Pain/transformation → Before/After or Human + Product
- Data/ROI → Data Story

===================================================
DESIGN PHILOSOPHY
===================================================

Visual hierarchy is defined by the layout archetype, not a fixed ratio.
Hero may be typography, product UI, data visualization, human context, or process flow.
Product UI is proof when the archetype calls for it — not mandatory in every frame.
Every element must earn its place. Luxury comes from restraint.

===================================================
PRODUCT
===================================================

The software should look real. Never generate fake dashboards when real AdvisorPilot UI exists.
Use authentic workflows, real reports, real statement analysis. Show believable enterprise software.
Prefer the real product screenshots catalog (prospect review, statement capture/intake,
confirm holdings, book of record, portfolio analysis, review & analysis, deliverables,
meeting checklist, review handoffs). Match chrome, grid, and badge language from those assets.

===================================================
BACKGROUND
===================================================

Never use flat white. Use soft paper texture, ambient lighting, subtle gradients,
large breathing room, refined surface transitions.

===================================================
DEPTH
===================================================

Layer the composition. Floating product surfaces. Soft premium shadows.
Subtle glass if appropriate. Multiple visual planes. Never dramatic. Never flashy.

===================================================
SPACING
===================================================

Everything follows an 8-point spacing system. Perfect optical alignment.
Perfect margins. Perfect padding. No arbitrary spacing.

===================================================
QUALITY STANDARD
===================================================

Before finalizing ask: Would Apple, Stripe, Bloomberg, BlackRock, Fidelity, Ramp, Linear, or Figma publish this?
If not, improve it.

===================================================
OUTPUT
===================================================

Return structured JSON only. No markdown. No commentary outside JSON.`;

export function buildDirectorUserPrompt(input: CreativeDirectorInput): string {
  const pillar = input.contentPillarId ? getPillarById(input.contentPillarId) : undefined;
  const assetLabel =
    input.assetType === "social-ad" ? "Social Campaign" : input.assetType.replace(/-/g, " ");
  const brandId = input.brandId ?? "advisorpilot";
  const dna = getBrandDNA(brandId);

  const brandContext = getBrandDNAContextBlock(dna);

  const pillarContext = pillar
    ? `
Content pillar: ${pillar.title}
Feature focus: ${pillar.description}
Headline seed: ${pillar.headline}
Supporting copy seed: ${pillar.subhead}
CTA seed: ${pillar.cta}
Customer pain (before): ${pillar.transformationBefore}
Transformation (after): ${pillar.transformationAfter}`
    : "";

  const screenshotContext = getProductScreenshotsPromptBlock(input.contentPillarId);
  const layoutVariant = input.contentPillarId
    ? PILLAR_LAYOUTS[input.contentPillarId]
    : undefined;
  const layoutContext = getLayoutExamplesPromptBlock(layoutVariant);

  const templateId = getTemplateIdForPillar(input.contentPillarId);
  const copyLimits = getCopyLimitsForTemplate(templateId);
  const templateContext = getTemplatePromptBlock(templateId);
  const stepSchema = getStepSchemaForPillar(input.contentPillarId);
  const productClarity = getProductClarityForPillar(input.contentPillarId);
  const faCopyEnforcement = `
FA COPY LADDER (mandatory — CMO stranger test):
- A stranger must know in 3 seconds: what AdvisorPilot is, what it does, who it is for, why it is different.
- Product category line (rendered above headline): "${productClarity.productCategory}"
- supportingCopy (subhead / whatWeDo) MUST be a concrete capability with an action verb — seed: "${productClarity.whatWeDo}"
- whoItsFor and whyDifferent render in the value band — do NOT repeat them verbatim in supportingCopy.
- BANNED vague words in supportingCopy: transforming, leveraging, solution (without concrete action), platform, unlock, empower.
- Subhead MUST include an action verb (extract, confirm, draft, automate, trace, scale, prep, etc.) and financial advisor/RIA audience context.
- On ad cards, always say "financial advisor(s)" — not standalone "advisor(s)" (AdvisorPilot brand name excepted).
- Do NOT repeat "Secure. Your Data.", "Built for Advisors.", or similar trust-footer copy in subhead.
- If proof type is steps: supportingCopy IS the subhead only — no fourth body paragraph.
- Headline test: would a busy FA stop scrolling on LinkedIn?
${pillar?.outcomeLine ? `- Pillar outcome line (suppressed at render when redundant): ${pillar.outcomeLine}` : ""}
${getPillarCopyGuardrailsPromptBlock(input.contentPillarId)}`;
  const exportCopyRules = `
EXPORT TEMPLATE (deterministic ad card — copy MUST fit):
${templateContext}
${faCopyEnforcement}
- Headline: max ${copyLimits.maxHeadlineChars} characters (no em-dashes)
- Supporting copy (subhead): max ${copyLimits.subheadMax ?? copyLimits.maxSubheadChars} characters
- Proof type: ${copyLimits.proofType}${copyLimits.accentBar ? " (include accent bar visual cue in hierarchy)" : ""}
${
  copyLimits.proofType === "steps" && stepSchema
    ? `- When proof type is steps, use exactly 3 steps matching this shape (do NOT repeat in supportingCopy):\n${JSON.stringify(stepSchema, null, 2)}`
    : ""
}`;

  const customContext = input.customBrief
    ? `\nCustom brief overrides:\n${JSON.stringify(input.customBrief, null, 2)}`
    : "";
  const customRequestContext = buildCustomRequestContext(input.customRequest);

  return `Create a complete enterprise marketing campaign brief.

All creative must inherit Brand DNA below. This is non-negotiable.

${brandContext}

BRAND CONSTRAINTS (fixed — never violate):
${getBrandConstraintsBlock()}

COMPOSITION FREEDOM (varies per concept):
${getCompositionFreedomBlock()}

Brand colors:
${getBrandColorsBlock()}

${layoutContext}

${exportCopyRules}

${screenshotContext}

Asset type: ${assetLabel}
Campaign type: ${input.campaignType ?? (pillar ? pillar.title : "Enterprise Campaign")}
Audience: ${input.audience ?? dna.audience.join(", ")}
${pillarContext}
${customRequestContext}
${customContext}

Return JSON in exactly this shape:
{
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
  "layoutArchetype": "editorial-cover | product-spotlight | data-story | before-after | executive-statement | workflow-visualization | human-product | feature-announcement",
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
  "reviewChecklist": ["Would Apple publish this?", "..."]
}`;
}

export function buildVariationPrompt(
  baseBrief: CreativeBrief,
  style: ConceptStyle,
  layoutArchetype: LayoutArchetypeId,
  contentPillarId?: string
): string {
  const strategy = CONCEPT_STRATEGIES[style];
  const archetypeBlock = getLayoutArchetypeBlock(layoutArchetype);
  const template = resolveTemplateFromArchetype(layoutArchetype, contentPillarId);
  const copyLimits = getCopyLimitsForTemplate(template.id);
  const stepSchema = getStepSchemaForPillar(contentPillarId);
  const pillar = contentPillarId ? getPillarById(contentPillarId) : undefined;

  return `Develop a distinct creative STRATEGY with a specific LAYOUT ARCHETYPE for this campaign.

STRATEGY (messaging angle): ${strategy.name}
Inspiration: ${strategy.inspiration}
Goal: ${strategy.goal}
Visual Direction: ${strategy.visualDirection}
Sample headline direction: ${strategy.sampleHeadline}

LAYOUT ARCHETYPE (composition — MUST follow this, not a generic template):
${archetypeBlock}

EXPORT TEMPLATE (maps to final ad card): ${template.id}
${getTemplatePromptBlock(template.id)}
Copy limits: headline max ${copyLimits.maxHeadlineChars} chars, subhead max ${copyLimits.maxSubheadChars} chars, proof=${copyLimits.proofType}.
FA COPY LADDER: pain → transformation → proof. Subhead must not repeat step titles.
${
  copyLimits.proofType === "steps" && stepSchema
    ? `Use 3 steps (do NOT echo in supportingCopy): ${JSON.stringify(stepSchema)}`
    : pillar?.outcomeLine
      ? `Optional outcome line for icon templates: ${pillar.outcomeLine}`
      : ""
}

Base brief (already reviewed):
${JSON.stringify(baseBrief, null, 2)}

Requirements:
- Strategy and layout archetype are ORTHOGONAL. Different strategy from siblings AND different layout archetype.
- Headline may shift to match strategy goal while preserving core feature message
- visualComposition MUST fully specify layout archetype, hierarchy, hero, and spatial system
- composition and imagePrompt MUST execute the layout archetype — NOT default headline-left/product-right
- Inherit BRAND CONSTRAINTS only. Composition is defined by the archetype above.

Return JSON in exactly this shape:
{
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
  "colorPalette": ["..."],
  "designLanguage": "...",
  "layoutArchetype": "${layoutArchetype}",
  "visualComposition": {
    "layoutArchetype": "${layoutArchetype}",
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
}`;
}

export function buildRevisionPrompt(brief: CreativeBrief, critique: string, revisions: string[]): string {
  return `Revise this creative brief based on creative review feedback.

Current brief:
${JSON.stringify(brief, null, 2)}

Critique:
${critique}

Required revisions:
${revisions.map((r) => `- ${r}`).join("\n")}

Return the complete revised brief as JSON in the same shape as the original.
Increment quality to enterprise standards. Address every revision point.`;
}

export interface RawCreativeBriefResponse {
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
  layoutArchetype?: string;
  visualComposition?: {
    layoutArchetype?: string;
    visualHierarchy?: string;
    compositionStyle?: string;
    heroElement?: string;
    supportingElements?: string[];
    typographyTreatment?: string;
    imageUiUsage?: string;
    negativeSpaceStrategy?: string;
  };
  imagePrompt: string;
  negativePrompt: string;
  reviewChecklist: string[];
}

export function normalizeBriefResponse(
  raw: RawCreativeBriefResponse,
  assetType: CampaignAssetType,
  brandId = "advisorpilot",
  conceptStyle?: ConceptStyle,
  version = 1,
  forcedLayoutArchetype?: LayoutArchetypeId
): Omit<CreativeBrief, "id" | "createdAt"> {
  const layoutArchetype = normalizeLayoutArchetype(
    raw.layoutArchetype ?? raw.visualComposition?.layoutArchetype ?? forcedLayoutArchetype
  );

  const visualComposition = normalizeVisualComposition(raw.visualComposition, layoutArchetype);

  return {
    brandId,
    campaignGoal: raw.campaignGoal ?? "",
    campaignType: raw.campaignType ?? "",
    audience: raw.audience ?? "",
    feature: raw.feature ?? "",
    customerPain: raw.customerPain ?? "",
    transformation: raw.transformation ?? "",
    emotionalGoal: raw.emotionalGoal ?? "",
    headline: raw.headline ?? "",
    supportingCopy: raw.supportingCopy ?? "",
    cta: raw.cta ?? "",
    visualConcept: raw.visualConcept ?? "",
    composition: raw.composition ?? "",
    typography: raw.typography ?? "",
    productPlacement: raw.productPlacement ?? "",
    uiPriority: raw.uiPriority ?? "",
    spacingSystem: raw.spacingSystem ?? "8-point grid",
    background: raw.background ?? "",
    lighting: raw.lighting ?? "",
    colorPalette: Array.isArray(raw.colorPalette) ? raw.colorPalette : [],
    designLanguage: raw.designLanguage ?? "",
    layoutArchetype,
    visualComposition,
    imagePrompt: raw.imagePrompt ?? "",
    negativePrompt: raw.negativePrompt ?? "",
    reviewChecklist: Array.isArray(raw.reviewChecklist) ? raw.reviewChecklist : [],
    assetType,
    conceptStyle,
    version,
  };
}

function normalizeLayoutArchetype(value?: string): LayoutArchetypeId | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().replace(/\s+/g, "-") as LayoutArchetypeId;
  return ALL_LAYOUT_ARCHETYPE_IDS.includes(normalized) ? normalized : undefined;
}

function normalizeVisualComposition(
  raw?: RawCreativeBriefResponse["visualComposition"],
  fallbackArchetype?: LayoutArchetypeId
): VisualComposition | undefined {
  if (!raw && !fallbackArchetype) return undefined;

  const archetype = normalizeLayoutArchetype(raw?.layoutArchetype) ?? fallbackArchetype;
  if (!archetype) return undefined;

  return {
    layoutArchetype: archetype,
    visualHierarchy: raw?.visualHierarchy ?? "",
    compositionStyle: raw?.compositionStyle ?? "",
    heroElement: raw?.heroElement ?? "",
    supportingElements: Array.isArray(raw?.supportingElements) ? raw.supportingElements : [],
    typographyTreatment: raw?.typographyTreatment ?? "",
    imageUiUsage: raw?.imageUiUsage ?? "",
    negativeSpaceStrategy: raw?.negativeSpaceStrategy ?? "",
  };
}
