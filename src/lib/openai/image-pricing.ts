export type OpenAIImageQuality = "low" | "medium" | "high" | "auto";

/** Square / portrait / landscape buckets used in OpenAI image pricing tables. */
type ImageSizeBucket = "square" | "portrait";

function sizeBucket(size: string): ImageSizeBucket {
  const [w, h] = size.split("x").map((n) => Number.parseInt(n, 10));
  if (!Number.isFinite(w) || !Number.isFinite(h)) return "square";
  if (w === h) return "square";
  return "portrait";
}

/** Per-image USD for official OpenAI image models (output image fee). */
const GPT_IMAGE_1: Record<ImageSizeBucket, Record<"low" | "medium" | "high", number>> = {
  square: { low: 0.011, medium: 0.042, high: 0.167 },
  portrait: { low: 0.016, medium: 0.063, high: 0.25 },
};

const GPT_IMAGE_1_5: Record<ImageSizeBucket, Record<"low" | "medium" | "high", number>> = {
  square: { low: 0.009, medium: 0.034, high: 0.133 },
  portrait: { low: 0.013, medium: 0.05, high: 0.2 },
};

const GPT_IMAGE_1_MINI: Record<ImageSizeBucket, Record<"low" | "medium" | "high", number>> = {
  square: { low: 0.005, medium: 0.011, high: 0.036 },
  portrait: { low: 0.006, medium: 0.015, high: 0.052 },
};

function resolveQualityForPricing(quality: OpenAIImageQuality | undefined): "low" | "medium" | "high" {
  if (quality === "low" || quality === "medium" || quality === "high") return quality;
  // "auto" and omitted quality bill at the high tier for gpt-image-1 in practice.
  return "high";
}

export function estimateOpenAIImageCostUsd(params: {
  model: string;
  size: string;
  quality?: OpenAIImageQuality;
  fallbackUsd?: number;
}): number {
  const tier = resolveQualityForPricing(params.quality);
  const bucket = sizeBucket(params.size);
  const model = params.model.toLowerCase();

  let table: typeof GPT_IMAGE_1 | undefined;
  if (model.includes("gpt-image-1.5") || model === "chatgpt-image-latest") {
    table = GPT_IMAGE_1_5;
  } else if (model.includes("gpt-image-1-mini") || model.includes("mini")) {
    table = GPT_IMAGE_1_MINI;
  } else if (model.includes("gpt-image-1") || model.includes("gpt-image")) {
    table = GPT_IMAGE_1;
  }

  if (table) {
    return table[bucket][tier];
  }

  return params.fallbackUsd ?? 0.167;
}
