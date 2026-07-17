import { PILLAR_SHARED_PROOF_STEPS } from "./visual-config";

export interface PillarMessagingAnchors {
  productCategory: string;
  headlineAnchor: string;
  subheadAnchor: string;
  /** Plain-language themes the AI may rephrase but must preserve */
  headlineThemes: string[];
  subheadThemes: string[];
  proofStepThemes: string[];
}

const PILLAR_MESSAGING: Record<string, PillarMessagingAnchors> = {
  "prospect-workflow": {
    productCategory: "AI-powered advisor workflow",
    headlineAnchor: "Client reviews, accelerated.",
    subheadAnchor:
      "Automates client review prep from statement intake to meeting materials.",
    headlineThemes: [
      "Client reviews move faster",
      "Review prep without the scramble",
      "Accelerated client reviews",
    ],
    subheadThemes: [
      "Automates review prep from statements to meeting-ready materials",
      "Statement intake through analysis to what you bring to the meeting",
    ],
    proofStepThemes: PILLAR_SHARED_PROOF_STEPS.map(
      (s) => `${s.title}: ${s.description}`
    ),
  },
  "statement-intelligence": {
    productCategory: "AI-powered innovation for every advisor",
    headlineAnchor: "From static statements to actionable data.",
    subheadAnchor:
      "Extracts custodian statements, confirms holdings, and powers detailed analysis.",
    headlineThemes: [
      "Turn PDF statements into data you can act on",
      "Static statements become actionable insight",
      "From paper statements to clear holdings and analysis",
    ],
    subheadThemes: [
      "Pulls custodian statements, verifies holdings, then supports deep analysis",
      "Statement extraction, holdings confirmation, and analysis in one flow",
    ],
    proofStepThemes: PILLAR_SHARED_PROOF_STEPS.map(
      (s) => `${s.title}: ${s.description}`
    ),
  },
};

export function getPillarMessagingAnchors(
  pillarId?: string
): PillarMessagingAnchors | undefined {
  if (!pillarId) return undefined;
  return PILLAR_MESSAGING[pillarId];
}

/**
 * Prompt block: canonical copy + allowed creative variance for AI generation.
 */
export function getPillarCopyGuardrailsPromptBlock(pillarId?: string): string {
  const anchors = getPillarMessagingAnchors(pillarId);
  if (!anchors) return "";

  return `
PILLAR COPY GUARDRAILS (canonical messaging — light rephrasing OK, same meaning required):
- Product category (above headline): anchor "${anchors.productCategory}"
  Variations OK if still simple, catchy, and clearly AI-powered workflow software for advisors.
- Headline: anchor "${anchors.headlineAnchor}"
  Same idea as: ${anchors.headlineThemes.map((t) => `"${t}"`).join("; ")}
  Keep it short. No jargon. No em-dashes.
- Subhead / supportingCopy: anchor "${anchors.subheadAnchor}"
  Same idea as: ${anchors.subheadThemes.map((t) => `"${t}"`).join("; ")}
  Must stay concrete (what the product does). Plain English. Not overly technical.
- Proof steps (3 bullets on the card — titles are visible; keep descriptions ≤48 chars):
${PILLAR_SHARED_PROOF_STEPS.map(
    (s, i) =>
      `  ${i + 1}. Title ~ "${s.title}" — ${s.description} (theme: ${anchors.proofStepThemes[i]})`
  ).join("\n")}
  You may reword titles/descriptions for rhythm, but each bullet must hit the same point as the anchor.
- Do NOT drift into generic SaaS hype, dense fintech jargon, or repeat footer trust lines in the subhead.`;
}
