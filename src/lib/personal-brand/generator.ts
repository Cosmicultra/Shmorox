import {
  PERSONAL_BRAND_CHAR_LIMIT,
  type PersonalBrandCategoryId,
} from "@/lib/knowledge/personal-brand";
import { getOpenAIConfig } from "@/lib/openai/config";
import { generateJSON } from "@/lib/openai/server";
import {
  buildPersonalBrandPrompt,
  type PersonalBrandPromptInput,
} from "./prompts";

export interface PersonalBrandGenerationResult {
  post: string;
  category: PersonalBrandCategoryId;
  topic: string;
  source: "openai" | "template";
  fallback?: boolean;
  message?: string;
}

interface PersonalBrandAIResponse {
  post?: string;
  category?: string;
  topic?: string;
}

const HASHTAG_LINE_RE = /(?:^|\n)(#[\w]+(?:\s+#[\w]+){2,4})\s*$/;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractHashtags(post: string): string[] {
  const matches = post.match(/#[\w]+/g);
  return matches ?? [];
}

/** Replace em/en dashes without collapsing intentional LinkedIn whitespace. */
function sanitizePostDashes(text: string): string {
  return text
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/,\s*,+/g, ",")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n +/g, "\n")
    .trim();
}

/** Ensure hashtags sit at the end; trim over LinkedIn limit. */
export function normalizePersonalBrandPost(raw: string): string {
  let post = sanitizePostDashes(raw.trim());
  // Strip wrapping quotes the model sometimes adds
  if (
    (post.startsWith('"') && post.endsWith('"')) ||
    (post.startsWith("'") && post.endsWith("'"))
  ) {
    post = post.slice(1, -1).trim();
  }

  // Collapse 3+ blank lines to 2
  post = post.replace(/\n{3,}/g, "\n\n");

  if (post.length > PERSONAL_BRAND_CHAR_LIMIT) {
    const tags = extractHashtags(post);
    const tagBlock = tags.slice(0, 5).join(" ");
    const bodyBudget = PERSONAL_BRAND_CHAR_LIMIT - tagBlock.length - 2;
    let body = post.replace(HASHTAG_LINE_RE, "").trim();
    if (body.length > bodyBudget) {
      body = `${body.slice(0, Math.max(0, bodyBudget - 1)).trimEnd()}…`;
    }
    post = tagBlock ? `${body}\n\n${tagBlock}` : body.slice(0, PERSONAL_BRAND_CHAR_LIMIT);
  }

  return post;
}

function templateFallback(
  category: PersonalBrandCategoryId,
  topic?: string
): PersonalBrandGenerationResult {
  const angle = topic?.trim() || "a lesson from the practice";
  const post = normalizePersonalBrandPost(`I learned something recently about ${angle}.

Early in my career, I thought the answer was always more information. More charts. More preparation. More talking.

What clients and advisors actually respond to is clarity.

One clear takeaway beats ten clever points.

When I started building AdvisorPilot, this same idea kept showing up. The work that matters is the work that helps someone decide with confidence.

If you are an advisor reading this, try this: before your next meeting, write one sentence that captures the single most important thing the client needs to understand. Leave the rest for later.

Have you noticed the same thing in your practice?

#FinancialAdvisor #FinancialPlanning #Leadership #PracticeManagement #ClientExperience`);

  return {
    post,
    category,
    topic: angle,
    source: "template",
    fallback: true,
    message: "Used template fallback for personal brand post.",
  };
}

export async function generatePersonalBrandPost(
  input: PersonalBrandPromptInput
): Promise<PersonalBrandGenerationResult> {
  const { enabled } = getOpenAIConfig();

  if (!enabled) {
    return {
      ...templateFallback(input.category, input.topic),
      message: "Add OPENAI_API_KEY to .env.local to enable AI personal brand posts.",
    };
  }

  try {
    const { system, user } = buildPersonalBrandPrompt(input);
    const ai = await generateJSON<PersonalBrandAIResponse>(system, user, {
      tier: "premium",
    });

    if (!ai.post?.trim()) {
      throw new Error("OpenAI did not return a personal brand post");
    }

    const post = normalizePersonalBrandPost(ai.post);
    const hashtags = extractHashtags(post);
    if (hashtags.length < 3) {
      // Soft-accept; still return the post
      console.warn("[personal-brand] post has fewer than 3 hashtags");
    }

    if (countWords(post) < 80) {
      throw new Error("Generated personal brand post was too short");
    }

    return {
      post,
      category: input.category,
      topic: ai.topic?.trim() || input.topic?.trim() || input.category,
      source: "openai",
    };
  } catch (error) {
    console.error("Personal brand generation failed, using template:", error);
    return {
      ...templateFallback(input.category, input.topic),
      message:
        error instanceof Error
          ? error.message
          : "OpenAI request failed. Used template fallback.",
    };
  }
}
