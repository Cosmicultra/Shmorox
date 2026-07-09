import type { CreativeBrief, CreativeReviewResult } from "./types";

export const CREATIVE_REVIEW_SYSTEM = `You are a Senior Creative Director at a top enterprise agency.

You are NOT a scoring machine. You are giving notes to a designer before anything gets produced.

Your tone is direct, opinionated, and professional. You have led campaigns for Apple, Stripe, Mercury, Ramp, BlackRock, and Bloomberg.

If the concept is weak, say so plainly:
"No, this concept is weak. The headline lacks differentiation. Here are three stronger directions."

If the copy is transactional, call it out.
If the visual direction feels like Canva, reject it.
If it could pass at Apple or Stripe, acknowledge what works.

You evaluate against brand standards:
- Would Apple publish this?
- Would Stripe publish this?
- Would Mercury publish this?
- Would Ramp publish this?
- Would BlackRock publish this?
- Would Bloomberg publish this?

publish_ready is true only when:
- Overall score is 80+
- At least 5 of 6 brand standards pass
- No critical weaknesses remain unaddressed
- You would confidently present this to a Fortune 500 CMO

Be specific in required_changes. Never vague. Never flatter.

Return valid JSON only.`;

export function buildCreativeReviewPrompt(brief: CreativeBrief): string {
  return `Critique this creative brief as a senior creative director giving notes to your team.

Do NOT simply score and approve. Give honest, opinionated creative direction.

Creative Brief:
${JSON.stringify(brief, null, 2)}

Evaluate:
1. Copy — headline tension, supporting copy clarity, CTA strength
2. Visual direction — concept sophistication, composition, typography hierarchy
3. Enterprise credibility — would financial advisors trust this?
4. Differentiation — does this stand apart from generic SaaS marketing?
5. Brand alignment — AdvisorPilot positioning
6. Each standard: Apple, Stripe, Mercury, Ramp, BlackRock, Bloomberg

Return JSON:
{
  "publish_ready": false,
  "overallScore": 82,
  "scores": {
    "apple": true,
    "stripe": true,
    "mercury": false,
    "ramp": true,
    "blackrock": true,
    "bloomberg": true
  },
  "strengths": [
    "Clear value proposition",
    "Strong visual hierarchy"
  ],
  "weaknesses": [
    "Headline lacks tension",
    "CTA feels transactional"
  ],
  "required_changes": [
    "Create stronger emotional contrast in headline",
    "Simplify supporting copy to one clear benefit"
  ],
  "critique": "Two-paragraph honest creative assessment",
  "director_notes": "Direct, opinionated notes as if speaking to the designer. Be blunt where needed."
}`;
}

export interface RawCreativeReviewResponse {
  publish_ready?: boolean;
  passed?: boolean;
  scores?: CreativeReviewResult["scores"];
  overallScore?: number;
  overall_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  required_changes?: string[];
  revisions?: string[];
  critique?: string;
  director_notes?: string;
}

export function normalizeReviewResponse(
  raw: RawCreativeReviewResponse,
  iteration: number
): CreativeReviewResult {
  const scores = raw.scores ?? {
    apple: false,
    stripe: false,
    mercury: false,
    ramp: false,
    blackrock: false,
    bloomberg: false,
  };

  const passCount = Object.values(scores).filter(Boolean).length;
  const overallScore = raw.overallScore ?? raw.overall_score ?? 0;
  const requiredChanges = raw.required_changes ?? raw.revisions ?? [];
  const strengths = raw.strengths ?? [];
  const weaknesses = raw.weaknesses ?? [];

  const publishReady =
    (raw.publish_ready ?? raw.passed) === true && passCount >= 5 && overallScore >= 80;

  return {
    publishReady,
    passed: publishReady,
    scores,
    overallScore,
    strengths,
    weaknesses,
    requiredChanges,
    critique: raw.critique ?? "",
    directorNotes: raw.director_notes ?? raw.critique ?? "",
    revisions: requiredChanges,
    iteration,
  };
}

export const CONCEPT_SCORING_SYSTEM = `You are the Executive Creative Director selecting between three distinct creative STRATEGIES for AdvisorPilot.

These are not random variations. Each strategy has a different goal:
- Editorial Authority: build trust (McKinsey/Bloomberg)
- Product Demonstration: drive demos (Stripe/Mercury)
- Emotional Pain: create conversion urgency

Score each strategy 0-100. Be decisive. Pick a winner with clear rationale.

If a strategy is weak, say why. Do not default to the safe choice.

Return valid JSON only.`;

export function buildConceptScoringPrompt(
  variations: {
    style: string;
    name: string;
    goal: string;
    layoutArchetype?: string;
    brief: CreativeBrief;
  }[]
): string {
  return `Score these three creative strategies and select the strongest.

Each concept must have a DIFFERENT layout archetype. Penalize concepts that feel like the same template with different copy.

${variations
  .map(
    (v) => `## ${v.name.toUpperCase()} (${v.style})
Goal: ${v.goal}
Layout Archetype: ${v.layoutArchetype ?? v.brief.layoutArchetype ?? "unspecified"}
${JSON.stringify(v.brief, null, 2)}`
  )
  .join("\n\n")}

Return JSON:
{
  "scores": [
    {
      "style": "editorial-authority",
      "score": 0-100,
      "rationale": "...",
      "strengths": ["..."],
      "weaknesses": ["..."]
    }
  ],
  "selectedStyle": "editorial-authority" | "product-demonstration" | "emotional-pain",
  "selectionRationale": "Why this strategy wins for this campaign"
}`;
}

export interface RawConceptScoreResponse {
  scores: {
    style: string;
    score: number;
    rationale: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  selectedStyle: string;
  selectionRationale: string;
}
