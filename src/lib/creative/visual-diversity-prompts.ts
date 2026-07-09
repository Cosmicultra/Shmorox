import type { ConceptStyle, ConceptVariation } from "./types";

export const VISUAL_SIMILARITY_THRESHOLD = 70;
export const MIN_VISUAL_DIVERSITY_SCORE = 55;
export const MAX_DIVERSITY_REGENERATION_ROUNDS = 2;

export interface PairwiseSimilarity {
  conceptA: ConceptStyle;
  conceptB: ConceptStyle;
  layoutSimilarity: number;
  headlinePlacementSimilarity: number;
  visualStructureSimilarity: number;
  dominantObjectSimilarity: number;
  overallSimilarity: number;
  tooSimilar: boolean;
}

export interface VisualDiversityReport {
  pairwise: PairwiseSimilarity[];
  visualDiversityScore: number;
  approved: boolean;
  rejectionReasons: string[];
  regenerationTargets: {
    style: ConceptStyle;
    reason: string;
    comparedTo: ConceptStyle;
    overallSimilarity: number;
  }[];
}

export interface RawSimilarityPair {
  conceptA: string;
  conceptB: string;
  layoutSimilarity: number;
  headlinePlacementSimilarity: number;
  visualStructureSimilarity: number;
  dominantObjectSimilarity: number;
  overallSimilarity: number;
}

export interface RawVisualDiversityResponse {
  visualDiversityScore: number;
  approved: boolean;
  rejectionReasons: string[];
  pairs: RawSimilarityPair[];
  regenerationTargets: {
    style: string;
    reason: string;
    comparedTo: string;
    overallSimilarity: number;
  }[];
}

export const VISUAL_DIVERSITY_SYSTEM = `You are a Senior Creative Director performing a visual diversity audit.

Your job is to prevent template repetition. Same brand is required. Same layout is forbidden.

Compare concept briefs on COMPOSITION only — not messaging angle or copy topic.

Score each similarity dimension 0-100 where:
- 0 = completely different
- 100 = essentially the same layout/template

Dimensions:
1. layoutSimilarity — overall grid, panel structure, spatial arrangement
2. headlinePlacementSimilarity — where and how headline sits in the frame
3. visualStructureSimilarity — eye flow, layering, depth planes, element stacking
4. dominantObjectSimilarity — what object/type dominates (type vs UI vs data vs human)

overallSimilarity = weighted average (layout 30%, headline placement 25%, visual structure 25%, dominant object 20%)

A pair is TOO SIMILAR if overallSimilarity >= ${VISUAL_SIMILARITY_THRESHOLD}.

visualDiversityScore = 100 minus the average overallSimilarity across all pairs.
Approved if visualDiversityScore >= ${MIN_VISUAL_DIVERSITY_SCORE} AND no pair is too similar.

Be strict. If all three concepts use headline-left + product-right, score them 85+ similar.

Return valid JSON only.`;

export function buildVisualDiversityPrompt(variations: ConceptVariation[]): string {
  const concepts = variations.map((v) => ({
    style: v.style,
    strategy: v.strategy.name,
    layoutArchetype: v.brief.layoutArchetype ?? v.layoutArchetype,
    visualComposition: v.brief.visualComposition ?? v.visualComposition,
    headline: v.brief.headline,
    visualConcept: v.brief.visualConcept,
    composition: v.brief.composition,
    typography: v.brief.typography,
    productPlacement: v.brief.productPlacement,
    uiPriority: v.brief.uiPriority,
    imagePrompt: v.brief.imagePrompt,
  }));

  return `Analyze visual diversity across these ${variations.length} concept executions.

${JSON.stringify(concepts, null, 2)}

Compare every pair (A vs B, A vs C, B vs C).

If concepts are too similar, identify which concept to regenerate and why.
Prefer regenerating the lower-scoring or less distinct concept.

Return JSON:
{
  "visualDiversityScore": 0-100,
  "approved": false,
  "rejectionReasons": ["All three use headline-left product-right layout"],
  "pairs": [
    {
      "conceptA": "editorial-authority",
      "conceptB": "product-demonstration",
      "layoutSimilarity": 0-100,
      "headlinePlacementSimilarity": 0-100,
      "visualStructureSimilarity": 0-100,
      "dominantObjectSimilarity": 0-100,
      "overallSimilarity": 0-100
    }
  ],
  "regenerationTargets": [
    {
      "style": "product-demonstration",
      "reason": "Layout too similar to editorial-authority",
      "comparedTo": "editorial-authority",
      "overallSimilarity": 87
    }
  ]
}`;
}

export function normalizeVisualDiversityReport(
  raw: RawVisualDiversityResponse,
  variations: ConceptVariation[]
): VisualDiversityReport {
  const validStyles = new Set(variations.map((v) => v.style));

  const pairwise: PairwiseSimilarity[] = (raw.pairs ?? []).map((pair) => {
    const overall = pair.overallSimilarity ?? 0;
    return {
      conceptA: pair.conceptA as ConceptStyle,
      conceptB: pair.conceptB as ConceptStyle,
      layoutSimilarity: pair.layoutSimilarity ?? 0,
      headlinePlacementSimilarity: pair.headlinePlacementSimilarity ?? 0,
      visualStructureSimilarity: pair.visualStructureSimilarity ?? 0,
      dominantObjectSimilarity: pair.dominantObjectSimilarity ?? 0,
      overallSimilarity: overall,
      tooSimilar: overall >= VISUAL_SIMILARITY_THRESHOLD,
    };
  });

  const diversityScore = raw.visualDiversityScore ?? 0;
  const hasSimilarPair = pairwise.some((p) => p.tooSimilar);
  const approved =
    raw.approved === true && diversityScore >= MIN_VISUAL_DIVERSITY_SCORE && !hasSimilarPair;

  return {
    pairwise,
    visualDiversityScore: diversityScore,
    approved,
    rejectionReasons: raw.rejectionReasons ?? [],
    regenerationTargets: (raw.regenerationTargets ?? [])
      .filter((t) => validStyles.has(t.style as ConceptStyle))
      .map((t) => ({
        style: t.style as ConceptStyle,
        reason: t.reason ?? "Too visually similar",
        comparedTo: t.comparedTo as ConceptStyle,
        overallSimilarity: t.overallSimilarity ?? 0,
      })),
  };
}
