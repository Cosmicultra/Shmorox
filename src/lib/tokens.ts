/** Shared brand tokens — used by app UI and ad export templates */
export const BRAND_TOKENS = {
  navy: "#051C2C",
  navyDeep: "#002040",
  blue: "#2251FF",
  blueBright: "#3D5AFE",
  gold: "#C8A96E",
  goldDark: "#A68B4B",
  white: "#FFFFFF",
  offWhite: "#F7F8FA",
  mist: "#F4F6F8",
  charcoal: "#141820",
  charcoalLight: "#1E2430",
  slate: "#4A5568",
  slateLight: "#8A9BAB",
  border: "#E2E8F0",
  borderDark: "#2A3344",
  success: "#0D7C4E",
  warning: "#B45309",
  danger: "#B42318",
} as const;

/** @deprecated Use BRAND_TOKENS — kept for ad export compatibility */
export const VISUAL_TOKENS = {
  navy: BRAND_TOKENS.navy,
  navyDeep: BRAND_TOKENS.navyDeep,
  blue: BRAND_TOKENS.blue,
  blueBright: BRAND_TOKENS.blueBright,
  gold: BRAND_TOKENS.gold,
  goldDark: BRAND_TOKENS.goldDark,
  white: BRAND_TOKENS.white,
  offWhite: BRAND_TOKENS.offWhite,
  charcoal: BRAND_TOKENS.charcoal,
  charcoalLight: BRAND_TOKENS.charcoalLight,
  slate: BRAND_TOKENS.slate,
  slateLight: BRAND_TOKENS.slateLight,
};
