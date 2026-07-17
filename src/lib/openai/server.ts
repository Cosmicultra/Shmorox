import { getModelForTier, type ModelTier } from "./config";
import { getOpenAIConfig } from "./config";
import { getActiveCostTracker } from "./cost-tracker-server";
import { isRetryableOpenAIError, parseResponseBody, sleep } from "./http";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export interface GenerateJSONOptions {
  tier?: ModelTier;
}

const MAX_ATTEMPTS = 2;

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerateJSONOptions
): Promise<T> {
  const { apiKey } = getOpenAIConfig();
  const tier = options?.tier ?? "exploration";
  const model = getModelForTier(tier);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const rawBody = await response.text();
      const data = parseResponseBody<ChatCompletionResponse>(
        rawBody,
        `OpenAI chat completions (${response.status})`
      );

      if (!response.ok) {
        const err = data.error;
        const detail = [
          err?.message,
          err?.type ? `type=${err.type}` : null,
          err?.code ? `code=${err.code}` : null,
          `http=${response.status}`,
        ]
          .filter(Boolean)
          .join(" | ");
        throw new Error(detail || `OpenAI request failed (${response.status})`);
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("OpenAI returned an empty message");
      }

      getActiveCostTracker()?.recordTextCall(tier, data.usage);

      try {
        return JSON.parse(content) as T;
      } catch {
        throw new Error(
          `OpenAI model returned non-JSON content: ${content.slice(0, 160)}${content.length > 160 ? "…" : ""}`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_ATTEMPTS && isRetryableOpenAIError(lastError)) {
        await sleep(1500 * attempt);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error("OpenAI request failed");
}
