import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";
import { extractExplicitCustomHeadline } from "./explicit-custom-headline";
import { normalizeHeadlineKey } from "./custom-headline-history";

/** Ground custom-request campaigns in AdvisorPilot product facts + the user's topic. */
export function buildCustomRequestContext(
  customRequest?: string,
  avoidedHeadlines?: string[]
): string {
  const topic = customRequest?.trim();
  if (!topic) return "";

  const explicitHeadline = extractExplicitCustomHeadline(topic);
  const valueProps = ADVISORPILOT_KNOWLEDGE.valueProps
    .map((line) => `- ${line}`)
    .join("\n");
  const approved = ADVISORPILOT_KNOWLEDGE.approvedPhrases
    .slice(0, 6)
    .map((line) => `- ${line}`)
    .join("\n");
  const pillars = ADVISORPILOT_KNOWLEDGE.contentPillars
    .filter((p) => p.id !== "custom-request")
    .map((p) => `- ${p.title}: ${p.description}`)
    .join("\n");

  const explicitKey = explicitHeadline
    ? normalizeHeadlineKey(explicitHeadline)
    : "";
  const avoidList = (avoidedHeadlines ?? [])
    .map((h) => h.trim())
    .filter(Boolean)
    .filter((h) => !explicitKey || normalizeHeadlineKey(h) !== explicitKey);
  const uniqueAvoid = [...new Set(avoidList)].slice(0, 40);

  const headlineRules = explicitHeadline
    ? `
EXPLICIT HEADLINE REQUIRED (user stated the title — use it exactly):
"${explicitHeadline}"
- Use that exact headline on the ad card. Reuse is allowed because the user requested it.
- Do not invent a different headline.
`
    : `
HEADLINE RULES (no explicit title in the request):
- Write a FRESH headline every time — unique to this campaign and this topic.
- Never reuse prior custom-request headlines.
- NEVER use "Your angle. Our product." or close variants. That is a UI placeholder, not ad copy.
`;

  const avoidBlock =
    !explicitHeadline && uniqueAvoid.length > 0
      ? `
HEADLINES ALREADY USED (do not reuse or lightly rephrase these):
${uniqueAvoid.map((h) => `- "${h}"`).join("\n")}
`
      : "";

  return `
CUSTOM REQUEST (user topic — this campaign must address this angle):
"""
${topic}
"""

ADVISORPILOT PRODUCT RESEARCH (use only these facts — do not invent features):
What AdvisorPilot is: purpose-built AI workflow software for independent financial advisors / RIAs.
Tagline: ${ADVISORPILOT_KNOWLEDGE.tagline}
Brand tagline: ${ADVISORPILOT_KNOWLEDGE.brandTagline}

Core value props:
${valueProps}

Related product pillars you may lean on if they fit the request:
${pillars}

Approved phrases (optional):
${approved}

Prohibited: ${ADVISORPILOT_KNOWLEDGE.prohibitedClaims.join("; ")}
${headlineRules}${avoidBlock}
Instructions:
- Interpret the custom request as the post angle/topic.
- Ground every claim in the product research above.
- Prefer concrete workflow language (statements, holdings, analysis, deliverables, reviews).
- Headline and supportingCopy must still pass the FA stranger test (what it does + who for).
- Do not invent integrations, certifications, or outcomes not listed above.`;
}
