import { generateJSON } from "../openai/server";
import { createConceptVariation } from "./director";
import { pickDistinctArchetypes, type LayoutArchetypeId } from "./layout-archetypes";
import {
  CONCEPT_SCORING_SYSTEM,
  buildConceptScoringPrompt,
  type RawConceptScoreResponse,
} from "./review-prompts";
import { checkArchetypeDiversity } from "./visual-diversity";
import {
  CONCEPT_STYLES,
  CONCEPT_STRATEGIES,
  type ConceptStyle,
  type ConceptVariation,
  type CreativeBrief,
  type VisualDiversityReport,
} from "./types";

export async function generateConceptVariations(
  baseBrief: CreativeBrief,
  onProgress?: (message: string) => void,
  contentPillarId?: string
): Promise<{
  variations: ConceptVariation[];
  archetypeByStyle: Map<ConceptStyle, LayoutArchetypeId>;
}> {
  const archetypes = pickDistinctArchetypes(baseBrief.campaignGoal, baseBrief.assetType);
  const archetypeByStyle = new Map<ConceptStyle, LayoutArchetypeId>();

  const variations = await Promise.all(
    CONCEPT_STYLES.map(async (style, i) => {
      const archetype = archetypes[i] ?? archetypes[0];
      const strategy = CONCEPT_STRATEGIES[style];
      archetypeByStyle.set(style, archetype);

      onProgress?.(`Developing ${strategy.name} strategy with ${archetype} layout…`);
      const brief = await createConceptVariation(baseBrief, style, archetype, contentPillarId);

      return {
        style,
        strategy,
        brief,
        layoutArchetype: brief.layoutArchetype ?? archetype,
        visualComposition: brief.visualComposition,
        score: 0,
        rationale: "",
        strengths: [] as string[],
        weaknesses: [] as string[],
      };
    })
  );

  return { variations, archetypeByStyle };
}

export async function scoreConceptVariations(
  variations: ConceptVariation[],
  onProgress?: (message: string) => void
): Promise<{ variations: ConceptVariation[]; selectionRationale: string }> {
  onProgress?.("Scoring creative strategies against campaign goals…");

  const userPrompt = buildConceptScoringPrompt(
    variations.map((v) => ({
      style: v.style,
      name: v.strategy.name,
      goal: v.strategy.goal,
      layoutArchetype: v.layoutArchetype ?? v.brief.layoutArchetype,
      brief: v.brief,
    }))
  );

  const result = await generateJSON<RawConceptScoreResponse>(CONCEPT_SCORING_SYSTEM, userPrompt);

  const scored = variations.map((variation) => {
    const scoreData = result.scores?.find(
      (s) => s.style.toLowerCase() === variation.style
    );

    return {
      ...variation,
      score: scoreData?.score ?? 0,
      rationale: scoreData?.rationale ?? "",
      strengths: scoreData?.strengths ?? [],
      weaknesses: scoreData?.weaknesses ?? [],
    };
  });

  return {
    variations: scored,
    selectionRationale: result.selectionRationale ?? "",
  };
}

export function selectStrongestConcept(
  variations: ConceptVariation[],
  preferredStyle?: ConceptStyle
): ConceptVariation {
  if (!variations.length) {
    throw new Error("No concept strategies to select from");
  }

  const sorted = [...variations].sort((a, b) => b.score - a.score);
  const top = sorted[0];

  if (preferredStyle) {
    const preferred = sorted.find((v) => v.style === preferredStyle);
    if (preferred && preferred.score >= top.score - 5) {
      return preferred;
    }
  }

  return top;
}

export async function runVariationPhase(
  baseBrief: CreativeBrief,
  onProgress?: (message: string) => void,
  contentPillarId?: string
): Promise<{
  variations: ConceptVariation[];
  selected: ConceptVariation;
  selectionRationale: string;
  visualDiversityReport: VisualDiversityReport;
}> {
  const { variations: rawVariations } = await generateConceptVariations(
    baseBrief,
    onProgress,
    contentPillarId
  );

  onProgress?.("Checking layout archetype diversity (rule-based, no AI)…");
  const diversityReport = checkArchetypeDiversity(rawVariations);
  const diversified = rawVariations;

  const { variations: scored, selectionRationale } = await scoreConceptVariations(
    diversified,
    onProgress
  );
  const selected = selectStrongestConcept(scored);

  onProgress?.(
    `Selected ${selected.strategy.name} + ${selected.layoutArchetype ?? "layout"} (score: ${selected.score}/100, diversity: ${diversityReport.visualDiversityScore}/100). ${selectionRationale}`
  );

  return {
    variations: scored,
    selected,
    selectionRationale,
    visualDiversityReport: {
      pairwise: diversityReport.pairwise,
      visualDiversityScore: diversityReport.visualDiversityScore,
      approved: diversityReport.approved,
      rejectionReasons: diversityReport.rejectionReasons,
    },
  };
}
