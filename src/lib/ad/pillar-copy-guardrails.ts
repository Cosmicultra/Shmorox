import { PILLAR_SHARED_PROOF_STEPS } from "./visual-config";

const SHARED_PROOF_STEP_THEMES = [
  "Built by financial advisors, for financial advisors",
  "Time-saving workflow from statement, analysis, to PDF leave-behinds",
  "Enterprise power for every financial advisor",
];

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
    productCategory: "AI-powered financial advisor workflow",
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
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
  },
  "statement-intelligence": {
    productCategory: "AI-powered innovation for every financial advisor",
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
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
  },
  "portfolio-narrative": {
    productCategory: "AI-powered financial advisor workflow",
    headlineAnchor: "Reports clients actually want to see.",
    subheadAnchor:
      "Uses AI to show clients and prospects your value in the first meeting.",
    headlineThemes: [
      "Reports your clients actually want",
      "Client reports they will actually open",
      "Meeting materials clients care about",
    ],
    subheadThemes: [
      "Show prospects and clients your value from the first meeting",
      "AI helps you prove your value early with clients and prospects",
      "First-meeting reports that show why you are their advisor",
    ],
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
  },
  "operational-scale": {
    productCategory: "AI-powered financial advisor workflow",
    headlineAnchor: "Scale your business without adding headcount.",
    subheadAnchor:
      "Uses AI to reduce prospect prep time and grow without hiring more staff.",
    headlineThemes: [
      "Grow your business without new hires",
      "Scale up without adding headcount",
      "More clients, same team size",
    ],
    subheadThemes: [
      "Use AI to spend less time on prospects and grow without hiring",
      "Reduce time engaging prospects and grow your business with AI",
      "AI power to grow without hiring more employees",
    ],
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
  },
  "compliance-posture": {
    productCategory: "AI-powered financial advisor workflow",
    headlineAnchor: "AI that keeps you compliant and in control.",
    subheadAnchor:
      "Compliant analysis, compliant deliverables, compliant automated CRM constant contact.",
    headlineThemes: [
      "Stay compliant and stay in control with AI",
      "AI that supports compliance without taking your judgment",
      "Compliance you can trust, control you keep",
    ],
    subheadThemes: [
      "Compliant analysis, compliant deliverables, compliant automated CRM constant contacting",
      "Compliant analysis and deliverables plus automated CRM client outreach",
      "Compliant workflow from analysis to deliverables to client contact",
    ],
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
  },
  "company-launch": {
    productCategory: "AI-powered financial advisor workflow",
    headlineAnchor: "AdvisorPilot is live today",
    subheadAnchor:
      "Turns statements into analysis and client-ready materials for advisors.",
    headlineThemes: [
      "AdvisorPilot is live today",
      "AdvisorPilot launches today",
      "AdvisorPilot is live",
    ],
    subheadThemes: [
      "Turns statements into analysis and client-ready materials for advisors",
      "Statement intake through analysis to meeting materials for advisors",
      "AI that takes advisors from statements to client-ready reviews",
    ],
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
  },
  "custom-request": {
    productCategory: "AI-powered financial advisor workflow",
    headlineAnchor: "Your angle. Our product.",
    subheadAnchor:
      "Turns statements into analysis and client-ready materials for advisors.",
    headlineThemes: [
      "Headline must match the custom request topic while staying AdvisorPilot-specific",
      "Keep it short and scroll-stopping for financial advisors",
    ],
    subheadThemes: [
      "Concrete AdvisorPilot capability tied to the custom request",
      "Statement-to-materials workflow for advisors, framed around the requested angle",
    ],
    proofStepThemes: SHARED_PROOF_STEP_THEMES,
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
  Variations OK if still simple, catchy, and clearly AI-powered workflow software for financial advisors.
- Always say "financial advisor(s)" on ad cards — never standalone "advisor(s)" unless part of the AdvisorPilot brand name.
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
