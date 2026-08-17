import { LAYOUT } from "../ad/ad-design-system";
import type { AspectRatio } from "../types";

/** AdCardTemplate rasterizes at pixelRatio 2, so slots are 2x in device pixels. */
const DEVICE_SCALE = 2;

/** Fixed sizes accepted by the gpt-image-1 family. */
const FIXED_PANEL_SIZES = [
  { width: 1024, height: 1024 },
  { width: 1024, height: 1536 },
  { width: 1536, height: 1024 },
] as const;

/** Constraints published for flexible-size image models (gpt-image-2 and later). */
const SIZE_STEP = 16;
const MAX_EDGE = 3840;
const MIN_PIXELS = 655_360;
const MAX_PIXELS = 8_294_400;
const MAX_EDGE_RATIO = 3;

export interface PanelSlot {
  width: number;
  /** Nominal height, used to pick the generated shape. */
  height: number;
  /** width / height at the nominal height */
  aspect: number;
  /** Shortest the slot gets — the vertical row flexes with copy length. */
  minHeight: number;
  /** Tallest the slot gets. */
  maxHeight: number;
}

export interface PanelImageSize {
  /** Value for the Images API `size` parameter, e.g. "1024x1536" */
  size: string;
  width: number;
  height: number;
  aspect: number;
  /** True when the requested shape matches the slot, so nothing is cropped. */
  exactFit: boolean;
}

export interface PanelCropPlan {
  slot: PanelSlot;
  image: PanelImageSize;
  /** Fraction of the generated width still visible at the slot's nominal height. */
  visibleWidthRatio: number;
  /** Fraction of the generated height still visible at the slot's nominal height. */
  visibleHeightRatio: number;
  /** Worst-case visible width across the slot's whole height range. */
  safeWidthRatio: number;
  /** Worst-case visible height across the slot's whole height range. */
  safeHeightRatio: number;
}

export function getPanelSlot(aspectRatio: AspectRatio): PanelSlot {
  const box = aspectRatio === "9:16" ? LAYOUT.aiPanelVertical : LAYOUT.aiPanelSquare;
  const minHeight = "minHeight" in box ? box.minHeight : box.height;
  const maxHeight = "maxHeight" in box ? box.maxHeight : box.height;

  return {
    width: box.width,
    height: box.height,
    aspect: box.width / box.height,
    minHeight,
    maxHeight,
  };
}

/** gpt-image-2 and later accept arbitrary sizes; earlier models take three fixed shapes. */
function supportsFlexibleSize(model: string): boolean {
  const match = model.toLowerCase().match(/gpt-image-(\d+(?:\.\d+)?)/);
  if (!match) return false;
  return Number.parseFloat(match[1]) >= 2;
}

function roundToStep(value: number): number {
  return Math.max(SIZE_STEP, Math.round(value / SIZE_STEP) * SIZE_STEP);
}

function toSizeString(width: number, height: number): string {
  return `${width}x${height}`;
}

/** Aspect distance is multiplicative, so compare in log space. */
function aspectDistance(a: number, b: number): number {
  return Math.abs(Math.log(a) - Math.log(b));
}

function nearestFixedSize(slotAspect: number): PanelImageSize {
  const best = FIXED_PANEL_SIZES.reduce((closest, candidate) =>
    aspectDistance(candidate.width / candidate.height, slotAspect) <
    aspectDistance(closest.width / closest.height, slotAspect)
      ? candidate
      : closest
  );

  const aspect = best.width / best.height;
  return {
    size: toSizeString(best.width, best.height),
    width: best.width,
    height: best.height,
    aspect,
    exactFit: Math.abs(aspect - slotAspect) < 0.01,
  };
}

function exactFlexibleSize(slot: PanelSlot): PanelImageSize {
  let width = slot.width * DEVICE_SCALE;
  let height = slot.height * DEVICE_SCALE;

  const edgeRatio = Math.max(width / height, height / width);
  if (edgeRatio > MAX_EDGE_RATIO) {
    if (width > height) height = width / MAX_EDGE_RATIO;
    else width = height / MAX_EDGE_RATIO;
  }

  const pixels = width * height;
  if (pixels < MIN_PIXELS) {
    const scale = Math.sqrt(MIN_PIXELS / pixels) * 1.02;
    width *= scale;
    height *= scale;
  } else if (pixels > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / pixels);
    width *= scale;
    height *= scale;
  }

  const longestEdge = Math.max(width, height);
  if (longestEdge > MAX_EDGE) {
    const scale = MAX_EDGE / longestEdge;
    width *= scale;
    height *= scale;
  }

  width = roundToStep(width);
  height = roundToStep(height);

  // Rounding down to the 16px grid can dip under the pixel floor.
  while (width * height < MIN_PIXELS && Math.max(width, height) + SIZE_STEP <= MAX_EDGE) {
    width += SIZE_STEP;
    height += SIZE_STEP;
  }

  const aspect = width / height;
  return {
    size: toSizeString(width, height),
    width,
    height,
    aspect,
    exactFit: aspectDistance(aspect, slot.aspect) < 0.02,
  };
}

export function resolvePanelImageSize(slot: PanelSlot, model: string): PanelImageSize {
  return supportsFlexibleSize(model) ? exactFlexibleSize(slot) : nearestFixedSize(slot.aspect);
}

/** What `object-fit: cover` leaves visible when a source of `imageAspect` fills `slotAspect`. */
function visibleRatios(slotAspect: number, imageAspect: number) {
  return {
    width: Math.min(1, slotAspect / imageAspect),
    height: Math.min(1, imageAspect / slotAspect),
  };
}

/**
 * Describes what survives `object-fit: cover` when the generated image is
 * dropped into the panel, so the prompt can reserve a matching safe area.
 * The safe ratios take the worst case over the slot's height range, since the
 * vertical card's graphic row flexes with copy length.
 */
export function planPanelCrop(aspectRatio: AspectRatio, model: string): PanelCropPlan {
  const slot = getPanelSlot(aspectRatio);
  const image = resolvePanelImageSize(slot, model);

  const nominal = visibleRatios(slot.aspect, image.aspect);
  const shortest = visibleRatios(slot.width / slot.minHeight, image.aspect);
  const tallest = visibleRatios(slot.width / slot.maxHeight, image.aspect);

  return {
    slot,
    image,
    visibleWidthRatio: nominal.width,
    visibleHeightRatio: nominal.height,
    safeWidthRatio: Math.min(nominal.width, shortest.width, tallest.width),
    safeHeightRatio: Math.min(nominal.height, shortest.height, tallest.height),
  };
}
