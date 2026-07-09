export type ModelTier = "exploration" | "premium";

export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const premiumModel =
    process.env.OPENAI_PREMIUM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-5.5";
  const explorationModel =
    process.env.OPENAI_EXPLORATION_MODEL?.trim() || "gpt-4o-mini";

  return {
    apiKey,
    model: premiumModel,
    premiumModel,
    explorationModel,
    imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1",
    premiumRevisionEnabled: process.env.OPENAI_PREMIUM_REVISION === "true",
    enabled: apiKey.length > 0,
    tokenRates: {
      exploration: {
        inputPer1M: Number(process.env.OPENAI_EXPLORATION_INPUT_COST_PER_1M ?? "0.15"),
        outputPer1M: Number(process.env.OPENAI_EXPLORATION_OUTPUT_COST_PER_1M ?? "0.60"),
      },
      premium: {
        inputPer1M: Number(process.env.OPENAI_PREMIUM_INPUT_COST_PER_1M ?? "2.50"),
        outputPer1M: Number(process.env.OPENAI_PREMIUM_OUTPUT_COST_PER_1M ?? "10.00"),
      },
    },
    imageGenUsd: Number(process.env.OPENAI_IMAGE_GEN_COST_USD ?? "0.04"),
  };
}

export function getModelForTier(tier: ModelTier): string {
  const config = getOpenAIConfig();
  return tier === "premium" ? config.premiumModel : config.explorationModel;
}
