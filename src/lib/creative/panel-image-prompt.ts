import type { AspectRatio } from "../types";
import type { CreativeBrief } from "./types";
import { getBrandColorsBlock, getBrandConstraintsBlock } from "./design-language";
import { planPanelCrop, type PanelCropPlan } from "./panel-geometry";

/**
 * Panel images fill the graphic column of an existing ad card. All copy, logo,
 * QR and legal type is rendered by AdCardTemplate on top of the layout, so the
 * generated art must carry zero typography of its own. The panel is filled with
 * object-fit: cover from a centered origin, so composition has to survive a
 * symmetric crop.
 */
const PANEL_GUARDRAILS = [
  "ABSOLUTELY NO TEXT. No words, letters, numbers, captions, labels, axis ticks, watermarks, signatures, or logos anywhere in the image.",
  "No user interface chrome with readable type. No dashboards, spreadsheets, charts with labels, phone screens, or browser windows showing text.",
  "ONE clear subject, rendered large in the frame. No wide establishing shots, no crowded scenes, no small scattered detail — the final crop is tight and fine detail will be lost.",
  "Nothing that carries meaning may sit near the outer edges. The image is cropped inward from every side.",
  "Keep the left side calm and low-contrast — a light gradient is composited over it to blend into the copy column. Do not paint a fade or a white band yourself.",
  "Edge-to-edge photographic composition. No borders, frames, drop shadows, rounded corners, collages, or split panels.",
  "Single continuous scene. No grids, no multiple vignettes, no picture-in-picture.",
  "Calm depth of field and generous negative space. The panel sits beside a dense copy column and must not compete with it.",
] as const;

const PANEL_NEGATIVES = [
  "text",
  "words",
  "letters",
  "numbers",
  "typography",
  "captions",
  "labels",
  "watermarks",
  "logos",
  "signatures",
  "user interface screenshots",
  "dashboards",
  "charts with labels",
  "spreadsheets",
  "collage",
  "split screen",
  "borders",
  "frames",
  "stock photography",
  "Canva aesthetics",
  "neon colors",
  "glossy effects",
  "visual noise",
  "clip art",
  "cartoon style",
  "distorted hands",
  "distorted faces",
  "extra fingers",
] as const;

export interface AdPanelImagePromptInput {
  customRequest: string;
  brief?: CreativeBrief;
  aspectRatio: AspectRatio;
  /** Slot and crop math; resolved from the active image model when omitted. */
  crop?: PanelCropPlan;
  model?: string;
}

/** Approximate a ratio as "1:N" or "N:1" for prompt copy. */
function describeAspect(aspect: number): string {
  return aspect < 1
    ? `1:${(1 / aspect).toFixed(1)} (tall vertical)`
    : `${aspect.toFixed(1)}:1 (wide horizontal)`;
}

/** The crop is symmetric, so an N% visible band means (100-N)/2 off each side. */
function trimPerSide(visiblePct: number): number {
  return Math.round((100 - visiblePct) / 2);
}

function getPanelFramingBlock(crop: PanelCropPlan): string {
  const { slot, image, safeWidthRatio, safeHeightRatio } = crop;
  const widthPct = Math.round(safeWidthRatio * 100);
  const heightPct = Math.round(safeHeightRatio * 100);
  // Inset a little further than the crop so a near-edge subject never grazes it.
  const safeWidthPct = Math.max(50, widthPct - 6);
  const safeHeightPct = Math.max(50, heightPct - 6);

  const lines = [
    `You are generating a ${image.width}x${image.height} image that will be scaled to completely fill a ${slot.width}x${slot.height} panel, cropped from the center.`,
    `Final visible shape: ${describeAspect(slot.aspect)}.`,
  ];

  if (widthPct >= 99 && heightPct >= 99) {
    lines.push(
      "The requested size matches the panel, so the whole frame is visible. Still keep the outermost few percent free of essential content."
    );
  } else {
    if (widthPct < 99) {
      lines.push(
        `Only the CENTER ${widthPct}% of the image WIDTH is guaranteed to survive — about ${trimPerSide(
          widthPct
        )}% is cut from the left edge and the same from the right.`
      );
    }
    if (heightPct < 99) {
      lines.push(
        `Only the CENTER ${heightPct}% of the image HEIGHT is guaranteed to survive — about ${trimPerSide(
          heightPct
        )}% is cut from the top and the same from the bottom.`
      );
    }
    lines.push(
      `SAFE AREA: keep the subject and every element that carries the message inside a centered box covering the middle ${safeWidthPct}% of the width and ${safeHeightPct}% of the height. Treat everything outside that box as expendable bleed.`
    );
    lines.push(
      "Center the subject both horizontally and vertically. Do not bias it toward any edge — the crop is symmetric, so an off-center subject gets cut."
    );
  }

  lines.push(
    "Fill the entire frame with the scene. No empty margins, no background bars, no letterboxing."
  );

  return lines.join("\n");
}

function getCreativeDirectionBlock(brief?: CreativeBrief): string {
  if (!brief) return "";

  const lines = [
    brief.visualConcept && `Visual concept: ${brief.visualConcept}`,
    brief.background && `Background: ${brief.background}`,
    brief.lighting && `Lighting: ${brief.lighting}`,
    brief.emotionalGoal && `Emotional goal: ${brief.emotionalGoal}`,
    brief.audience && `Audience: ${brief.audience}`,
  ].filter(Boolean);

  if (!lines.length) return "";

  return `\nAPPROVED CREATIVE DIRECTION:\n${lines.join("\n")}\n`;
}

export function buildAdPanelImagePrompt({
  customRequest,
  brief,
  aspectRatio,
  crop,
  model = "gpt-image-1",
}: AdPanelImagePromptInput): string {
  const topic = customRequest.replace(/\s+/g, " ").trim();
  const cropPlan = crop ?? planPanelCrop(aspectRatio, model);

  return `Create a single photographic image for the graphic panel of an enterprise fintech advertisement.

The image is artwork only. It is composited into a fixed branded layout that already supplies the headline, logo, QR code and legal line.

SUBJECT — interpret this campaign request visually:
"${topic}"

FRAMING AND CROP:
${getPanelFramingBlock(cropPlan)}

PANEL CONSTRAINTS (non-negotiable):
${PANEL_GUARDRAILS.map((rule) => `- ${rule}`).join("\n")}

BRAND CONSTRAINTS (fixed):
${getBrandConstraintsBlock()}

Brand Colors:
${getBrandColorsBlock()}
${getCreativeDirectionBlock(brief)}
Render it as a real photograph or a restrained photographic composite. Premium, editorial, Fortune 500 quality. Luxury through restraint.`;
}

export function buildAdPanelNegativePrompt(brief?: CreativeBrief): string {
  const briefNegatives = brief?.negativePrompt
    ? brief.negativePrompt
        .split(/[,;]/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

  return [...new Set([...PANEL_NEGATIVES, ...briefNegatives])].join(", ");
}
