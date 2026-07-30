import { NextRequest, NextResponse } from "next/server";
import type { PersonalBrandCategoryId } from "@/lib/knowledge/personal-brand";
import { deltaToReport } from "@/lib/openai/cost-tracker";
import { withCostTracking } from "@/lib/openai/cost-tracker-server";
import { getOpenAIConfig } from "@/lib/openai/config";
import {
  inferCategoryFromTopic,
  pickPersonalBrandCategory,
} from "@/lib/personal-brand/category-rotator";
import { generatePersonalBrandPost } from "@/lib/personal-brand/generator";

interface PersonalBrandRequest {
  category?: PersonalBrandCategoryId;
  topic?: string;
  storyAnswers?: string[];
  recentCategories?: PersonalBrandCategoryId[];
  avoidedTopics?: string[];
}

const VALID_CATEGORIES = new Set<PersonalBrandCategoryId>([
  "education",
  "founder-journey",
  "product-updates",
  "personal",
]);

export async function POST(req: NextRequest) {
  let input: PersonalBrandRequest;

  try {
    input = (await req.json()) as PersonalBrandRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const topic = input.topic?.trim();
  const inferred = topic ? inferCategoryFromTopic(topic) : undefined;
  const category: PersonalBrandCategoryId =
    input.category && VALID_CATEGORIES.has(input.category)
      ? input.category
      : inferred ?? pickPersonalBrandCategory(input.recentCategories ?? []);

  try {
    const { value, cost } = await withCostTracking(async () =>
      generatePersonalBrandPost({
        category,
        topic,
        storyAnswers: input.storyAnswers,
        avoidedTopics: input.avoidedTopics,
      })
    );

    return NextResponse.json({
      post: value.post,
      category: value.category,
      topic: value.topic,
      source: value.source,
      fallback: value.fallback,
      message: value.message,
      model: getOpenAIConfig().model,
      costDelta: cost,
      costReport: deltaToReport(cost),
    });
  } catch (error) {
    console.error("Personal brand API failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Personal brand generation failed",
      },
      { status: 500 }
    );
  }
}
