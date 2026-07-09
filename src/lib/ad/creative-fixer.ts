import type { Finding } from "../types";
import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";
import { sanitizeNoEmDash } from "./content-guardrails";

interface AdCopy {
  headline: string;
  subhead: string;
  cta: string;
  disclaimer: string;
}

const REPLACEMENT_MAP: Record<string, string> = {
  "guaranteed returns": "structured workflow outcomes",
  "beat the market": "support your review process",
  "always outperforms": "designed for advisor workflows",
  "best": "purpose-built",
  "leading": "workflow-focused",
  "#1": "",
  "number one": "",
  "superior": "structured",
  "SEC-approved": "built for advisor workflows",
  "FINRA-certified": "designed for RIA operations",
  "replaces your judgment": "supports your judgment",
  "automated advice": "workflow automation",
  "we recommend you buy": "we help you prepare",
  "double your money": "streamline your process",
  "free": "request access",
  "guarantee": "workflow support",
};

function applyReplacements(text: string, findings: Finding[]): string {
  let result = text;

  for (const finding of findings) {
    if (finding.location) {
      const termsMatch = finding.location.match(/Detected terms: (.+)/);
      if (termsMatch) {
        const terms = termsMatch[1].replace("…", "").split(", ").map((t) => t.trim());
        for (const term of terms) {
          const replacement = REPLACEMENT_MAP[term.toLowerCase()] ?? REPLACEMENT_MAP[term];
          if (replacement !== undefined) {
            const regex = new RegExp(term, "gi");
            result = result.replace(regex, replacement);
          }
        }
      }
    }
  }

  for (const [phrase, replacement] of Object.entries(REPLACEMENT_MAP)) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (regex.test(result) && replacement) {
      result = result.replace(regex, replacement);
    } else if (regex.test(result) && !replacement) {
      result = result.replace(regex, "");
    }
  }

  return sanitizeNoEmDash(result.replace(/\s+/g, " ").trim());
}

export function fixAdCopy(copy: AdCopy, findings: Finding[]): AdCopy {
  const fixed: AdCopy = {
    headline: applyReplacements(copy.headline, findings),
    subhead: applyReplacements(copy.subhead, findings),
    cta: applyReplacements(copy.cta, findings),
    disclaimer: copy.disclaimer,
  };

  if (
    findings.some(
      (f) =>
        f.category.includes("RIA") ||
        f.category.includes("Financial") ||
        f.category.includes("Disclaimer")
    )
  ) {
    if (!fixed.disclaimer.includes(ADVISORPILOT_KNOWLEDGE.standardDisclaimer.slice(0, 30))) {
      fixed.disclaimer = ADVISORPILOT_KNOWLEDGE.standardDisclaimer;
    }
  }

  if (findings.some((f) => f.category === "AI Overclaim")) {
    fixed.subhead = fixed.subhead.includes("workflow")
      ? fixed.subhead
      : sanitizeNoEmDash(`${fixed.subhead} AI assists workflow, not investment advice.`).slice(0, 120);
  }

  return {
    headline: sanitizeNoEmDash(fixed.headline),
    subhead: sanitizeNoEmDash(fixed.subhead),
    cta: sanitizeNoEmDash(fixed.cta),
    disclaimer: sanitizeNoEmDash(fixed.disclaimer),
  };
}

export function buildClaimsText(copy: AdCopy): string {
  return sanitizeNoEmDash([copy.headline, copy.subhead, copy.cta, copy.disclaimer].join(" "));
}
