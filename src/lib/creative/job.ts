import { generateId } from "../utils";
import type { AspectRatio } from "../types";
import { getBrandDNA } from "./brand-dna";
import type {
  CampaignAssetType,
  CreativeBrief,
  CreativeJob,
  CreativeJobStatus,
  CreativePipelineStage,
  PipelineStageStatus,
  StrategyReviewAttempt,
  VariationGateAttempt,
} from "./types";

export const CREATIVE_PIPELINE_STAGES: { id: string; label: string }[] = [
  { id: "brand_dna", label: "Brand DNA" },
  { id: "exploration", label: "Strategic Exploration" },
  { id: "concept_selection", label: "Concept Selection" },
  { id: "images", label: "Master Image" },
  { id: "adaptation", label: "Layout Rendering" },
  { id: "packaging", label: "Marketing Package" },
];

export function createCreativeJob(
  assetType: CampaignAssetType,
  campaignType: string,
  brandId = "advisorpilot"
): CreativeJob {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    assetType,
    campaignType,
    brandId,
    status: "pending",
    stages: CREATIVE_PIPELINE_STAGES.map((s) => ({
      id: s.id,
      label: s.label,
      status: "pending" as PipelineStageStatus,
    })),
    brandDna: getBrandDNA(brandId),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateJobStage(
  job: CreativeJob,
  stageId: string,
  status: PipelineStageStatus,
  message?: string
): CreativeJob {
  const now = new Date().toISOString();

  return {
    ...job,
    updatedAt: now,
    stages: job.stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            status,
            message,
            completedAt: status === "complete" ? now : stage.completedAt,
          }
        : stage
    ),
  };
}

export function setJobStatus(job: CreativeJob, status: CreativeJobStatus): CreativeJob {
  return { ...job, status, updatedAt: new Date().toISOString() };
}

export function attachExplorationToJob(
  job: CreativeJob,
  brief: CreativeBrief,
  review: import("./types").CreativeReviewResult,
  strategyApproved: boolean,
  strategyHistory: StrategyReviewAttempt[],
  finalRationale: string | undefined,
  concepts: import("./types").ConceptVariation[],
  selected: import("./types").ConceptVariation,
  selectionRationale: string,
  gateHistory: VariationGateAttempt[],
  productionApproved: boolean
): CreativeJob {
  let updated = updateJobStage(
    job,
    "exploration",
    "complete",
    `Phase 1 complete — brief, critique, 3 concepts, scoring (1 text call)`
  );
  updated = updateJobStage(
    updated,
    "concept_selection",
    "complete",
    `Winner: ${selected.strategy.name} (${selected.score}/100) — ${selectionRationale.slice(0, 80) || "concept selected"}`
  );
  updated = {
    ...updated,
    brief,
    originalBrief: brief,
    review,
    strategyApproved,
    strategyReviewHistory: strategyHistory,
    finalStrategyRationale: finalRationale,
    concepts,
    selectedConcept: selected,
    selectionRationale,
    variationGateHistory: gateHistory,
    campaignType: brief.campaignType,
  };

  if (!productionApproved) {
    const reason =
      gateHistory.at(-1)?.result.rejectionReasons.join(". ") ||
      gateHistory.at(-1)?.result.directorVerdict ||
      "Production gate did not approve concepts";
    updated = blockImagesOnJob(updated, reason);
    return setJobStatus(updated, "complete");
  }

  return setJobStatus(updated, "images");
}

export function attachImagesToJob(
  job: CreativeJob,
  masterImageUrl: string,
  imagePrompts?: CreativeJob["imagePrompts"]
): CreativeJob {
  let updated = updateJobStage(job, "images", "complete", "Single master image generated");
  updated = { ...updated, masterImageUrl, imagePrompts };
  return setJobStatus(updated, "adaptation");
}

export function attachLayoutAdaptationToJob(
  job: CreativeJob,
  creativeAssets: Partial<Record<AspectRatio, string>>
): CreativeJob {
  const adaptedCount = Object.keys(creativeAssets).length;
  let updated = updateJobStage(
    job,
    "adaptation",
    "complete",
    `Layout adaptation via rendering — ${adaptedCount} format(s), no additional AI`
  );
  updated = { ...updated, creativeAssets };
  return setJobStatus(updated, "packaging");
}

export function completeJob(job: CreativeJob): CreativeJob {
  let updated = updateJobStage(job, "packaging", "complete", "Marketing assets packaged");
  return setJobStatus(updated, "complete");
}

export function blockImagesOnJob(job: CreativeJob, reason: string): CreativeJob {
  let updated = updateJobStage(job, "images", "skipped", reason);
  updated = updateJobStage(updated, "adaptation", "skipped", reason);
  return updated;
}

/** @deprecated legacy attach helpers — kept for type compatibility */
export function attachBriefToJob(job: CreativeJob, brief: CreativeBrief): CreativeJob {
  return attachExplorationToJob(
    job,
    brief,
    job.review ?? {
      publishReady: false,
      passed: false,
      scores: { apple: false, stripe: false, mercury: false, ramp: false, blackrock: false, bloomberg: false },
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      requiredChanges: [],
      critique: "",
      directorNotes: "",
      revisions: [],
      iteration: 0,
    },
    false,
    [],
    undefined,
    [],
    { style: "editorial-authority", strategy: { id: "editorial-authority", name: "", inspiration: "", goal: "", visualDirection: "", sampleHeadline: "" }, brief, score: 0, rationale: "", strengths: [], weaknesses: [] },
    "",
    [],
    false
  );
}

export function attachReviewToJob(
  job: CreativeJob,
  review: import("./types").CreativeReviewResult
): CreativeJob {
  return { ...job, review };
}

export function attachStrategyReviewToJob(
  job: CreativeJob,
  approved: boolean,
  history: StrategyReviewAttempt[],
  brief: CreativeBrief,
  finalRationale?: string
): CreativeJob {
  return {
    ...job,
    brief,
    strategyApproved: approved,
    strategyReviewHistory: history,
    finalStrategyRationale: finalRationale,
  };
}

export function attachConceptsToJob(
  job: CreativeJob,
  concepts: import("./types").ConceptVariation[],
  selected: import("./types").ConceptVariation,
  selectionRationale?: string
): CreativeJob {
  return { ...job, concepts, selectedConcept: selected, selectionRationale };
}

export function attachVariationGateToJob(
  job: CreativeJob,
  approved: boolean,
  history: VariationGateAttempt[],
  selected?: import("./types").ConceptVariation
): CreativeJob {
  return {
    ...job,
    variationGateHistory: history,
    selectedConcept: selected ?? job.selectedConcept,
  };
}
