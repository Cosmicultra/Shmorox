import type { AspectRatio, SocialPlatform } from "@/lib/types";
import type { AdCreativeContent, AdLayoutSpec, AdLayoutModes } from "./ad-creative-content";
import { LAYOUT, SPACE, TYPE } from "./ad-design-system";
import {
  AD_TEMPLATE_REGISTRY,
  getPlatformTweak,
  type AdTemplateId,
} from "./ad-template-registry";
import { computeLogoSizing, getQrBlockHeight, type LogoSizingResult } from "./logo-sizing";
import {
  getFeaturesForPillar,
  getStepsForPillar,
  usesStepList,
} from "./visual-config";
import { getProductClarityForPillar, resolveWhatWeDoCopy } from "./product-clarity";

const MIN_CONTENT_QR_GAP = SPACE.md;
const FIT_TOLERANCE_PX = 8;

export interface CopyColumnFitInput {
  aspectRatio: AspectRatio;
  platform?: SocialPlatform;
  templateId: AdTemplateId;
  headline: string;
  subhead: string;
  supportingLine: string;
  contentPillarId?: string;
  pinQrBottom?: boolean;
  instagramSafe?: boolean;
  qrPresent?: boolean;
  accentBar?: boolean;
  iconLayout?: "row" | "grid";
  compactSteps?: boolean;
  compactIcons?: boolean;
}

export interface LayoutRect {
  id: string;
  top: number;
  bottom: number;
}

export interface CopyColumnFitResult {
  fits: boolean;
  contentHeight: number;
  availableHeight: number;
  overflowPx: number;
  qrZoneTop: number;
  contentBottom: number;
  logoBottom: number;
  compactSteps: boolean;
  rects: LayoutRect[];
  overlaps: Array<{ a: string; b: string }>;
  compactIcons: boolean;
}

function estimateCharsPerLine(maxWidth: number, fontSize: number): number {
  return Math.max(12, Math.floor(maxWidth / (fontSize * 0.52)));
}

function estimateWrappedLines(text: string, fontSize: number, maxWidth: number): number {
  if (!text.trim()) return 0;
  const charsPerLine = estimateCharsPerLine(maxWidth, fontSize);
  const segments = text.split(/\s+/).filter(Boolean);
  let lines = 1;
  let current = 0;

  for (const word of segments) {
    const next = current === 0 ? word.length : current + 1 + word.length;
    if (next > charsPerLine) {
      lines++;
      current = word.length;
    } else {
      current = next;
    }
  }

  return lines;
}

function estimateTextHeight(
  text: string,
  fontSize: number,
  lineHeight: number,
  maxWidth: number,
  marginTop = 0
): number {
  if (!text.trim()) return marginTop;
  const lines = estimateWrappedLines(text, fontSize, maxWidth);
  return marginTop + lines * fontSize * lineHeight;
}

function estimateHeadlineHeight(
  headline: string,
  fontSize: number,
  lineHeight: number,
  maxWidth: number
): number {
  const lines = headline.split("\n").filter(Boolean);
  if (!lines.length) return 0;

  return lines.reduce(
    (total, line) =>
      total +
      estimateWrappedLines(line, fontSize, maxWidth) * fontSize * lineHeight,
    0
  );
}

function estimateStepListHeight(
  pillarId: string | undefined,
  compact: boolean,
  maxWidth: number
): number {
  const steps = getStepsForPillar(pillarId);
  if (!steps?.length) return 0;

  const descSize = compact ? TYPE.bodySm.size : TYPE.stepDesc.size;
  const descLineHeight = compact ? TYPE.bodySm.lineHeight : TYPE.stepDesc.lineHeight;
  const iconSize = compact ? 36 : 40;
  const gap = compact ? SPACE.sm : SPACE.md;
  const textWidth = maxWidth - iconSize - SPACE.md;

  let height = compact ? SPACE.md : SPACE.lg;

  for (const step of steps) {
    const titleHeight = TYPE.stepTitle.size * TYPE.stepTitle.lineHeight;
    const descHeight = estimateTextHeight(
      step.description,
      descSize,
      descLineHeight,
      textWidth,
      2
    );
    height += Math.max(iconSize, titleHeight + descHeight) + gap;
  }

  return height - gap;
}

function estimateCapabilityBandHeight(bullets = true): number {
  if (bullets) {
    const itemHeight = TYPE.valueProp.size * TYPE.valueProp.lineHeight;
    return SPACE.lg + itemHeight * 3 + SPACE.md * 2;
  }
  return SPACE.lg + TYPE.valueProp.size * TYPE.valueProp.lineHeight + SPACE.md;
}

function estimateFeatureProofHeight(
  pillarId: string | undefined,
  iconLayout: "row" | "grid",
  compact = false
): number {
  const features = getFeaturesForPillar(pillarId);
  if (!features.length) return 0;

  if (compact) {
    const rowHeight = 40 + 8 + 10 * 1.3 * 2;
    return SPACE.md + rowHeight + SPACE.sm;
  }

  if (iconLayout === "grid") {
    const rows = Math.ceil(features.length / 2);
    const cellHeight = 52 + 10 + 11 * 1.35 * 2;
    return SPACE.lg + rows * cellHeight + Math.max(0, rows - 1) * SPACE.md;
  }

  const rows = Math.ceil(features.length / 2);
  const rowHeight = 52 + 10 + 11 * 1.35 * 2;
  return SPACE.lg + rows * rowHeight + Math.max(0, rows - 1) * SPACE.md;
}

function getSquareMainRowHeight(): number {
  const legalRow = SPACE.sm + TYPE.legal.size * TYPE.legal.lineHeight + SPACE.md;
  return LAYOUT.squareHeight - SPACE.xl - LAYOUT.footerHeight - legalRow;
}

function getVerticalCopyZoneHeight(instagramSafe: boolean): number {
  const legalRow = SPACE.sm + TYPE.legal.size * TYPE.legal.lineHeight + SPACE.lg;
  const topPad = instagramSafe ? 120 : SPACE.xl;
  const visualMin = 520;
  return LAYOUT.verticalHeight - topPad - 40 - visualMin - LAYOUT.footerHeight - legalRow;
}

function resolvePinQrBottom(aspectRatio: AspectRatio, templateId: AdTemplateId): boolean {
  return aspectRatio === "1:1" && templateId !== "diagonal-growth";
}

function buildLogoSizingForFit(input: CopyColumnFitInput): LogoSizingResult {
  const template = AD_TEMPLATE_REGISTRY[input.templateId];
  const stepList = template.copySchema.proofType === "steps" && usesStepList(input.contentPillarId);
  const hasValueProps = template.copySchema.proofType === "none";
  return computeLogoSizing({
    aspectRatio: input.aspectRatio,
    headlineLineCount: input.headline.split("\n").filter(Boolean).length,
    subheadLength: input.subhead.length,
    supportingLength: input.supportingLine.length,
    hasFeatureIcons: template.copySchema.proofType === "icons",
    hasValueProps,
    hasStepList: stepList,
    hasAccentBar: input.accentBar,
    qrPresent: input.qrPresent ?? true,
  });
}

export function estimateCopyColumnLayout(input: CopyColumnFitInput): CopyColumnFitResult {
  const template = AD_TEMPLATE_REGISTRY[input.templateId];
  const platformTweak =
    input.platform !== undefined ? getPlatformTweak(template, input.platform) : {};
  const pinQrBottom = input.pinQrBottom ?? resolvePinQrBottom(input.aspectRatio, input.templateId);
  const instagramSafe = input.instagramSafe ?? input.platform === "instagram";
  const iconLayout = input.iconLayout ?? (input.aspectRatio === "9:16" ? "grid" : "row");
  const accentBar = input.accentBar ?? template.copySchema.accentBar;
  const stepList = template.copySchema.proofType === "steps" && usesStepList(input.contentPillarId);
  const logoSizing = buildLogoSizingForFit(input);
  const compactSteps = input.compactSteps ?? logoSizing.contentDensity > 0.65;
  const compactIcons = input.compactIcons ?? false;

  const copyInnerWidth =
    input.aspectRatio === "9:16"
      ? LAYOUT.copyColumn - SPACE.md
      : LAYOUT.copyColumn - SPACE.md;

  const headlineSpec = input.aspectRatio === "9:16" ? TYPE.displayLg : TYPE.displayMd;
  const headlineScale = platformTweak.headlineScale ?? 1;
  const headlineSize = Math.round(headlineSpec.size * headlineScale);
  const subheadSpec = input.aspectRatio === "9:16" ? TYPE.bodyLg : TYPE.bodyMd;

  const qrSize =
    platformTweak.qrSize ??
    (platformTweak.compactFooter ? Math.round(LAYOUT.qrSize * 0.85) : LAYOUT.qrSize);
  const qrBlockHeight = input.qrPresent === false ? 0 : getQrBlockHeight(qrSize);
  const qrContainerExtra = pinQrBottom ? SPACE.xxl : 0;

  const mainRowHeight =
    input.aspectRatio === "1:1"
      ? getSquareMainRowHeight()
      : getVerticalCopyZoneHeight(instagramSafe);

  const reservedQrHeight = pinQrBottom
    ? qrBlockHeight + qrContainerExtra
    : qrBlockHeight + (input.qrPresent === false ? 0 : SPACE.xl);

  const availableHeight = pinQrBottom
    ? mainRowHeight - reservedQrHeight
    : mainRowHeight;

  const qrZoneTop = pinQrBottom
    ? mainRowHeight - qrBlockHeight - qrContainerExtra
    : mainRowHeight - qrBlockHeight;

  const sparseHeader = logoSizing.contentDensity < 0.55;
  const logoBlockHeight =
    (compactIcons
      ? Math.round(logoSizing.maxHeight * 0.82)
      : sparseHeader
        ? logoSizing.headerMinHeight
        : logoSizing.maxHeight) + SPACE.md;

  const rects: LayoutRect[] = [];
  let cursor = 0;

  const pushRect = (id: string, height: number) => {
    if (height <= 0) return;
    rects.push({ id, top: cursor, bottom: cursor + height });
    cursor += height;
  };

  pushRect("logo", logoBlockHeight);

  const clarity = getProductClarityForPillar(input.contentPillarId);
  pushRect(
    "product-category",
    estimateTextHeight(
      clarity.productCategory,
      TYPE.productCategory.size,
      TYPE.productCategory.lineHeight,
      copyInnerWidth,
      SPACE.md
    )
  );

  if (accentBar) {
    pushRect("accent", 3 + SPACE.lg);
  }

  pushRect(
    "headline",
    estimateHeadlineHeight(input.headline, headlineSize, headlineSpec.lineHeight, copyInnerWidth)
  );

  pushRect(
    "subhead",
    estimateTextHeight(
      input.subhead,
      TYPE.whatWeDo.size,
      TYPE.whatWeDo.lineHeight,
      copyInnerWidth,
      SPACE.lg
    )
  );

  if (stepList) {
    pushRect("steps", estimateStepListHeight(input.contentPillarId, compactSteps, copyInnerWidth));
  } else if (template.copySchema.proofType === "icons") {
    pushRect(
      "proof-icons",
      estimateFeatureProofHeight(input.contentPillarId, iconLayout, compactIcons)
    );
  } else {
    pushRect("capability-band", estimateCapabilityBandHeight());
  }

  if (input.supportingLine.trim()) {
    pushRect(
      "supporting",
      estimateTextHeight(
        input.supportingLine,
        TYPE.bodySm.size,
        TYPE.bodySm.lineHeight,
        copyInnerWidth,
        SPACE.lg
      )
    );
  }

  const contentBottom = cursor;
  const contentHeight = cursor;

  if (!pinQrBottom && qrBlockHeight > 0) {
    pushRect("qr", qrBlockHeight + SPACE.xl);
  } else if (pinQrBottom && qrBlockHeight > 0) {
    rects.push({ id: "qr", top: qrZoneTop, bottom: qrZoneTop + qrBlockHeight });
  }

  const overlaps: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      if (a.bottom > b.top + FIT_TOLERANCE_PX && b.bottom > a.top + FIT_TOLERANCE_PX) {
        overlaps.push({ a: a.id, b: b.id });
      }
    }
  }

  const overflowPx = Math.max(0, contentBottom + MIN_CONTENT_QR_GAP - qrZoneTop);
  const fits = overflowPx <= FIT_TOLERANCE_PX && overlaps.length === 0;

  return {
    fits,
    contentHeight,
    availableHeight,
    overflowPx,
    qrZoneTop,
    contentBottom,
    logoBottom: logoBlockHeight,
    compactSteps,
    rects,
    overlaps,
    compactIcons,
  };
}

export function evaluateCopyColumnFitFromAd(
  content: AdCreativeContent,
  layout: AdLayoutSpec,
  modes?: AdLayoutModes
): CopyColumnFitResult {
  const template = AD_TEMPLATE_REGISTRY[layout.templateId];
  return estimateCopyColumnLayout({
    aspectRatio: layout.aspectRatio,
    platform: layout.platform,
    templateId: layout.templateId,
    headline: content.headline,
    subhead: content.subhead,
    supportingLine: modes?.supportingLine ?? content.supportingLine,
    contentPillarId: layout.contentPillarId,
    accentBar: template.copySchema.accentBar,
    qrPresent: true,
    compactSteps: modes?.compactSteps,
    compactIcons: modes?.compactIcons,
  });
}

export function fitAdCopyForLayout(input: CopyColumnFitInput): {
  subhead: string;
  supportingLine: string;
  fit: CopyColumnFitResult;
} {
  let subhead = resolveWhatWeDoCopy(input.contentPillarId, input.subhead.trim());
  let supportingLine = input.supportingLine.trim();

  let fit = estimateCopyColumnLayout({ ...input, subhead, supportingLine });

  if (fit.fits) {
    return { subhead, supportingLine, fit };
  }

  if (supportingLine) {
    supportingLine = "";
    fit = estimateCopyColumnLayout({ ...input, subhead, supportingLine });
    if (fit.fits) {
      return { subhead, supportingLine, fit };
    }
  }

  if (!fit.fits && !usesStepList(input.contentPillarId)) {
    fit = estimateCopyColumnLayout({
      ...input,
      subhead,
      supportingLine,
      compactIcons: true,
    });
  }

  return { subhead, supportingLine, fit };
}

export function assertCopyColumnFit(input: CopyColumnFitInput): void {
  const fit = estimateCopyColumnLayout(input);
  if (fit.fits) return;

  const overlapMsg =
    fit.overlaps.length > 0
      ? ` Overlaps: ${fit.overlaps.map((o) => `${o.a}/${o.b}`).join(", ")}.`
      : "";

  throw new Error(
    `Ad copy column overflow by ${Math.round(fit.overflowPx)}px (content ${Math.round(fit.contentBottom)}px, QR starts ${Math.round(fit.qrZoneTop)}px).${overlapMsg}`
  );
}
