import type { AspectRatio } from "@/lib/types";
import { LAYOUT, SPACE } from "./ad-design-system";

const QR_LABEL_HEIGHT = 22;

/** Inputs that influence how much top-left space the logo may occupy. */
export interface LogoSizingInput {
  aspectRatio: AspectRatio;
  headlineLineCount: number;
  subheadLength: number;
  supportingLength: number;
  hasFeatureIcons?: boolean;
  hasAccentBar?: boolean;
  hasStepList?: boolean;
  qrPresent?: boolean;
}

export interface LogoSizingResult {
  maxWidth: number;
  maxHeight: number;
  /** Minimum header row height for logo row. */
  headerMinHeight: number;
  /** 0 = sparse copy (logo expands), 1 = dense copy (logo contracts). */
  contentDensity: number;
}

/** QR block height: code + padding + label (positioned bottom-left, not in header). */
export function getQrBlockHeight(qrSize = LAYOUT.qrSize): number {
  return qrSize + SPACE.sm + 12 + QR_LABEL_HEIGHT;
}

/** Normalized content density — more copy below = less room for an oversized logo. */
export function computeContentDensity(input: LogoSizingInput): number {
  const headlineScore = Math.min(input.headlineLineCount, 4) * 0.14;
  const subheadScore = Math.min(input.subheadLength / 120, 1) * 0.28;
  const supportingScore = Math.min(input.supportingLength / 90, 1) * 0.18;
  const featureScore = input.hasFeatureIcons ? 0.22 : 0;
  const stepScore = input.hasStepList ? 0.26 : 0;
  const accentScore = input.hasAccentBar ? 0.04 : 0;
  const qrScore = input.qrPresent ? 0.06 : 0;

  return Math.min(
    1,
    headlineScore + subheadScore + supportingScore + featureScore + stepScore + accentScore + qrScore
  );
}

function getLogoZoneWidth(aspectRatio: AspectRatio): number {
  const horizontalPadding =
    aspectRatio === "9:16" ? SPACE.hero * 2 : SPACE.xl * 2;
  const canvasWidth = aspectRatio === "9:16" ? LAYOUT.verticalWidth : LAYOUT.squareWidth;

  if (aspectRatio === "9:16") {
    return canvasWidth - horizontalPadding;
  }

  return LAYOUT.copyColumn - SPACE.sm;
}

/**
 * Logo sizing for top-left placement. QR sits bottom-left in the copy column,
 * so the logo row uses the full copy-column width without competing with QR.
 */
export function computeLogoSizing(input: LogoSizingInput): LogoSizingResult {
  const qrSize = LAYOUT.qrSize;
  const density = computeContentDensity(input);
  const zoneWidth = getLogoZoneWidth(input.aspectRatio);

  const fillRatio = 0.96 - density * 0.32;
  const minLogoHeight = Math.round(qrSize * LAYOUT.logoMinQrRatio);
  const densityBonus = Math.round((1 - density) * 56);
  let targetHeight = Math.round(minLogoHeight + densityBonus);

  if (input.qrPresent) {
    targetHeight = Math.min(targetHeight, Math.round(LAYOUT.logoMaxHeight * 0.92));
  }

  const maxHeight = Math.min(
    LAYOUT.logoMaxHeight,
    Math.max(minLogoHeight, targetHeight)
  );

  const maxWidth = Math.min(
    LAYOUT.logoMaxWidth,
    Math.round(zoneWidth * fillRatio),
    Math.round(maxHeight * LAYOUT.logoAspectRatio)
  );

  const headerMinHeight =
    density > 0.55 ? Math.round(maxHeight * 0.72) : maxHeight;

  const result: LogoSizingResult = {
    maxWidth,
    maxHeight,
    headerMinHeight,
    contentDensity: density,
  };

  assertLogoDominance(result, qrSize);
  return result;
}

/** Guardrail: exported logo must dominate the QR footprint. */
export function assertLogoDominance(sizing: LogoSizingResult, qrSize = LAYOUT.qrSize): void {
  if (sizing.maxHeight <= qrSize) {
    throw new Error(
      `Logo height (${sizing.maxHeight}px) must exceed QR size (${qrSize}px). Adjust logo-sizing guardrail.`
    );
  }
  if (sizing.maxWidth < qrSize * 1.1) {
    throw new Error(
      `Logo width (${sizing.maxWidth}px) must read larger than QR (${qrSize}px). Adjust logo-sizing guardrail.`
    );
  }
}
