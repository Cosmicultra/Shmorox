import type { ConceptStyle, ConceptVariation } from "./types";
import type { LayoutArchetypeId } from "./layout-archetypes";
import type { VisualDiversityReport } from "./visual-diversity-prompts";

/**
 * Rule-based diversity check — no AI call.
 * Archetypes are pre-assigned distinct via pickDistinctArchetypes.
 */
export function checkArchetypeDiversity(variations: ConceptVariation[]): VisualDiversityReport {
  const archetypes = variations
    .map((v) => v.layoutArchetype ?? v.brief.layoutArchetype)
    .filter(Boolean) as LayoutArchetypeId[];

  const unique = new Set(archetypes);
  const allDistinct = unique.size === variations.length && variations.length >= 2;
  const score = variations.length < 2 ? 100 : Math.round((unique.size / variations.length) * 100);

  return {
    pairwise: [],
    visualDiversityScore: score,
    approved: allDistinct || variations.length < 2,
    rejectionReasons: allDistinct
      ? []
      : ["Layout archetypes are not sufficiently distinct — assigned deterministically at exploration"],
    regenerationTargets: [],
  };
}

export type { VisualDiversityReport, PairwiseSimilarity } from "./visual-diversity-prompts";
export {
  VISUAL_SIMILARITY_THRESHOLD,
  MIN_VISUAL_DIVERSITY_SCORE,
} from "./visual-diversity-prompts";
