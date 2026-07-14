import type { AspectRatio } from "@/lib/types";
import {
  AD_TEMPLATE_REGISTRY,
  getTemplateForPillar,
  type AdTemplateId,
  type BackgroundCrop,
} from "./ad-template-registry";
import { getPrimaryScreenshotForPillar } from "./product-screenshots";

export const ASSET_PACK_VERSION = 2;

export interface BackgroundClipRect {
  /** CSS clip-path value applied to the photo container */
  clipPath: string;
  objectPosition: string;
  /** Image scale relative to container */
  imgWidth: string;
  imgHeight: string;
}

export interface BackgroundLayerSpec {
  type: "photo" | "gradient" | "diagonal";
  assetPath?: string;
  crop: BackgroundCrop;
  useRadiatingLines?: boolean;
  clipRect?: BackgroundClipRect;
}

export interface ScreenAnchor {
  top: string;
  left: string;
  width: string;
  rotateY?: number;
  rotateX?: number;
  scale?: number;
}

export interface ScreenInsetSpec {
  screenshotPath: string;
  screenshotTitle: string;
  anchor: ScreenAnchor;
}

/** Per-template screen placement tuned to monitor bezel in layout-example PNGs */
const SCREEN_ANCHORS: Record<AdTemplateId, Partial<Record<AspectRatio, ScreenAnchor>>> = {
  "split-dashboard": {
    "1:1": { top: "14%", left: "8%", width: "58%", rotateY: -6, rotateX: 1.5, scale: 1.02 },
    "9:16": { top: "6%", left: "10%", width: "80%", rotateY: -5, rotateX: 1, scale: 1 },
  },
  "split-clarity": {
    "1:1": { top: "12%", left: "6%", width: "54%", rotateY: -5, rotateX: 1, scale: 1.02 },
    "9:16": { top: "8%", left: "11%", width: "78%", rotateY: -4, rotateX: 1, scale: 0.98 },
  },
  "split-office": {
    "1:1": { top: "14%", left: "5%", width: "56%", rotateY: -8, rotateX: 2, scale: 1 },
    "9:16": { top: "7%", left: "10%", width: "76%", rotateY: -6, rotateX: 1.5, scale: 0.98 },
  },
  "split-monitor": {
    "1:1": { top: "11%", left: "7%", width: "52%", rotateY: -5, rotateX: 1, scale: 1.03 },
    "9:16": { top: "8%", left: "12%", width: "74%", rotateY: -4, rotateX: 1, scale: 1 },
  },
  "diagonal-growth": {},
};

const DEFAULT_ANCHOR: ScreenAnchor = {
  top: "12%",
  left: "8%",
  width: "55%",
  rotateY: -5,
  rotateX: 1,
  scale: 1,
};

/** Aspect-specific crops — layout-example PNGs are full mockups, not panel-only assets */
const BACKGROUND_CLIPS: Record<
  BackgroundCrop,
  Partial<Record<AspectRatio, BackgroundClipRect>>
> = {
  "right-half": {
    "1:1": {
      clipPath: "inset(0 0 22% 0)",
      objectPosition: "right top",
      imgWidth: "215%",
      imgHeight: "100%",
    },
    "9:16": {
      clipPath: "inset(0 0 0 0)",
      objectPosition: "right top",
      imgWidth: "215%",
      imgHeight: "100%",
    },
  },
  "bottom-band": {
    "9:16": {
      clipPath: "inset(0 0 0 0)",
      objectPosition: "72% 28%",
      imgWidth: "280%",
      imgHeight: "140%",
    },
  },
  full: {
    "1:1": {
      clipPath: "inset(0 0 0 0)",
      objectPosition: "center",
      imgWidth: "100%",
      imgHeight: "100%",
    },
    "9:16": {
      clipPath: "inset(0 0 0 0)",
      objectPosition: "center top",
      imgWidth: "100%",
      imgHeight: "100%",
    },
  },
  none: {},
};

function resolveClipRect(
  crop: BackgroundCrop,
  aspectRatio: AspectRatio
): BackgroundClipRect | undefined {
  if (crop === "none") return undefined;

  const forCrop = BACKGROUND_CLIPS[crop];
  if (!forCrop) return undefined;

  if (aspectRatio === "9:16" && crop === "right-half") {
    return BACKGROUND_CLIPS["bottom-band"]["9:16"] ?? forCrop["9:16"];
  }

  return forCrop[aspectRatio];
}

export function getScreenAnchor(
  templateId: AdTemplateId,
  aspectRatio: AspectRatio
): ScreenAnchor {
  return SCREEN_ANCHORS[templateId]?.[aspectRatio] ?? DEFAULT_ANCHOR;
}

export function getBackgroundLayer(
  templateId: AdTemplateId,
  aspectRatio: AspectRatio
): BackgroundLayerSpec {
  const template = AD_TEMPLATE_REGISTRY[templateId];
  const { visual } = template;

  if (visual.useRadiatingLines) {
    return { type: "gradient", crop: "none", useRadiatingLines: true };
  }

  if (visual.mode === "diagonal") {
    return {
      type: "diagonal",
      assetPath: visual.backgroundAsset,
      crop: visual.backgroundCrop,
      clipRect: resolveClipRect(visual.backgroundCrop, aspectRatio),
    };
  }

  if (visual.backgroundAsset) {
    const crop =
      aspectRatio === "9:16" && visual.backgroundCrop === "right-half"
        ? "bottom-band"
        : visual.backgroundCrop;

    return {
      type: "photo",
      assetPath: visual.backgroundAsset,
      crop,
      clipRect: resolveClipRect(crop, aspectRatio),
    };
  }

  return { type: "gradient", crop: "none" };
}

export function getScreenshotForTemplate(
  templateId: AdTemplateId,
  pillarId?: string,
  aspectRatio: AspectRatio = "1:1"
): ScreenInsetSpec | null {
  const template = AD_TEMPLATE_REGISTRY[templateId];
  const pillar = pillarId ?? template.visual.screenshotPillar;
  const shot = getPrimaryScreenshotForPillar(pillar);
  if (!shot) return null;

  return {
    screenshotPath: shot.path,
    screenshotTitle: shot.title,
    anchor: getScreenAnchor(templateId, aspectRatio),
  };
}

export function getBackgroundLayerForPillar(
  pillarId: string | undefined,
  aspectRatio: AspectRatio
): BackgroundLayerSpec {
  const template = getTemplateForPillar(pillarId);
  return getBackgroundLayer(template.id, aspectRatio);
}

export function getScreenshotForPillar(
  pillarId: string | undefined,
  aspectRatio: AspectRatio = "1:1"
): ScreenInsetSpec | null {
  const template = getTemplateForPillar(pillarId);
  return getScreenshotForTemplate(template.id, pillarId, aspectRatio);
}
