import {
  PERSONAL_BRAND_CHAR_LIMIT,
  PERSONAL_BRAND_KNOWLEDGE,
  PERSONAL_BRAND_TARGET_MAX_WORDS,
  PERSONAL_BRAND_TARGET_MIN_WORDS,
  getPersonalBrandCategory,
  type PersonalBrandCategoryId,
} from "@/lib/knowledge/personal-brand";

export interface PersonalBrandPromptInput {
  category: PersonalBrandCategoryId;
  /** Optional topic/angle from the user */
  topic?: string;
  /** Future Story Builder: answers from a short interview */
  storyAnswers?: string[];
  /** Topics/hooks used recently — avoid repeating */
  avoidedTopics?: string[];
}

export const PERSONAL_BRAND_SYSTEM = `You write LinkedIn posts in Christopher's authentic voice for financial advisors and founders.

You are not writing ads. You are not writing AdvisorPilot marketing copy. You are helping Christopher build personal brand through storytelling, education, and thought leadership.

Output valid JSON only.`;

export function buildPersonalBrandPrompt(input: PersonalBrandPromptInput): {
  system: string;
  user: string;
} {
  const k = PERSONAL_BRAND_KNOWLEDGE;
  const category = getPersonalBrandCategory(input.category);
  const topicBank = category?.topics.slice(0, 12).join("; ") ?? "";
  const storyBlock =
    input.storyAnswers && input.storyAnswers.length > 0
      ? `\nAdvisor story inputs (use these as the factual base; do not invent conflicting details):\n${input.storyAnswers
          .map((a, i) => `${i + 1}. ${a}`)
          .join("\n")}\n`
      : "";
  const topicBlock = input.topic?.trim()
    ? `\nOptional topic / angle from Christopher: ${input.topic.trim()}\n`
    : "";
  const avoidBlock =
    input.avoidedTopics && input.avoidedTopics.length > 0
      ? `\nAvoid repeating these recent angles:\n${input.avoidedTopics
          .slice(0, 10)
          .map((t) => `- ${t}`)
          .join("\n")}\n`
      : "";

  const user = `Write one LinkedIn post as Christopher.

IDENTITY
Name: ${k.advisorName}
Roles: ${k.identities.join("; ")}
Expertise: ${k.expertise.join("; ")}

VOICE
${k.voice.map((v) => `- ${v}`).join("\n")}

STRUCTURE (required)
${k.structureRules.map((r) => `- ${r}`).join("\n")}

LENGTH
- Target ${PERSONAL_BRAND_TARGET_MIN_WORDS}–${PERSONAL_BRAND_TARGET_MAX_WORDS} words
- Hard maximum ${PERSONAL_BRAND_CHAR_LIMIT} characters including hashtags
- Short paragraphs, lots of whitespace, easy on mobile

CATEGORY FOR THIS POST
${category?.title ?? input.category}: ${category?.description ?? ""}
Suggested topic angles (pick one or invent a fitting one in the same vein): ${topicBank}

PRODUCT MENTIONS
${k.productMentionGuidance}
${input.category === "product-updates" ? "This is a product-updates post — AdvisorPilot may appear naturally, but never as a sales pitch or feature dump." : "Prefer little or no AdvisorPilot mention unless the story requires it."}

COMPLIANCE
${k.complianceRules.map((r) => `- ${r}`).join("\n")}

NEVER USE THESE PHRASES
${k.avoidPhrases.map((p) => `- "${p}"`).join("\n")}

HASHTAGS
Choose 3–5 highly relevant tags. Mix broad and niche. Do not force unfit tags. Do not repeat the same set every time.
Example pools (guidance only): ${[...k.hashtagPools.broad, ...k.hashtagPools.niche].join(" ")}
${topicBlock}${storyBlock}${avoidBlock}
HOOK EXAMPLES (style only — invent a fresh hook, do not copy):
- "I almost didn't build AdvisorPilot."
- "The biggest mistake I made in my first ten years as an advisor..."
- "I learned something from a client that completely changed my business."
- "AI isn't replacing advisors."
- "Retirement planning has a communication problem."

Return JSON exactly in this shape:
{
  "post": "<the finished LinkedIn post only: body, then blank line, then 3-5 hashtags. No title. No markdown. No wrapping quotes. No explanation.>",
  "category": "${input.category}",
  "topic": "<short phrase naming the angle you chose>"
}`;

  return { system: PERSONAL_BRAND_SYSTEM, user };
}
