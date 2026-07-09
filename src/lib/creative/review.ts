import { generateJSON } from "../openai/server";
import {
  CREATIVE_REVIEW_SYSTEM,
  buildCreativeReviewPrompt,
  normalizeReviewResponse,
  type RawCreativeReviewResponse,
} from "./review-prompts";
import { reviseCreativeBrief } from "./director";
import type { CreativeBrief, CreativeReviewResult } from "./types";

const MAX_REVIEW_ITERATIONS = 3;

export async function reviewCreativeBrief(
  brief: CreativeBrief,
  iteration: number
): Promise<CreativeReviewResult> {
  const userPrompt = buildCreativeReviewPrompt(brief);
  const raw = await generateJSON<RawCreativeReviewResponse>(CREATIVE_REVIEW_SYSTEM, userPrompt);
  return normalizeReviewResponse(raw, iteration);
}

export async function runCreativeReviewLoop(
  brief: CreativeBrief,
  onProgress?: (message: string) => void
): Promise<{ brief: CreativeBrief; review: CreativeReviewResult }> {
  let currentBrief = brief;
  let lastReview: CreativeReviewResult | null = null;

  for (let iteration = 1; iteration <= MAX_REVIEW_ITERATIONS; iteration++) {
    onProgress?.(
      iteration === 1
        ? "Senior Creative Director reviewing campaign brief…"
        : `Revising brief based on director notes (${iteration}/${MAX_REVIEW_ITERATIONS})…`
    );

    const review = await reviewCreativeBrief(currentBrief, iteration);
    lastReview = review;

    if (review.publishReady) {
      onProgress?.(
        `Creative brief approved (${review.overallScore}/100). ${review.directorNotes.slice(0, 120)}…`
      );
      return { brief: currentBrief, review };
    }

    onProgress?.(
      review.directorNotes ||
        `Score ${review.overallScore}/100. ${review.requiredChanges.length} changes required.`
    );

    if (iteration >= MAX_REVIEW_ITERATIONS) {
      onProgress?.("Max review iterations reached. Proceeding with strongest revision.");
      return {
        brief: currentBrief,
        review: { ...review, publishReady: false, passed: false },
      };
    }

    if (!review.requiredChanges.length) {
      return { brief: currentBrief, review };
    }

    onProgress?.("Creative Director revising brief…");
    currentBrief = await reviseCreativeBrief(
      currentBrief,
      review.critique,
      review.requiredChanges
    );
  }

  return {
    brief: currentBrief,
    review: lastReview ?? {
      publishReady: false,
      passed: false,
      scores: {
        apple: false,
        stripe: false,
        mercury: false,
        ramp: false,
        blackrock: false,
        bloomberg: false,
      },
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      requiredChanges: [],
      critique: "Review did not complete",
      directorNotes: "Review did not complete",
      revisions: [],
      iteration: MAX_REVIEW_ITERATIONS,
    },
  };
}
