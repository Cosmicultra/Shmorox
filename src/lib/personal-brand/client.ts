import type { PersonalBrandCategoryId } from "@/lib/knowledge/personal-brand";
import type { GenerationCostDelta } from "@/lib/openai/cost-tracker";

export interface GeneratePersonalBrandPostClientResult {
  post: string;
  category: PersonalBrandCategoryId;
  topic: string;
  source: "openai" | "template";
  fallback?: boolean;
  message?: string;
  costDelta?: GenerationCostDelta;
}

export async function fetchPersonalBrandPost(input: {
  category?: PersonalBrandCategoryId;
  topic?: string;
  storyAnswers?: string[];
  recentCategories?: PersonalBrandCategoryId[];
  avoidedTopics?: string[];
}): Promise<GeneratePersonalBrandPostClientResult> {
  const response = await fetch("/api/generate-personal-brand-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as GeneratePersonalBrandPostClientResult & {
    error?: string;
  };

  if (!response.ok || !data.post) {
    throw new Error(data.error ?? data.message ?? "Personal brand generation failed");
  }

  return {
    post: data.post,
    category: data.category,
    topic: data.topic,
    source: data.source,
    fallback: data.fallback,
    message: data.message,
    costDelta: data.costDelta,
  };
}
