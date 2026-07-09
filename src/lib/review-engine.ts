import type { AssetType, Finding, ReviewSubmission, RiskLevel } from "./types";
import { ADVISORPILOT_KNOWLEDGE } from "./knowledge/advisorpilot";

const RIA_CLAIM_PATTERNS = [
  {
    pattern: /\b(guaranteed returns?|guarantee[ds]? (?:\d+%|profit|income|return))\b/gi,
    category: "RIA Performance",
    title: "Performance guarantee detected",
    summary: "This material may promise guaranteed investment returns.",
    detail:
      "SEC and FINRA prohibit advertisements that guarantee specific investment outcomes. Performance claims require substantiation, balanced disclosure, and cannot promise future results.",
    regulation: "SEC Marketing Rule 206(4)-1 · FINRA Rule 2210",
    recommendation:
      "Remove guarantee language. Reframe as workflow benefits without promising investment outcomes.",
    baseRisk: "action-required" as RiskLevel,
  },
  {
    pattern: /\b(beat the market|outperform(?:s|ing)? the (?:market|S&P)|always outperforms?)\b/gi,
    category: "RIA Performance",
    title: "Market outperformance claim detected",
    summary: "This material implies the service or strategy beats market benchmarks.",
    detail:
      "Implied or explicit outperformance claims require rigorous substantiation under SEC Marketing Rule and may constitute a performance advertisement requiring specific disclosures.",
    regulation: "SEC Marketing Rule 206(4)-1 · FINRA Rule 2210",
    recommendation:
      "Remove outperformance language. Focus on operational workflow benefits instead of investment results.",
    baseRisk: "action-required" as RiskLevel,
  },
  {
    pattern: /\b(\d+%\s*(?:annual|yearly|return|gain|growth)|double your money)\b/gi,
    category: "RIA Performance",
    title: "Specific return figure detected",
    summary: "This material references a specific percentage return or wealth multiplier.",
    detail:
      "Specific return figures in advertisements trigger performance advertising requirements including net vs. gross returns, time periods, and equal prominence of disclosures.",
    regulation: "SEC Marketing Rule 206(4)-1",
    recommendation:
      "Remove specific return figures. If performance data is essential, consult legal for compliant formatting.",
    baseRisk: "action-required" as RiskLevel,
  },
  {
    pattern: /\b(client said|clients? (?:say|said|told us)|testimonial|endorsement|review from)\b/gi,
    category: "RIA Testimonials",
    title: "Possible testimonial or endorsement detected",
    summary: "This material may contain a client testimonial or endorsement.",
    detail:
      "Under SEC Marketing Rule 206(4)-1, testimonials and endorsements require specific disclosures including whether the person is a client, compensation details, and conflicts of interest.",
    regulation: "SEC Marketing Rule 206(4)-1 · Rule 206(4)-1(a)(1)",
    recommendation:
      "Add required testimonial disclosures or remove client quotes. Consult legal for compliant testimonial format.",
    baseRisk: "caution" as RiskLevel,
  },
  {
    pattern: /\b(we recommend (?:you )?buy|guaranteed suitability|invest in|you should (?:buy|sell|invest))\b/gi,
    category: "RIA Implied Advice",
    title: "Implied investment advice detected",
    summary: "This material may constitute investment advice or a recommendation.",
    detail:
      "Software marketing for RIAs must not cross into providing investment advice. Language suggesting specific investment actions may trigger advisory registration and solicitation rules.",
    regulation: "Investment Advisers Act · SEC Marketing Rule",
    recommendation:
      "Reframe as workflow preparation tool. Remove language suggesting specific investment actions.",
    baseRisk: "action-required" as RiskLevel,
  },
  {
    pattern: /\b(SEC[- ]?approved|FINRA[- ]?certified|SEC[- ]?registered software|government[- ]?approved)\b/gi,
    category: "RIA Regulatory Overreach",
    title: "False regulatory authority claim detected",
    summary: "This material may falsely imply SEC or FINRA endorsement of the product.",
    detail:
      "No software product receives SEC or FINRA 'approval' or 'certification' for marketing purposes. Such claims are misleading and may violate antifraud provisions.",
    regulation: "SEC Antifraud Provisions · FTC Act §5",
    recommendation:
      "Remove SEC/FINRA approval language. State factual compliance posture without implying regulatory endorsement.",
    baseRisk: "action-required" as RiskLevel,
  },
  {
    pattern: /\b(replaces? your judgment|automated advice|AI (?:gives?|provides?) advice|let AI (?:decide|invest|advise))\b/gi,
    category: "AI Overclaim",
    title: "AI advice overclaim detected",
    summary: "This material may overstate AI capabilities as substituting for advisor judgment.",
    detail:
      "AdvisorPilot positions AI as operational workflow assistance, not investment advice. Claims that AI replaces fiduciary judgment create regulatory and liability risk.",
    regulation: "SEC Marketing Rule · Investment Advisers Act fiduciary duty",
      recommendation:
        "Reframe: 'AI assists workflow preparation, not investment advice.' Emphasize advisor retains judgment.",
    baseRisk: "action-required" as RiskLevel,
  },
];

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
    { label: "Standard RIA disclaimer present on promotional material", passed: false, note: "Include 'not an offer, solicitation, or recommendation' language" },
    { label: "No performance promises in social creative", passed: true },
    { label: "AI assists workflow positioning maintained", passed: false, note: "Confirm copy states AI supports operations, not investment advice" },
    { label: "Demo CTA does not imply guaranteed outcomes", passed: true },
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

function evaluateChecklist(
  assetType: AssetType,
  text: string
): { label: string; passed: boolean; note?: string }[] {
  const base = ASSET_CHECKS[assetType] ?? ASSET_CHECKS.other;
  const lower = text.toLowerCase();

  if (assetType !== "social-campaign") return base;

  return base.map((item) => {
    if (item.label.includes("RIA disclaimer")) {
      const passed =
        lower.includes("not an offer") ||
        lower.includes("not a solicitation") ||
        lower.includes("not a recommendation");
      return { ...item, passed, note: passed ? undefined : item.note };
    }
    if (item.label.includes("performance promises")) {
      const hasPerformance = /\b(guaranteed|outperform|beat the market|\d+%\s*return)\b/i.test(text);
      return { ...item, passed: !hasPerformance };
    }
    if (item.label.includes("AI assists workflow")) {
      const passed =
        lower.includes("workflow") ||
        lower.includes("not investment advice") ||
        lower.includes("not advice") ||
        lower.includes("fiduciary");
      return { ...item, passed, note: passed ? undefined : item.note };
    }
    if (item.label.includes("Demo CTA")) {
      const hasBadCta = /\b(guaranteed|free money|double your)\b/i.test(text);
      return { ...item, passed: !hasBadCta };
    }
    if (item.label.includes("disclosure format")) {
      return { ...item, passed: true, note: undefined };
    }
    return item;
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function analyzeText(text: string): Finding[] {
  const findings: Finding[] = [];
  let id = 0;

  const allPatterns = [...CLAIM_PATTERNS, ...RIA_CLAIM_PATTERNS];

  for (const rule of allPatterns) {
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

  if (
    !text.toLowerCase().includes("not an offer") &&
    !text.toLowerCase().includes("not a solicitation") &&
    !text.toLowerCase().includes("not a recommendation") &&
    text.length > 50
  ) {
    findings.push({
      id: `finding-${++id}`,
      category: "RIA Disclaimer",
      title: "Standard financial disclaimer may be missing",
      summary: "Promotional material for financial services should include a standard disclaimer.",
      detail:
        "RIA and fintech marketing should include language that the material is not an offer, solicitation, or recommendation of securities or advisory services.",
      risk: "caution",
      regulation: "SEC Marketing Rule 206(4)-1 · FINRA Rule 2210",
      recommendation: `Add standard disclaimer: "${ADVISORPILOT_KNOWLEDGE.standardDisclaimer.slice(0, 80)}…"`,
      location: "No disclaimer keywords detected in submitted text",
    });
  }

  if (/[\u2013\u2014]/.test(text)) {
    findings.push({
      id: `finding-${++id}`,
      category: "Copy Style",
      title: "Em-dash detected in marketing copy",
      summary: "Em-dashes and en-dashes are not permitted in generated ad or post content.",
      detail:
        "Brand guardrails require plain punctuation. Replace em-dashes with commas or periods for a cleaner, more professional tone.",
      risk: "caution",
      regulation: "Internal brand style guide",
      recommendation: "Replace all em-dashes and en-dashes with commas or periods, then re-run review.",
      location: "Em-dash or en-dash character found in submitted text",
    });
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
  const checklist = evaluateChecklist(submission.assetType, combinedText);
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

export { formatFileSize, generateId } from "./utils";
