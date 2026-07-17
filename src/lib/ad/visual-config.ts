import { VISUAL_TOKENS } from "@/lib/tokens";
import { getPillarById } from "@/lib/knowledge/advisorpilot";
import { getLayoutVariantForPillar, getTemplateForPillar } from "./ad-template-registry";
import { sanitizeNoEmDash } from "./content-guardrails";
import {
  LAYOUT_EXAMPLE_BY_VARIANT,
  LAYOUT_LEGACY_BACKGROUNDS,
  getLayoutExamplesPromptBlock,
} from "./layout-examples";
import {
  getPrimaryScreenshotForPillar,
  type ProductScreenshot,
} from "./product-screenshots";

export { VISUAL_TOKENS };
export {
  PRODUCT_SCREENSHOTS,
  PILLAR_PRIMARY_SCREENSHOT,
  getScreenshotsForPillar,
  getPrimaryScreenshotForPillar,
  getProductScreenshotsPromptBlock,
} from "./product-screenshots";
export {
  LAYOUT_EXAMPLES,
  LAYOUT_EXAMPLE_BY_VARIANT,
  getLayoutExample,
  getLayoutExamplesForVariant,
  getLayoutExamplesPromptBlock,
} from "./layout-examples";

export type LayoutVariant = "split-office" | "split-clarity" | "diagonal-growth";

export type VisualStyle = "office-laptop" | "office-monitor" | "dashboard" | "diagonal";

export interface VisualPanelFrameConfig {
  rotateY: number;
  rotateX: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface PillarStep {
  icon: IconKey;
  title: string;
  description: string;
}

export const PILLAR_SHARED_PROOF_STEPS: PillarStep[] = [
  {
    icon: "users",
    title: "Built by advisors, for advisors",
    description: "Made by advisors who know the review grind.",
  },
  {
    icon: "clock",
    title: "Statement to PDF leave-behinds",
    description: "Less time on analysis and prep. More time with clients.",
  },
  {
    icon: "trend",
    title: "Enterprise power for every advisor",
    description: "Big-firm capability without big-firm overhead.",
  },
];

export const PILLAR_STEPS: Record<string, PillarStep[]> = {
  "prospect-workflow": PILLAR_SHARED_PROOF_STEPS,
  "statement-intelligence": PILLAR_SHARED_PROOF_STEPS,
};

/** Pillar overrides — e.g. prospect-workflow uses dashboard style on split-office layout. */
export const PILLAR_VISUAL_STYLE: Partial<Record<string, VisualStyle>> = {
  "prospect-workflow": "dashboard",
};

export const VISUAL_PANEL_CONFIG: Record<
  VisualStyle,
  VisualPanelFrameConfig & { device: "laptop" | "monitor" | "none" }
> = {
  "office-laptop": {
    device: "laptop",
    rotateY: -8,
    rotateX: 2,
    scale: 1,
    offsetX: -12,
    offsetY: 8,
  },
  "office-monitor": {
    device: "monitor",
    rotateY: -5,
    rotateX: 1,
    scale: 1.02,
    offsetX: -8,
    offsetY: 4,
  },
  dashboard: {
    device: "none",
    rotateY: -6,
    rotateX: 1.5,
    scale: 1.05,
    offsetX: 0,
    offsetY: 0,
  },
  diagonal: {
    device: "none",
    rotateY: 0,
    rotateX: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  },
};

export function getVisualStyle(
  pillarId?: string,
  layoutVariant: LayoutVariant = "split-office"
): VisualStyle {
  if (pillarId && PILLAR_VISUAL_STYLE[pillarId]) {
    return PILLAR_VISUAL_STYLE[pillarId]!;
  }
  if (layoutVariant === "diagonal-growth") return "diagonal";
  if (layoutVariant === "split-clarity") return "office-monitor";
  return "office-laptop";
}

export function getStepsForPillar(pillarId?: string): PillarStep[] | undefined {
  if (pillarId && PILLAR_STEPS[pillarId]) return PILLAR_STEPS[pillarId];
  return undefined;
}

export function usesStepList(pillarId?: string): boolean {
  return Boolean(pillarId && PILLAR_STEPS[pillarId]?.length);
}

export type IconKey =
  | "clock"
  | "pie"
  | "chart"
  | "clipboard"
  | "file"
  | "shield"
  | "cloud"
  | "users"
  | "target"
  | "check"
  | "trend";

export interface FeatureIcon {
  label: string;
  icon: IconKey;
}

export const PILLAR_LAYOUTS: Record<string, LayoutVariant> = {
  "prospect-workflow": "split-office",
  "statement-intelligence": "split-clarity",
  "portfolio-narrative": "split-office",
  "operational-scale": "diagonal-growth",
  "compliance-posture": "split-clarity",
};

/** Canonical layout-example PNGs (preferred). */
export const LAYOUT_BACKGROUNDS: Record<LayoutVariant, string> = {
  ...LAYOUT_EXAMPLE_BY_VARIANT,
};

/** Legacy paths (square-reference / template-*) — same files, older names. */
export const LAYOUT_LEGACY_PATHS = LAYOUT_LEGACY_BACKGROUNDS;

export function getLayoutExamplePath(variant: LayoutVariant): string {
  return LAYOUT_BACKGROUNDS[variant] ?? LAYOUT_LEGACY_PATHS["split-office"];
}

export function getLayoutInspirationBlock(variant?: LayoutVariant): string {
  return getLayoutExamplesPromptBlock(variant);
}

export const PILLAR_FEATURES: Record<string, FeatureIcon[]> = {
  "prospect-workflow": [
    { icon: "file", label: "Statement Ingestion" },
    { icon: "pie", label: "Portfolio Holdings" },
    { icon: "chart", label: "Insight Generation" },
    { icon: "clipboard", label: "Review Preparation" },
  ],
  "statement-intelligence": [
    { icon: "file", label: "PDF Extraction" },
    { icon: "pie", label: "Holdings Confirmed" },
    { icon: "target", label: "Anomaly Flags" },
    { icon: "check", label: "Reconciliation" },
  ],
  "portfolio-narrative": [
    { icon: "clock", label: "Save Hours on Prep" },
    { icon: "pie", label: "Deep Analysis" },
    { icon: "chart", label: "Actionable Insights" },
    { icon: "clipboard", label: "Confident Meetings" },
  ],
  "operational-scale": [
    { icon: "clock", label: "Faster Prep" },
    { icon: "chart", label: "Scale Reviews" },
    { icon: "trend", label: "Less Admin" },
    { icon: "users", label: "More Advice Time" },
  ],
  "compliance-posture": [
    { icon: "shield", label: "Workflow Traceability" },
    { icon: "users", label: "Advisor Judgment" },
    { icon: "chart", label: "Operational Analysis" },
    { icon: "check", label: "Supervision Ready" },
  ],
};

export const PILLAR_HIGHLIGHTS: Record<string, string> = {
  "prospect-workflow": "accelerated",
  "statement-intelligence": "actionable",
  "portfolio-narrative": "Understand",
  "operational-scale": "Not",
  "compliance-posture": "Judgment",
};

export const PILLAR_SUPPORTING: Record<string, string> = {
  "prospect-workflow": "Statement in. Materials out. You stay in the room.",
  "statement-intelligence": "PDFs in. Holdings confirmed. Analysis on solid ground.",
  "portfolio-narrative": "Your judgment. AdvisorPilot drafts the story.",
  "operational-scale": "More reviews. Same team. Stronger advice.",
  "compliance-posture": "Every step logged. Every output traceable.",
};

export const PILLAR_OUTCOME: Record<string, string> = {
  ...PILLAR_SUPPORTING,
};

export const FOOTER_TRUST: { icon: IconKey; label: string }[] = [
  { icon: "shield", label: "Secure. Your Data." },
  { icon: "cloud", label: "Scalable. Your Growth." },
  { icon: "users", label: "Built for Advisors." },
];

export function getLayoutForPillar(pillarId?: string): LayoutVariant {
  return getLayoutVariantForPillar(pillarId);
}

export function getTemplateDefinitionForPillar(pillarId?: string) {
  return getTemplateForPillar(pillarId);
}

/** Real product UI path for ad templates / creative (per pillar). */
export function getProductUiForPillar(pillarId?: string): ProductScreenshot | undefined {
  return getPrimaryScreenshotForPillar(pillarId);
}

export function getFeaturesForPillar(pillarId?: string): FeatureIcon[] {
  if (pillarId && PILLAR_FEATURES[pillarId]) return PILLAR_FEATURES[pillarId];
  return PILLAR_FEATURES["prospect-workflow"];
}

export function getHighlightForHeadline(headline: string, pillarId?: string): {
  before: string;
  highlight: string;
  after: string;
} {
  const highlight = pillarId ? PILLAR_HIGHLIGHTS[pillarId] : undefined;
  if (highlight) {
    const idx = headline.indexOf(highlight);
    if (idx !== -1) {
      return {
        before: headline.slice(0, idx),
        highlight,
        after: headline.slice(idx + highlight.length),
      };
    }
  }
  const match = headline.match(/\b(Never|Clarity|Not|judgment|headcount)\b/i);
  if (match && match.index !== undefined) {
    return {
      before: headline.slice(0, match.index),
      highlight: match[0],
      after: headline.slice(match.index + match[0].length),
    };
  }
  return { before: headline, highlight: "", after: "" };
}

export function getOutcomeLine(pillarId?: string): string {
  if (!pillarId) return "";
  const pillar = getPillarById(pillarId);
  if (pillar?.outcomeLine) return sanitizeNoEmDash(pillar.outcomeLine);
  if (PILLAR_OUTCOME[pillarId]) return sanitizeNoEmDash(PILLAR_OUTCOME[pillarId]);
  return "";
}

export function getSupportingLine(pillarId?: string): string {
  const template = getTemplateForPillar(pillarId);

  if (!template.copySchema.showSupportingLine) {
    return "";
  }

  if (template.copySchema.proofType === "steps") {
    return "";
  }

  const outcome = getOutcomeLine(pillarId);
  if (outcome) return outcome;

  const line =
    pillarId && PILLAR_SUPPORTING[pillarId]
      ? PILLAR_SUPPORTING[pillarId]
      : "Built for advisory teams who want efficiency without compromise.";
  return sanitizeNoEmDash(line);
}
