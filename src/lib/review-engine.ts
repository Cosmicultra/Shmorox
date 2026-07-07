import type { AssetType, Finding, ReviewSubmission, RiskLevel } from "./types";

const CLAIM_PATTERNS = [
  {
    pattern: /\b(kill|kills|eliminates?|99\.9%|disinfect|antibacterial|germ[- ]?free)\b/gi,
    category: "Product Efficacy",
    title: "Disinfection or germ-kill claim detected",
    summary: "This material appears to make a killing or disinfection claim.",
    detail:
      "Disinfectant and antimicrobial claims are heavily regulated. In the U.S., EPA-registered products require claims that match approved label language. Comparative germ-kill claims against competitors require robust substantiation.",
    regulation: "FTC Act §5 · EPA FIFRA · NAD substantiation standards",
    recommendation:
      "Confirm the claim matches EPA-approved label language exactly. Ensure comparative claims are supported by head-to-head testing under GLP conditions.",
    baseRisk: "action-required" as RiskLevel,
  },
  {
    pattern: /\b(#1|number one|best|leading|most effective|superior)\b/gi,
    category: "Comparative Advertising",
    title: "Superiority or ranking claim detected",
    summary: "This material may imply the product is #1 or better than alternatives.",
    detail:
      "Comparative and superiority claims require a reasonable basis — typically well-designed consumer or laboratory testing. Implied rankings can trigger NAD challenges and Lanham Act disputes.",
    regulation: "FTC substantiation · NAD · Lanham Act",
    recommendation:
      "Attach the substantiation study behind any ranking claim. Add clear qualifiers (category, geography, time period) visible to consumers.",
    baseRisk: "caution" as RiskLevel,
  },
  {
    pattern: /\b(eco[- ]?friendly|sustainable|green|recyclable|ocean[- ]?bound|biodegradable|carbon[- ]?neutral)\b/gi,
    category: "Environmental Claims",
    title: "Environmental or sustainability claim detected",
    summary: "This material references environmental benefits.",
    detail:
      "Green claims are a top FTC and global enforcement priority. Terms like 'recyclable,' 'sustainable,' and 'ocean-bound' require specific substantiation and often need qualifiers about scope and availability.",
    regulation: "FTC Green Guides · EU Green Claims Directive · ACCC",
    recommendation:
      "Verify each environmental claim against supporting lifecycle data. Add qualifiers where recycling or composting is not universally available.",
    baseRisk: "caution" as RiskLevel,
  },
  {
    pattern: /\b(natural|organic|clean|non[- ]?toxic|chemical[- ]?free|plant[- ]?based)\b/gi,
    category: "Natural & Clean Claims",
    title: "Natural or 'clean' positioning detected",
    summary: "This material uses natural, clean, or non-toxic language.",
    detail:
      "'Natural' and 'chemical-free' can be misleading if the product contains synthetic ingredients. 'Non-toxic' may imply safety claims that require substantiation.",
    regulation: "FTC · FDA (cosmetics/food) · NAD",
    recommendation:
      "Define what 'natural' or 'clean' means for this product. Avoid implying safety beyond what testing supports.",
    baseRisk: "caution" as RiskLevel,
  },
  {
    pattern: /\b(#ad|#sponsored|paid partnership|ambassador)\b/gi,
    category: "Endorsements",
    title: "Sponsorship disclosure language found",
    summary: "Disclosure hashtags or sponsorship language is present — good practice to verify.",
    detail:
      "FTC requires clear and conspicuous disclosure of material connections in influencer and employee content. Disclosures must be understandable and placed where consumers will see them before engaging.",
    regulation: "FTC Endorsement Guides · 16 CFR Part 255",
    recommendation:
      "Confirm disclosure appears at the beginning of the post, is platform-appropriate, and clearly states the material connection.",
    baseRisk: "clear" as RiskLevel,
  },
  {
    pattern: /\b(free|no cost|guarantee|win|sweepstakes|contest|prize)\b/gi,
    category: "Promotions",
    title: "Promotional or incentive language detected",
    summary: "This material may involve a sweepstakes, contest, or promotional offer.",
    detail:
      "Promotions require official rules, state registration in some jurisdictions, and clear terms. 'Free' offers must disclose material conditions.",
    regulation: "FTC · State sweepstakes laws",
    recommendation:
      "Ensure official rules are linked and complete. Verify 'free' claims include all material terms and conditions.",
    baseRisk: "caution" as RiskLevel,
  },
];

const ASSET_CHECKS: Record<
  AssetType,
  { label: string; passed: boolean; note?: string }[]
> = {
  video: [
    { label: "On-screen supers legible for required duration", passed: true },
    { label: "Audio claims match visual supers", passed: true },
    { label: "End-frame disclosure present (if applicable)", passed: false, note: "Verify sponsorship or safety disclaimers on final frame" },
  ],
  "display-ad": [
    { label: "Primary claim visible without interaction", passed: true },
    { label: "Required disclaimers readable at standard ad size", passed: false, note: "Test at 300×250 and mobile placements" },
    { label: "Click-through landing page claim consistency", passed: true },
  ],
  "social-campaign": [
    { label: "Platform-native disclosure format used", passed: false, note: "Confirm #ad or Paid Partnership label is prominent" },
    { label: "Character limits do not truncate disclaimers", passed: true },
    { label: "Archived post matches approved version", passed: true },
  ],
  influencer: [
    { label: "Material connection disclosed clearly", passed: false, note: "Disclosure must appear before 'more' fold on most platforms" },
    { label: "Script reviewed against approved claims", passed: true },
    { label: "Usage rights and talent contract on file", passed: true },
  ],
  email: [
    { label: "Subject line does not overstate offer", passed: true },
    { label: "CAN-SPAM / GDPR compliance footer present", passed: true },
    { label: "Unsubscribe mechanism functional", passed: true },
  ],
  packaging: [
    { label: "On-pack claims match regulatory filings", passed: true },
    { label: "Required symbols and warnings present", passed: true },
    { label: "Net quantity and ingredient statements accurate", passed: true },
  ],
  print: [
    { label: "Disclaimers readable at final print size", passed: false, note: "Review proof at 100% scale" },
    { label: "Regional legal copy included", passed: true },
    { label: "Trademark attributions correct", passed: true },
  ],
  other: [
    { label: "Claims consistent across all channels", passed: true },
    { label: "Substantiation file referenced", passed: false, note: "Link substantiation documentation in review notes" },
    { label: "Stakeholder sign-off documented", passed: true },
  ],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function analyzeText(text: string): Finding[] {
  const findings: Finding[] = [];
  let id = 0;

  for (const rule of CLAIM_PATTERNS) {
    const matches = text.match(rule.pattern);
    if (matches && matches.length > 0) {
      const unique = [...new Set(matches.map((m) => m.toLowerCase()))];
      findings.push({
        id: `finding-${++id}`,
        category: rule.category,
        title: rule.title,
        summary: rule.summary,
        detail: rule.detail,
        risk: rule.baseRisk,
        regulation: rule.regulation,
        recommendation: rule.recommendation,
        location: `Detected terms: ${unique.slice(0, 4).join(", ")}${unique.length > 4 ? "…" : ""}`,
      });
    }
  }

  return findings;
}

function getOverallRisk(findings: Finding[]): RiskLevel {
  if (findings.some((f) => f.risk === "action-required")) return "action-required";
  if (findings.some((f) => f.risk === "caution")) return "caution";
  return "clear";
}

function buildSummary(risk: RiskLevel, count: number): string {
  if (risk === "clear") {
    return "No major legal red flags were identified in the submitted text. A human legal reviewer should still confirm before publication.";
  }
  if (risk === "caution") {
    return `${count} item${count === 1 ? "" : "s"} may need legal attention. Review the recommendations below before this material goes live.`;
  }
  return `${count} high-priority issue${count === 1 ? "" : "s"} require legal review before this material can be approved for use.`;
}

export async function runAIReview(
  submission: ReviewSubmission,
  onProgress?: (step: string) => void
) {
  onProgress?.("Reading your uploaded materials…");
  await delay(800);

  onProgress?.("Identifying product and performance claims…");
  await delay(900);

  onProgress?.("Checking against FTC, EPA, and industry standards…");
  await delay(1000);

  onProgress?.("Reviewing disclosures and endorsements…");
  await delay(700);

  onProgress?.("Preparing your plain-language report…");
  await delay(600);

  const combinedText = [
    submission.title,
    submission.claimsDescription,
    submission.notes,
    submission.brand,
    submission.targetAudience,
  ].join(" ");

  const findings = analyzeText(combinedText);
  const checklist = ASSET_CHECKS[submission.assetType] ?? ASSET_CHECKS.other;
  const overallRisk = getOverallRisk(findings);

  const failedChecks = checklist.filter((c) => !c.passed);
  if (failedChecks.length > 0 && overallRisk === "clear") {
    findings.push({
      id: "finding-checklist",
      category: "Compliance Checklist",
      title: `${failedChecks.length} checklist item${failedChecks.length === 1 ? "" : "s"} need attention`,
      summary: "Some standard review checkpoints were not fully met for this asset type.",
      detail: failedChecks.map((c) => c.note ?? c.label).join(" "),
      risk: "caution",
      recommendation:
        "Work through the compliance checklist below and resolve open items with your legal team.",
    });
  }

  const finalRisk = getOverallRisk(findings);

  const nextSteps =
    finalRisk === "clear"
      ? [
          "Share this report with your brand and legal stakeholders for final sign-off.",
          "Archive the approved version with substantiation documentation.",
          "Schedule a re-review if claims or creative change before launch.",
        ]
      : finalRisk === "caution"
        ? [
            "Address flagged items with your legal counsel before publishing.",
            "Update creative or add required qualifiers and disclaimers.",
            "Re-submit the revised material for a follow-up review.",
          ]
        : [
            "Do not publish until legal counsel resolves high-priority findings.",
            "Gather substantiation documentation for flagged claims.",
            "Schedule a meeting with Marketing & Communications legal.",
          ];

  return {
    submissionId: submission.id,
    overallRisk: finalRisk,
    confidence: findings.length > 0 ? 87 : 92,
    summary: buildSummary(finalRisk, findings.length),
    plainLanguageSummary:
      finalRisk === "clear"
        ? "Good news — our initial scan did not find serious legal problems in what you submitted. Think of this as a helpful first pass, not a final legal approval. Your legal team still needs to sign off."
        : finalRisk === "caution"
          ? "We found a few things worth a closer look. Nothing here automatically means you cannot publish — but you should review the flagged items with legal before going live."
          : "We found issues that typically require legal review before publication. Please share this report with your legal team right away.",
    findings,
    checklist,
    nextSteps,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
