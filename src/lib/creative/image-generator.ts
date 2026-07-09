import { getOpenAIConfig } from "../openai/config";
import { getActiveCostTracker } from "../openai/cost-tracker-server";
import { isRetryableOpenAIError, parseResponseBody, sleep } from "../openai/http";
import { buildMasterImagePrompt, buildNegativePrompt } from "./image-prompts";
import type { AspectRatio } from "../types";
import type { CreativeBrief } from "./types";

interface ImageGenerationResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
}

const ASPECT_TO_SIZE: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "9:16": "1024x1792",
};

function getImageModel(): string {
  return getOpenAIConfig().imageModel;
}

function promptWithNegatives(prompt: string, negativePrompt?: string): string {
  if (!negativePrompt?.trim()) return prompt;
  return `${prompt}\n\nAvoid the following: ${negativePrompt}`;
}

async function callImagesAPI(prompt: string, size: string, negativePrompt?: string): Promise<string> {
  const { apiKey } = getOpenAIConfig();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: getImageModel(),
    prompt: promptWithNegatives(prompt, negativePrompt),
    size,
    n: 1,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const rawBody = await response.text();
      const data = parseResponseBody<ImageGenerationResponse>(
        rawBody,
        `OpenAI image generations (${response.status})`
      );

      if (!response.ok) {
        throw new Error(data.error?.message ?? `Image generation failed (${response.status})`);
      }

      const item = data.data?.[0];
      if (item?.b64_json) {
        getActiveCostTracker()?.recordImageGeneration();
        return `data:image/png;base64,${item.b64_json}`;
      }
      if (item?.url) {
        getActiveCostTracker()?.recordImageGeneration();
        return item.url;
      }

      throw new Error("Image API returned no image data");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < 2 && isRetryableOpenAIError(lastError)) {
        await sleep(1500 * attempt);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error("Image generation failed");
}

export async function generateMasterImage(brief: CreativeBrief): Promise<string> {
  const prompt = buildMasterImagePrompt(brief);
  const negativePrompt = buildNegativePrompt(brief);
  return callImagesAPI(prompt, ASPECT_TO_SIZE["1:1"], negativePrompt);
}

export interface ImageGenerationOptions {
  /** When true, generates AI preview images for every concept brief (expensive). */
  generateConceptImages?: boolean;
  conceptBriefs?: CreativeBrief[];
}

/**
 * Phase 3: generate exactly ONE master image for the winning concept.
 * Phase 4 layout adaptation (non-1:1 ratios) is handled via canvas rendering, not AI.
 */
export async function generateAdaptedImages(
  brief: CreativeBrief,
  aspectRatios: AspectRatio[],
  onProgress?: (message: string) => void,
  options?: ImageGenerationOptions
): Promise<{ masterImageUrl: string; adaptedImages: Partial<Record<AspectRatio, string>> }> {
  if (options?.generateConceptImages) {
    const conceptBriefs = options.conceptBriefs?.length
      ? options.conceptBriefs
      : [brief];

    onProgress?.(
      `Generating AI preview images for ${conceptBriefs.length} concepts (explicit opt-in)…`
    );

    const previews = await Promise.all(
      conceptBriefs.map((conceptBrief) => generateMasterImage(conceptBrief))
    );

    const masterImageUrl = previews[0];
    const adaptedImages: Partial<Record<AspectRatio, string>> = {
      "1:1": masterImageUrl,
    };

    for (const ratio of aspectRatios) {
      if (ratio !== "1:1") {
        adaptedImages[ratio] = masterImageUrl;
      }
    }

    return { masterImageUrl, adaptedImages };
  }

  onProgress?.("Generating master creative concept (single AI image)…");
  const masterImageUrl = await generateMasterImage(brief);

  const adaptedImages: Partial<Record<AspectRatio, string>> = {
    "1:1": masterImageUrl,
  };

  for (const ratio of aspectRatios) {
    if (ratio !== "1:1") {
      adaptedImages[ratio] = masterImageUrl;
    }
  }

  onProgress?.(
    aspectRatios.some((ratio) => ratio !== "1:1")
      ? "Non-square formats will be adapted via layout rendering (no additional AI images)."
      : "Master image ready."
  );

  return { masterImageUrl, adaptedImages };
}

export function isImageGenerationAvailable(): boolean {
  return getOpenAIConfig().enabled;
}

export function assertSingleConceptImageGeneration(
  generateConceptImages?: boolean,
  conceptCount = 1
): void {
  if (!generateConceptImages && conceptCount > 1) {
    throw new Error(
      "Multi-concept image generation is disabled. Enable generateConceptImages to preview concepts with AI."
    );
  }
}
