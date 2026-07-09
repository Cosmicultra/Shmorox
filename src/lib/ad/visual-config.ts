import { VISUAL_TOKENS } from "@/lib/tokens";
import { sanitizeNoEmDash } from "./content-guardrails";

export { VISUAL_TOKENS };

export type LayoutVariant = "split-office" | "split-clarity" | "diagonal-growth";
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

export const LAYOUT_BACKGROUNDS: Record<LayoutVariant, string> = {
  "split-office": "/ad-assets/square-reference.png",
  "split-clarity": "/ad-assets/template-clarity.png",
  "diagonal-growth": "/ad-assets/template-growth.png",
};

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
  "prospect-workflow": "Never",
  "statement-intelligence": "Holdings",
  "portfolio-narrative": "Understand",
  "operational-scale": "Not",
  "compliance-posture": "Judgment",
};

export const PILLAR_SUPPORTING: Record<string, string> = {
  "prospect-workflow":
    "Analyze holdings. Generate insights. Prepare reviews. Stay organized.",
  "statement-intelligence":
    "From custodian PDFs to confirmed holdings, before analysis depends on them.",
  "portfolio-narrative":
    "AdvisorPilot™ helps you analyze, summarize, and prepare, so you can focus on what matters most.",
  "operational-scale":
    "Smarter reviews. Stronger advice. Built for modern advisory teams.",
  "compliance-posture":
    "Operational analysis separated from fiduciary advice, built for disciplined firms.",
};

export const FOOTER_TRUST: { icon: IconKey; label: string }[] = [
  { icon: "shield", label: "Secure. Your Data." },
  { icon: "cloud", label: "Scalable. Your Growth." },
  { icon: "users", label: "Built for Advisors." },
];

export function getLayoutForPillar(pillarId?: string): LayoutVariant {
  if (pillarId && PILLAR_LAYOUTS[pillarId]) return PILLAR_LAYOUTS[pillarId];
  return "split-office";
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

export function getSupportingLine(pillarId?: string): string {
  const line =
    pillarId && PILLAR_SUPPORTING[pillarId]
      ? PILLAR_SUPPORTING[pillarId]
      : "Built for advisory teams who want efficiency without compromise.";
  return sanitizeNoEmDash(line);
}
