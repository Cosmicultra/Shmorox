import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";

/** Ground custom-request campaigns in AdvisorPilot product facts + the user's topic. */
export function buildCustomRequestContext(customRequest?: string): string {
  const topic = customRequest?.trim();
  if (!topic) return "";

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

Instructions:
- Interpret the custom request as the post angle/topic.
- Ground every claim in the product research above.
- Prefer concrete workflow language (statements, holdings, analysis, deliverables, reviews).
- Headline and supportingCopy must still pass the FA stranger test (what it does + who for).
- Do not invent integrations, certifications, or outcomes not listed above.`;
}
