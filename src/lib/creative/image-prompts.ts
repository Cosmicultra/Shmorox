import {
  getBrandColorsBlock,
  getBrandConstraintsBlock,
} from "./design-language";
import { getLayoutArchetypeBlock } from "./layout-archetypes";
import type { AspectRatio } from "../types";
import type { CreativeBrief } from "./types";

function getVisualSystemBlock(brief: CreativeBrief): string {
  if (brief.visualComposition) {
    const vc = brief.visualComposition;
    return `LAYOUT ARCHETYPE: ${vc.layoutArchetype}
Visual Hierarchy: ${vc.visualHierarchy}
Composition Style: ${vc.compositionStyle}
Hero Element: ${vc.heroElement}
Supporting Elements: ${vc.supportingElements.join(", ")}
Typography Treatment: ${vc.typographyTreatment}
Image/UI Usage: ${vc.imageUiUsage}
Negative Space: ${vc.negativeSpaceStrategy}`;
  }

  if (brief.layoutArchetype) {
    return getLayoutArchetypeBlock(brief.layoutArchetype);
  }

  return `Visual Concept: ${brief.visualConcept}
Composition: ${brief.composition}
Typography: ${brief.typography}
Product Placement: ${brief.productPlacement}
UI Priority: ${brief.uiPriority}`;
}

export function buildMasterImagePrompt(brief: CreativeBrief): string {
  return `Create an enterprise-level fintech advertisement.

Fortune 500 quality. Same brand. Unique creative execution.

BRAND CONSTRAINTS (fixed):
${getBrandConstraintsBlock()}

Brand Colors:
${getBrandColorsBlock()}

CREATIVE DIRECTION (this concept's layout system):
${getVisualSystemBlock(brief)}

Campaign Goal: ${brief.campaignGoal}
Feature: ${brief.feature}
Audience: ${brief.audience}

Headline: ${brief.headline}
Supporting Copy: ${brief.supportingCopy}
CTA: ${brief.cta}

Background: ${brief.background}
Lighting: ${brief.lighting}
Spacing: ${brief.spacingSystem}

Image execution brief:
${brief.imagePrompt}

Aspect Ratio: 1:1 (master concept)

Execute the layout archetype precisely. Do not fall back to a generic headline-left/product-right template unless the archetype specifies it.`;
}

export function buildAspectAdaptationPrompt(
  brief: CreativeBrief,
  aspectRatio: AspectRatio,
  masterDescription: string
): string {
  const archetype = brief.layoutArchetype ?? brief.visualComposition?.layoutArchetype;
  const layoutNote =
    aspectRatio === "9:16"
      ? `Adapt the ${archetype ?? "approved"} layout archetype to vertical 9:16. Preserve the archetype's visual hierarchy and hero element. Stack or reflow per the composition style — do NOT force headline-left/product-right unless that is the archetype. Maintain safe zones for mobile UI overlays.`
      : `Adapt the ${archetype ?? "approved"} layout archetype to square 1:1. Preserve hierarchy and hero element. Reflow spatial arrangement per composition style.`;

  return `Adapt this approved enterprise fintech creative concept to ${aspectRatio}.

CRITICAL: The message must remain IDENTICAL. Only spatial arrangement changes.
CRITICAL: Preserve the layout archetype's visual system — not a generic template.

${layoutNote}

BRAND CONSTRAINTS (fixed):
${getBrandConstraintsBlock()}

Brand Colors:
${getBrandColorsBlock()}

CREATIVE DIRECTION:
${getVisualSystemBlock(brief)}

Master concept description:
${masterDescription}

Headline (unchanged): ${brief.headline}
Supporting Copy (unchanged): ${brief.supportingCopy}
CTA (unchanged): ${brief.cta}

Aspect Ratio: ${aspectRatio}

Do not change the copy. Do not introduce new messaging. Layout adaptation only.`;
}

export function buildNegativePrompt(brief: CreativeBrief): string {
  const briefNegatives = brief.negativePrompt
    ? brief.negativePrompt.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const combined = [
    ...new Set([
      "stock photography",
      "fake dashboards",
      "Canva aesthetics",
      "generic template layout",
      "identical composition",
      ...briefNegatives,
    ]),
  ];
  return combined.join(", ");
}

export function describeMasterConcept(brief: CreativeBrief): string {
  const archetype = brief.layoutArchetype ?? brief.visualComposition?.layoutArchetype;
  return [
    `Layout archetype: ${archetype ?? "custom"}`,
    `Concept style: ${brief.conceptStyle ?? "enterprise"}`,
    `Hero: ${brief.visualComposition?.heroElement ?? brief.visualConcept}`,
    `Composition: ${brief.visualComposition?.compositionStyle ?? brief.composition}`,
    `Hierarchy: ${brief.visualComposition?.visualHierarchy ?? brief.typography}`,
    `Background: ${brief.background}`,
    `Lighting: ${brief.lighting}`,
  ].join(". ");
}
