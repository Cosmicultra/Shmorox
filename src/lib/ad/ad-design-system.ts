/** 8-point grid design system for enterprise ad export */
export const G = 8;

export const SPACE = {
  xs: G,
  sm: G * 2,
  md: G * 3,
  lg: G * 4,
  xl: G * 5,
  xxl: G * 6,
  xxxl: G * 8,
  hero: G * 10,
  canvas: G * 12,
} as const;

export const LAYOUT = {
  squareWidth: 1080,
  squareHeight: 1080,
  verticalWidth: 1080,
  verticalHeight: 1920,
  /** Left copy column — ~48% of canvas (matches reference ads) */
  copyColumn: 520,
  /** Product column bleed past right edge */
  productBleed: 32,
  /** QR is the only CTA on exported ads */
  qrSize: 168,
  /** Logo must read larger than the QR — scaled dynamically via logo-sizing.ts */
  logoMinQrRatio: 1.42,
  logoMaxWidth: 500,
  logoMaxHeight: 248,
  /** Typical logo+tagline aspect (width / height) */
  logoAspectRatio: 2.65,
  footerHeight: 56,
  /** Right visual column width (square canvas minus copy column) */
  visualPanelWidth: 560,
} as const;

export const TYPE = {
  displayLg: { size: 76, lineHeight: 1.02, weight: 600, tracking: "-0.035em" },
  displayMd: { size: 58, lineHeight: 1.06, weight: 600, tracking: "-0.03em" },
  displaySm: { size: 52, lineHeight: 1.06, weight: 600, tracking: "-0.03em" },
  bodyLg: { size: 20, lineHeight: 1.45, weight: 400, tracking: "-0.012em" },
  bodyMd: { size: 17, lineHeight: 1.5, weight: 400, tracking: "-0.01em" },
  bodySm: { size: 14, lineHeight: 1.45, weight: 400, tracking: "-0.008em" },
  label: { size: 10, lineHeight: 1.3, weight: 600, tracking: "0.12em" },
  stepTitle: { size: 15, lineHeight: 1.3, weight: 600, tracking: "-0.01em" },
  stepDesc: { size: 13, lineHeight: 1.4, weight: 400, tracking: "-0.005em" },
  cta: { size: 16, lineHeight: 1, weight: 600, tracking: "-0.01em" },
  legal: { size: 7.5, lineHeight: 1.45, weight: 400, tracking: "0" },
  trust: { size: 11, lineHeight: 1.35, weight: 500, tracking: "-0.005em" },
} as const;

export const ELEVATION = {
  soft: "0 12px 32px rgba(5, 28, 44, 0.06)",
  raised: "0 20px 48px rgba(5, 28, 44, 0.10), 0 6px 16px rgba(5, 28, 44, 0.05)",
  hero: "0 32px 64px rgba(5, 28, 44, 0.14), 0 12px 28px rgba(5, 28, 44, 0.08)",
  float: "0 48px 96px rgba(5, 28, 44, 0.18), 0 16px 40px rgba(5, 28, 44, 0.10)",
  product: "0 56px 112px rgba(5, 28, 44, 0.20), 0 24px 48px rgba(5, 28, 44, 0.12), 0 0 0 1px rgba(5, 28, 44, 0.04)",
  cta: "0 8px 24px rgba(34, 81, 255, 0.28)",
} as const;

export const SURFACE = {
  canvas:
    "linear-gradient(165deg, #FCFCFA 0%, #F8F9FB 28%, #F4F6F9 55%, #EEF1F6 100%)",
  ambient: "radial-gradient(ellipse 70% 55% at 88% 12%, rgba(34, 81, 255, 0.06) 0%, transparent 72%)",
  ambientWarm: "radial-gradient(ellipse 45% 35% at 8% 92%, rgba(200, 169, 110, 0.04) 0%, transparent 68%)",
  panel: "#FFFFFF",
  chrome: "#FAFBFC",
  inset: "#F4F6F8",
  sidebar: "#051C2C",
  trustBar: "#051C2C",
  /** Right-panel office tone */
  officeWarm: "linear-gradient(160deg, #E8ECF1 0%, #DDE3EA 45%, #D0D8E2 100%)",
  officeWindow: "linear-gradient(180deg, #8BA4BC 0%, #6B8499 40%, #4A6278 100%)",
} as const;

/** Editorial serif for headlines — matches AdvisorPilot product */
export const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
export const FONT_BODY = "'Inter', system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

/** @deprecated use FONT_BODY */
export const FONT = FONT_BODY;

/** Subtle wave lines — bottom-left ambient texture */
export const WAVE_OVERLAY = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400' fill='none'>
    <path d='M-20 320 Q80 280 180 320 T380 320' stroke='rgba(34,81,255,0.06)' stroke-width='1.5' fill='none'/>
    <path d='M-20 360 Q100 320 200 360 T400 360' stroke='rgba(34,81,255,0.04)' stroke-width='1' fill='none'/>
    <path d='M-20 400 Q120 360 220 400 T420 400' stroke='rgba(34,81,255,0.03)' stroke-width='1' fill='none'/>
  </svg>`
)}")`;
