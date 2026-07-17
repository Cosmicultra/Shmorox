import type { GeneratedAd } from "@/lib/types";
import { containsEmDash } from "./content-guardrails";
import {
  buildContentFromAd,
  buildLayoutSpecFromAd,
  isSupportingRedundant,
  resolveAdLayoutModes,
  tokenizeForOverlap,
  type AdCreativeContent,
  type AdLayoutSpec,
} from "./ad-creative-content";
import {
  AD_TEMPLATE_REGISTRY,
  getCopyLimitsForTemplate,
  getTemplateForPillar,
} from "./ad-template-registry";
import { getScreenshotForTemplate, getScreenAnchor } from "./asset-pack";
import { evaluateCopyColumnFitFromAd } from "./ad-layout-fit";
import { lintProductClarity } from "./product-clarity";
import { computeLogoSizing } from "./logo-sizing";
import { LAYOUT } from "./ad-design-system";
import { getStepsForPillar, getSupportingLine, usesStepList } from "./visual-config";

export type LintSeverity = "error" | "warning";

export interface LayoutLintIssue {
  code: string;
  message: string;
  severity: LintSeverity;
}

export interface LayoutLintResult {
  passed: boolean;
  issues: LayoutLintIssue[];
}

function lintCopyLength(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  const limits = getCopyLimitsForTemplate(layout.templateId, layout.platform);
  const issues: LayoutLintIssue[] = [];

  if (content.headline.length > limits.maxHeadlineChars) {
    issues.push({
      code: "HEADLINE_TOO_LONG",
      message: `Headline is ${content.headline.length} chars (max ${limits.maxHeadlineChars} for ${layout.templateId}).`,
      severity: "error",
    });
  }

  const subheadMax = limits.subheadMax ?? limits.maxSubheadChars;
  if (content.subhead.length > subheadMax) {
    issues.push({
      code: "SUBHEAD_TOO_LONG",
      message: `Subhead is ${content.subhead.length} chars (max ${subheadMax}).`,
      severity: "error",
    });
  }

  return issues;
}

function lintEmDash(content: AdCreativeContent): LayoutLintIssue[] {
  const fields = [
    ["headline", content.headline],
    ["subhead", content.subhead],
    ["cta", content.cta],
    ["disclaimer", content.disclaimer],
  ] as const;

  return fields
    .filter(([, text]) => containsEmDash(text))
    .map(([field]) => ({
      code: "EM_DASH",
      message: `Em-dash found in ${field}.`,
      severity: "error" as const,
    }));
}

function lintLogoVsQr(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  const template = AD_TEMPLATE_REGISTRY[layout.templateId];
  const stepList = template.copySchema.proofType === "steps" || usesStepList(layout.contentPillarId);
  const sizing = computeLogoSizing({
    aspectRatio: layout.aspectRatio,
    headlineLineCount: content.headline.split("\n").filter(Boolean).length,
    subheadLength: content.subhead.length,
    supportingLength: content.supportingLine.length,
    hasFeatureIcons: template.copySchema.proofType === "icons",
    hasValueProps: template.copySchema.proofType === "none",
    hasStepList: stepList,
    hasAccentBar: template.copySchema.accentBar,
    qrPresent: true,
  });

  const qrSize = LAYOUT.qrSize;
  if (sizing.maxHeight < qrSize) {
    return [
      {
        code: "LOGO_SMALLER_THAN_QR",
        message: `Logo max height (${sizing.maxHeight}px) is smaller than QR (${qrSize}px).`,
        severity: "warning",
      },
    ];
  }
  return [];
}

function lintSafeZone(layout: AdLayoutSpec): LayoutLintIssue[] {
  if (layout.aspectRatio !== "9:16") return [];
  if (layout.platform !== "instagram") return [];

  return [
    {
      code: "STORIES_SAFE_ZONE",
      message: "Instagram 9:16 exports reserve top 120px and bottom 200px safe zones.",
      severity: "warning",
    },
  ];
}

function lintScreenshot(layout: AdLayoutSpec): LayoutLintIssue[] {
  if (layout.templateId === "text-focused") return [];

  const screen = getScreenshotForTemplate(
    layout.templateId,
    layout.contentPillarId,
    layout.aspectRatio
  );
  if (screen) return [];

  if (layout.templateId === "diagonal-growth") return [];

  return [
    {
      code: "MISSING_SCREENSHOT",
      message: `No product screenshot mapped for template ${layout.templateId}.`,
      severity: "error",
    },
  ];
}

function lintStepsPlusSupporting(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  const template = AD_TEMPLATE_REGISTRY[layout.templateId];
  if (template.copySchema.proofType !== "steps") return [];
  if (!content.supportingLine.trim()) return [];

  return [
    {
      code: "STEPS_PLUS_SUPPORTING",
      message:
        "Step templates must not render a supporting line — it will be suppressed at render.",
      severity: "warning",
    },
  ];
}

function lintCopyLadderViolation(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  const steps = getStepsForPillar(layout.contentPillarId);
  if (!steps?.length || !content.subhead.trim()) return [];

  const subTokens = new Set(tokenizeForOverlap(content.subhead));
  let overlappingSteps = 0;

  for (const step of steps) {
    const stepTokens = tokenizeForOverlap(`${step.title} ${step.description ?? ""}`);
    if (!stepTokens.length) continue;
    const overlap = stepTokens.filter((t) => subTokens.has(t)).length;
    if (overlap / stepTokens.length >= 0.35) overlappingSteps++;
  }

  if (overlappingSteps >= 2) {
    return [
      {
        code: "COPY_LADDER_VIOLATION",
        message: `Subhead overlaps ${overlappingSteps} step descriptions — tighten hook vs proof ladder.`,
        severity: "warning",
      },
    ];
  }
  return [];
}

function lintRightPanelUnderfilled(layout: AdLayoutSpec): LayoutLintIssue[] {
  if (layout.templateId !== "split-dashboard") return [];

  const anchor = getScreenAnchor(layout.templateId, layout.aspectRatio);
  const widthPct = parseFloat(anchor.width);
  if (Number.isNaN(widthPct) || widthPct >= 78) return [];

  return [
    {
      code: "RIGHT_PANEL_UNDERFILLED",
      message: `Dashboard hero width (${anchor.width}) may underfill the right panel — target ≥78%.`,
      severity: "warning",
    },
  ];
}

function lintSupportingRedundancy(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  const rawSupporting = getSupportingLine(layout.contentPillarId);
  if (!rawSupporting.trim()) return [];

  if (isSupportingRedundant(content.subhead, rawSupporting)) {
    return [
      {
        code: "SUPPORTING_REDUNDANT",
        message: "Supporting line largely duplicates subhead — it will be hidden at render.",
        severity: "warning",
      },
    ];
  }
  return [];
}

function lintVerticalCopyDensity(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  if (layout.aspectRatio !== "9:16") return [];

  const template = AD_TEMPLATE_REGISTRY[layout.templateId];
  const hasIcons = template.copySchema.proofType === "icons";
  const lineCount = content.headline.split("\n").filter(Boolean).length;
  const estimatedHeight =
    120 +
    80 +
    lineCount * 72 +
    content.subhead.length * 0.45 +
    (hasIcons ? 180 : 0) +
    (content.supportingLine ? 40 : 0) +
    200;

  if (estimatedHeight > 920) {
    return [
      {
        code: "VERTICAL_COPY_DENSE",
        message: "9:16 copy block may exceed safe zone — consider shorter copy or fewer proof elements.",
        severity: "warning",
      },
    ];
  }
  return [];
}

function lintCopyColumnFit(
  content: AdCreativeContent,
  layout: AdLayoutSpec
): LayoutLintIssue[] {
  const rawSupporting = getSupportingLine(layout.contentPillarId);
  const modes = resolveAdLayoutModes(content.headline, content.subhead, layout, rawSupporting);
  const fit = evaluateCopyColumnFitFromAd(content, layout, modes);
  const issues: LayoutLintIssue[] = [];

  if (fit.overlaps.length > 0) {
    issues.push({
      code: "COPY_ELEMENT_OVERLAP",
      message: `Copy column elements overlap (${fit.overlaps
        .map((o) => `${o.a}/${o.b}`)
        .join(", ")}). Shorten copy or reduce proof density.`,
      severity: "error",
    });
  }

  if (fit.overflowPx > 8) {
    issues.push({
      code: "COPY_COLUMN_OVERFLOW",
      message: `Copy column exceeds available space by ~${Math.round(
        fit.overflowPx
      )}px — content may collide with QR or clip.`,
      severity: "error",
    });
  } else if (fit.overflowPx > 0) {
    issues.push({
      code: "COPY_COLUMN_TIGHT",
      message: `Copy column is tight (${Math.round(
        fit.overflowPx
      )}px from QR zone) — consider shorter subhead.`,
      severity: "warning",
    });
  }

  return issues;
}

export function lintAdLayout(ad: GeneratedAd): LayoutLintResult {
  const content = buildContentFromAd(ad);
  const layout = buildLayoutSpecFromAd(ad);

  const issues = [
    ...lintCopyLength(content, layout),
    ...lintEmDash(content),
    ...lintProductClarity({ pillarId: layout.contentPillarId, subhead: content.subhead }),
    ...lintLogoVsQr(content, layout),
    ...lintSafeZone(layout),
    ...lintScreenshot(layout),
    ...lintStepsPlusSupporting(content, layout),
    ...lintCopyLadderViolation(content, layout),
    ...lintRightPanelUnderfilled(layout),
    ...lintCopyColumnFit(content, layout),
    ...lintSupportingRedundancy(content, layout),
    ...lintVerticalCopyDensity(content, layout),
  ];

  const passed = !issues.some((i) => i.severity === "error");
  return { passed, issues };
}

export function lintAdBatch(ads: GeneratedAd[]): LayoutLintResult {
  const allIssues: LayoutLintIssue[] = [];

  for (const ad of ads) {
    const result = lintAdLayout(ad);
    for (const issue of result.issues) {
      allIssues.push({
        ...issue,
        message: `[${ad.platform} ${ad.aspectRatio}] ${issue.message}`,
      });
    }
  }

  return {
    passed: !allIssues.some((i) => i.severity === "error"),
    issues: allIssues,
  };
}

export function getTemplateCopyLimitsForPillar(pillarId?: string) {
  return getTemplateForPillar(pillarId).copySchema;
}

export function getStepSchemaForPillar(pillarId?: string) {
  return getStepsForPillar(pillarId);
}
