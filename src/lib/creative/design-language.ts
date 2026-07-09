import { ADVISORPILOT_KNOWLEDGE } from "../knowledge/advisorpilot";

/**
 * Brand constraints — FIXED across every execution.
 * Color, typography style, voice, quality bar, spacing principles.
 */
export const BRAND_CONSTRAINTS = [
  "Color palette: Primary Navy, Primary Blue, White, Slate, Soft Gray only.",
  "Typography families: Fraunces (headlines), Inter (body), JetBrains Mono (data).",
  "Premium enterprise fintech aesthetic. Fortune 500 quality bar.",
  "8-point spacing system. Optical alignment. No arbitrary spacing.",
  "Brand voice: confident, editorial, specific. No buzzwords or hype.",
  "Soft premium lighting. Subtle paper texture backgrounds. Never flat white.",
  "No stock photography. No fake dashboards. No Canva aesthetics.",
  "No startup landing page tropes. No generic Tailwind cards.",
  "No neon colors, glossy effects, decorative icons, or visual noise.",
  "Luxury comes from restraint. Every element must earn its place.",
] as const;

/**
 * Composition freedom — VARIES per concept.
 * The Creative Director chooses layout archetype and visual system per execution.
 */
export const COMPOSITION_FREEDOM = [
  "Layout archetype MUST vary across concepts in the same campaign.",
  "Visual hierarchy is defined by the layout archetype, not a fixed template.",
  "Hero element may be typography, product UI, data, human context, or process flow.",
  "Do NOT default every ad to headline-left / product-right.",
  "Same brand. Different creative executions. Think Apple campaigns: always Apple, never the same layout.",
] as const;

/** @deprecated Use BRAND_CONSTRAINTS — kept for backward compatibility */
export const PERMANENT_DESIGN_RULES = BRAND_CONSTRAINTS;

export const BRAND_COLORS = {
  primaryNavy: ADVISORPILOT_KNOWLEDGE.visualTokens.navy,
  primaryBlue: ADVISORPILOT_KNOWLEDGE.visualTokens.blue,
  white: "#FFFFFF",
  slate: "#64748B",
  softGray: ADVISORPILOT_KNOWLEDGE.visualTokens.mist,
} as const;

export const NEGATIVE_PROMPT_DEFAULTS = [
  "stock photography",
  "fake dashboards",
  "Canva aesthetics",
  "startup landing page",
  "generic Tailwind cards",
  "neon colors",
  "glossy effects",
  "visual noise",
  "decorative icons",
  "clip art",
  "cartoon style",
  "busy backgrounds",
  "exaggerated gradients",
  "AI-generated look",
  "buzzword-heavy design",
  "repeated template layout",
  "identical composition across variants",
] as const;

export function getBrandConstraintsBlock(): string {
  return BRAND_CONSTRAINTS.map((rule) => `- ${rule}`).join("\n");
}

export function getCompositionFreedomBlock(): string {
  return COMPOSITION_FREEDOM.map((rule) => `- ${rule}`).join("\n");
}

/** Brand-only block for image prompts — no composition prescription. */
export function getPermanentDesignLanguageBlock(): string {
  return getBrandConstraintsBlock();
}

export function getBrandColorsBlock(): string {
  return Object.entries(BRAND_COLORS)
    .map(([name, hex]) => `- ${name}: ${hex}`)
    .join("\n");
}
