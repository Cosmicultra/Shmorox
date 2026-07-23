import type { ModelTier } from "./config";
import { getOpenAIConfig } from "./config";

export interface TokenUsageDelta {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelUsageDelta {
  explorationCalls: number;
  premiumCalls: number;
  explorationInputTokens: number;
  explorationOutputTokens: number;
  premiumInputTokens: number;
  premiumOutputTokens: number;
}

export interface GenerationCostDelta extends TokenUsageDelta, ModelUsageDelta {
  textCalls: number;
  imageGenerations: number;
  /** Sum of per-image estimates (preferred over flat rate × count). */
  imageCostUsd?: number;
}

export interface GenerationCostReport extends GenerationCostDelta {
  estimatedTextCostUsd: number;
  estimatedImageCostUsd: number;
  estimatedTotalCostUsd: number;
  costPerApprovedAssetUsd?: number;
}

function emptyModelUsage(): ModelUsageDelta {
  return {
    explorationCalls: 0,
    premiumCalls: 0,
    explorationInputTokens: 0,
    explorationOutputTokens: 0,
    premiumInputTokens: 0,
    premiumOutputTokens: 0,
  };
}

function emptyTokenUsage(): TokenUsageDelta {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function estimateTextCostUsd(delta: Pick<GenerationCostDelta, keyof ModelUsageDelta>): number {
  const { tokenRates } = getOpenAIConfig();
  const exploration =
    (delta.explorationInputTokens / 1_000_000) * tokenRates.exploration.inputPer1M +
    (delta.explorationOutputTokens / 1_000_000) * tokenRates.exploration.outputPer1M;
  const premium =
    (delta.premiumInputTokens / 1_000_000) * tokenRates.premium.inputPer1M +
    (delta.premiumOutputTokens / 1_000_000) * tokenRates.premium.outputPer1M;
  return exploration + premium;
}

export class CostTracker {
  textCalls = 0;
  imageGenerations = 0;
  imageCostUsd = 0;
  inputTokens = 0;
  outputTokens = 0;
  totalTokens = 0;
  explorationCalls = 0;
  premiumCalls = 0;
  explorationInputTokens = 0;
  explorationOutputTokens = 0;
  premiumInputTokens = 0;
  premiumOutputTokens = 0;

  recordTextCall(
    tier: ModelTier,
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  ): void {
    this.textCalls += 1;
    const input = usage?.prompt_tokens ?? 0;
    const output = usage?.completion_tokens ?? 0;
    const total = usage?.total_tokens ?? input + output;

    this.inputTokens += input;
    this.outputTokens += output;
    this.totalTokens += total;

    if (tier === "premium") {
      this.premiumCalls += 1;
      this.premiumInputTokens += input;
      this.premiumOutputTokens += output;
    } else {
      this.explorationCalls += 1;
      this.explorationInputTokens += input;
      this.explorationOutputTokens += output;
    }
  }

  recordImageGeneration(costUsd: number): void {
    this.imageGenerations += 1;
    this.imageCostUsd += costUsd;
  }

  merge(delta: Partial<GenerationCostDelta>): void {
    this.textCalls += delta.textCalls ?? 0;
    this.imageGenerations += delta.imageGenerations ?? 0;
    this.imageCostUsd += delta.imageCostUsd ?? 0;
    this.inputTokens += delta.inputTokens ?? 0;
    this.outputTokens += delta.outputTokens ?? 0;
    this.totalTokens += delta.totalTokens ?? 0;
    this.explorationCalls += delta.explorationCalls ?? 0;
    this.premiumCalls += delta.premiumCalls ?? 0;
    this.explorationInputTokens += delta.explorationInputTokens ?? 0;
    this.explorationOutputTokens += delta.explorationOutputTokens ?? 0;
    this.premiumInputTokens += delta.premiumInputTokens ?? 0;
    this.premiumOutputTokens += delta.premiumOutputTokens ?? 0;
  }

  toDelta(): GenerationCostDelta {
    return {
      textCalls: this.textCalls,
      imageGenerations: this.imageGenerations,
      imageCostUsd: this.imageCostUsd,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.totalTokens,
      explorationCalls: this.explorationCalls,
      premiumCalls: this.premiumCalls,
      explorationInputTokens: this.explorationInputTokens,
      explorationOutputTokens: this.explorationOutputTokens,
      premiumInputTokens: this.premiumInputTokens,
      premiumOutputTokens: this.premiumOutputTokens,
    };
  }

  toReport(approvedAssets = 1): GenerationCostReport {
    const delta = this.toDelta();
    const estimatedTextCostUsd = estimateTextCostUsd(delta);
    const estimatedImageCostUsd =
      (delta.imageCostUsd ?? 0) > 0
        ? (delta.imageCostUsd ?? 0)
        : delta.imageGenerations * getOpenAIConfig().imageGenUsd;
    const estimatedTotalCostUsd = estimatedTextCostUsd + estimatedImageCostUsd;

    return {
      ...delta,
      estimatedTextCostUsd,
      estimatedImageCostUsd,
      estimatedTotalCostUsd,
      costPerApprovedAssetUsd:
        approvedAssets > 0 ? estimatedTotalCostUsd / approvedAssets : undefined,
    };
  }
}

export function emptyCostReport(): GenerationCostReport {
  return new CostTracker().toReport();
}

export function mergeCostDeltas(...deltas: Partial<GenerationCostDelta>[]): GenerationCostReport {
  const tracker = new CostTracker();
  for (const delta of deltas) {
    tracker.merge(delta);
  }
  return tracker.toReport();
}

export function deltaToReport(delta: Partial<GenerationCostDelta>, approvedAssets = 1): GenerationCostReport {
  const tracker = new CostTracker();
  tracker.merge(delta);
  return tracker.toReport(approvedAssets);
}

export function applyApprovedAssetCost(
  report: GenerationCostReport,
  approvedAssets: number
): GenerationCostReport {
  return {
    ...report,
    costPerApprovedAssetUsd:
      approvedAssets > 0 ? report.estimatedTotalCostUsd / approvedAssets : undefined,
  };
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}
