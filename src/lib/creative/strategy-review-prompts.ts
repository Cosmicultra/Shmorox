import type { CreativeBrief } from "./types";

export const STRATEGY_REVIEW_SYSTEM = `You are the Executive Creative Director and strategic gatekeeper at a world-class enterprise agency.

You led brand strategy at Apple, Stripe, McKinsey, Bloomberg, and BlackRock.

Your job is NOT to approve work that looks nice.
Your job is to kill weak strategic directions before any production begins.

You behave like a creative lead in a review meeting:
- Direct. Opinionated. Sometimes blunt.
- You reject concepts that lack strategic reason to exist.
- You never say "this looks great" unless it genuinely is.
- If the direction is weak, say: "No. This concept lacks differentiation. Here is what we need instead."

A brief is APPROVED only when it would survive a CMO review at a Fortune 500 fintech.

Return valid JSON only.`;

export function buildStrategyReviewPrompt(brief: CreativeBrief): string {
  return `Evaluate this creative brief as a strategic gatekeeper BEFORE any concept variations or images are produced.

Creative Brief:
${JSON.stringify(brief, null, 2)}

Evaluate each criterion honestly:

1. Is this differentiated from generic SaaS marketing?
2. Is the message strong enough to stop a busy RIA principal?
3. Does it create curiosity or urgency?
4. Would a premium enterprise brand (Apple, Stripe, Bloomberg) publish this?
5. Is the positioning clear in one sentence?
6. Is the audience pain point strong and specific?
7. Does the concept have a strategic reason to exist beyond "nice looking"?

If ANY critical criterion fails, REJECT the direction.

When rejecting, you MUST provide:
- Specific rejection reasons (not vague)
- The strategic gap (what is missing)
- Exactly 3 stronger creative directions with headlines and positioning angles
- A recommended positioning angle for revision

When approving, explain why this direction is strategically sound.

Return JSON:
{
  "approved": false,
  "overallScore": 0-100,
  "evaluation": {
    "differentiated": true,
    "messageStrength": true,
    "curiosityOrUrgency": true,
    "premiumEnterpriseWorthy": true,
    "positioningClear": true,
    "painPointStrong": true,
    "hasStrategicReason": true
  },
  "rejectionReasons": ["Specific reason 1"],
  "strategicGap": "What is fundamentally missing from this direction",
  "strongerDirections": [
    {
      "name": "Direction name",
      "headline": "Proposed headline",
      "positioningAngle": "The angle",
      "rationale": "Why this is stronger",
      "whyStronger": "What gap it fills"
    }
  ],
  "recommendedPositioningAngle": "The positioning angle to pursue",
  "directorVerdict": "Direct opinionated verdict as if speaking in a creative review"
}`;
}

export const VARIATION_GATE_SYSTEM = `You are the Executive Creative Director performing a final strategic gate before image production.

Three concept strategies have been developed and scored. Your job is to determine if ANY of them are strong enough to produce.

If ALL concepts are strategically weak, REJECT them all. Do not let mediocre work go to production.

Provide specific rejection reasons and 3 stronger directions if rejecting.

Return valid JSON only.`;

export function buildVariationGatePrompt(
  variations: {
    name: string;
    style: string;
    score: number;
    layoutArchetype?: string;
    brief: CreativeBrief;
  }[]
): string {
  return `Final strategic gate: should we produce images for any of these concepts?

Also verify VISUAL DIVERSITY: concepts must use different layout archetypes and compositions.
Reject if all three feel like the same template (e.g. all headline-left/product-right).

${variations
  .map(
    (v) => `## ${v.name} (${v.style}) — Score: ${v.score}/100 — Layout: ${v.layoutArchetype ?? v.brief.layoutArchetype ?? "unspecified"}
${JSON.stringify(v.brief, null, 2)}`
  )
  .join("\n\n")}

If the highest-scoring concept is below enterprise standards, reject ALL.

Return JSON:
{
  "approved": false,
  "topScore": 0,
  "rejectionReasons": ["Why these concepts fail strategically"],
  "strategicGap": "What is missing",
  "strongerDirections": [
    {
      "name": "...",
      "headline": "...",
      "positioningAngle": "...",
      "rationale": "...",
      "whyStronger": "..."
    }
  ],
  "recommendedPositioningAngle": "...",
  "directorVerdict": "Direct verdict",
  "selectedStyle": "editorial-authority" | null
}`;
}

export function buildStrategyRevisionPrompt(
  brief: CreativeBrief,
  rejection: {
    rejectionReasons: string[];
    strategicGap: string;
    strongerDirections: StrategicDirectionRaw[];
    recommendedPositioningAngle: string;
    directorVerdict: string;
  }
): string {
  return `The Creative Director REJECTED this brief's strategic direction. Revise it completely.

REJECTED BRIEF:
${JSON.stringify(brief, null, 2)}

DIRECTOR VERDICT:
${rejection.directorVerdict}

REJECTION REASONS:
${rejection.rejectionReasons.map((r) => `- ${r}`).join("\n")}

STRATEGIC GAP:
${rejection.strategicGap}

RECOMMENDED POSITIONING ANGLE:
${rejection.recommendedPositioningAngle}

STRONGER DIRECTIONS TO CONSIDER:
${rejection.strongerDirections
  .map(
    (d) =>
      `- ${d.name}: "${d.headline}" — ${d.positioningAngle} (${d.whyStronger})`
  )
  .join("\n")}

Build a fundamentally stronger brief. Do not make cosmetic edits.
The revised brief must address every rejection reason.
Inherit Brand DNA. Return the complete brief JSON in the same shape as the original.`;
}

export interface StrategicDirectionRaw {
  name: string;
  headline: string;
  positioningAngle: string;
  rationale: string;
  whyStronger: string;
}

export interface RawStrategyReviewResponse {
  approved?: boolean;
  overallScore?: number;
  evaluation?: {
    differentiated?: boolean;
    messageStrength?: boolean;
    curiosityOrUrgency?: boolean;
    premiumEnterpriseWorthy?: boolean;
    positioningClear?: boolean;
    painPointStrong?: boolean;
    hasStrategicReason?: boolean;
  };
  rejectionReasons?: string[];
  strategicGap?: string;
  strongerDirections?: StrategicDirectionRaw[];
  recommendedPositioningAngle?: string;
  directorVerdict?: string;
}

export interface RawVariationGateResponse {
  approved?: boolean;
  topScore?: number;
  rejectionReasons?: string[];
  strategicGap?: string;
  strongerDirections?: StrategicDirectionRaw[];
  recommendedPositioningAngle?: string;
  directorVerdict?: string;
  selectedStyle?: string | null;
}
