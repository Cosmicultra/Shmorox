import type { LayoutLintIssue } from "./ad-layout-linter";
import { getPillarById } from "@/lib/knowledge/advisorpilot";

export interface PillarProductClarity {
  productCategory: string;
  whatWeDo: string;
  whoItsFor: string;
  whyDifferent: string;
}

export const TRUST_BADGE = "Secure. Your Data.";

export const PILLAR_PRODUCT_CLARITY: Record<string, PillarProductClarity> = {
  "statement-intelligence": {
    productCategory: "AI-powered innovation for every advisor",
    whatWeDo:
      "Extracts custodian statements, confirms holdings, and powers detailed analysis.",
    whoItsFor: "Built by advisors, for advisors.",
    whyDifferent: "Enterprise power for every advisor.",
  },
  "prospect-workflow": {
    productCategory: "AI-powered advisor workflow",
    whatWeDo: "Automates client review prep from statement intake to meeting materials.",
    whoItsFor: "Built by advisors, for advisors.",
    whyDifferent: "Enterprise power for every advisor.",
  },
  "portfolio-narrative": {
    productCategory: "Advisor workflow software",
    whatWeDo: "Drafts client-ready portfolio narratives from your holdings data.",
    whoItsFor: "Built for independent advisors.",
    whyDifferent: "AI assists prep — you keep fiduciary judgment.",
  },
  "operational-scale": {
    productCategory: "Advisor workflow software",
    whatWeDo: "Scales review prep so your team handles more clients without hiring.",
    whoItsFor: "Built for growing advisory firms.",
    whyDifferent: "Operational workflow software — not headcount.",
  },
  "compliance-posture": {
    productCategory: "Advisor workflow software",
    whatWeDo: "Traces every step from statement intake to client deliverables.",
    whoItsFor: "Built for supervised advisory teams.",
    whyDifferent: "Workflow traceability advisors cannot get from spreadsheets.",
  },
};

export const CAPABILITY_VERBS = [
  "extract",
  "confirm",
  "draft",
  "automate",
  "trace",
  "scale",
  "prep",
  "structure",
  "ingest",
  "reconcile",
  "deliver",
  "turn",
];

const AUDIENCE_TERMS = [
  "advisor",
  "advisors",
  "ria",
  "rias",
  "wealth",
  "advisory",
  "financial",
];

const VAGUE_PATTERNS = [
  /\btransforming\b/i,
  /\bleveraging\b/i,
  /\bsolution\b/i,
  /\bplatform\b(?!\s+tool)/i,
  /\bunlock\b/i,
  /\bempower\b/i,
  /\bstreamline\b(?!\s+(prep|workflow|reviews))/i,
];

const DEFAULT_CLARITY = PILLAR_PRODUCT_CLARITY["prospect-workflow"];

export function getProductClarityForPillar(pillarId?: string): PillarProductClarity {
  if (pillarId && PILLAR_PRODUCT_CLARITY[pillarId]) {
    return PILLAR_PRODUCT_CLARITY[pillarId];
  }
  return DEFAULT_CLARITY;
}

export function getWhatWeDoSeed(pillarId?: string): string {
  const clarity = getProductClarityForPillar(pillarId);
  const pillar = pillarId ? getPillarById(pillarId) : undefined;
  return pillar?.subhead?.trim() || clarity.whatWeDo;
}

function hasCapabilityVerb(text: string): boolean {
  const lower = text.toLowerCase();
  return CAPABILITY_VERBS.some((verb) => lower.includes(verb));
}

function hasAudienceReference(text: string, productCategory?: string): boolean {
  const combined = `${productCategory ?? ""} ${text}`.toLowerCase();
  return AUDIENCE_TERMS.some((term) => combined.includes(term));
}

export function isVagueSubhead(text: string): boolean {
  if (!text.trim()) return true;
  return VAGUE_PATTERNS.some((pattern) => pattern.test(text));
}

export function passesStrangerTest(
  subhead: string,
  clarity: PillarProductClarity
): boolean {
  if (!subhead.trim()) return false;
  if (isVagueSubhead(subhead)) return false;
  if (!hasCapabilityVerb(subhead)) return false;
  if (!hasAudienceReference(subhead, clarity.productCategory) && !hasAudienceReference(clarity.whoItsFor)) {
    return false;
  }
  return true;
}

export function resolveWhatWeDoCopy(
  pillarId: string | undefined,
  candidateSubhead: string
): string {
  const clarity = getProductClarityForPillar(pillarId);
  const trimmed = candidateSubhead.trim();
  if (passesStrangerTest(trimmed, clarity)) {
    return trimmed;
  }
  return getWhatWeDoSeed(pillarId);
}

export interface ProductClarityValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductClarityCopy(options: {
  pillarId?: string;
  subhead: string;
  productCategory?: string;
  whoItsFor?: string;
  whyDifferent?: string;
}): ProductClarityValidation {
  const clarity = getProductClarityForPillar(options.pillarId);
  const productCategory = options.productCategory ?? clarity.productCategory;
  const whoItsFor = options.whoItsFor ?? clarity.whoItsFor;
  const whyDifferent = options.whyDifferent ?? clarity.whyDifferent;
  const subhead = options.subhead.trim();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!productCategory.trim()) {
    errors.push("Product category line is required.");
  }
  if (!subhead) {
    errors.push("whatWeDo / subhead is required.");
  } else {
    if (!hasCapabilityVerb(subhead)) {
      errors.push("Subhead must describe a concrete product action (extract, confirm, draft, etc.).");
    }
    if (!hasAudienceReference(subhead, productCategory) && !hasAudienceReference(whoItsFor)) {
      errors.push("Copy must identify the advisor/RIA audience.");
    }
    if (isVagueSubhead(subhead)) {
      errors.push("Subhead is too vague — state what AdvisorPilot does in plain English.");
    }
  }
  if (!whoItsFor.trim()) {
    errors.push("whoItsFor line is required.");
  }
  if (!whyDifferent.trim()) {
    errors.push("whyDifferent line is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function lintProductClarity(options: {
  pillarId?: string;
  subhead: string;
}): LayoutLintIssue[] {
  const result = validateProductClarityCopy({
    pillarId: options.pillarId,
    subhead: options.subhead,
  });

  return result.errors.map((message) => ({
    code: "PRODUCT_CLARITY",
    message,
    severity: "error" as const,
  }));
}
