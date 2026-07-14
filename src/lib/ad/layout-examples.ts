/**
 * Ad-card template layout examples (inspiration only — not literal templates).
 * Files: public/ad-assets/layout-examples/
 *
 * Structure pattern shared by split layouts:
 *   left  = logo + headline + subhead + feature icons + CTA
 *   right = lifestyle photo with product on device
 *   footer = trust bar or institutional slogan
 */

/** Mirrors LayoutVariant in visual-config (kept local to avoid circular imports). */
export type LayoutExampleVariant = "split-office" | "split-clarity" | "diagonal-growth";

export type LayoutExampleId =
  | "split-office-laptop"
  | "split-office-monitor"
  | "split-office-trust-bar"
  | "split-clarity"
  | "diagonal-growth";

export interface LayoutExample {
  id: LayoutExampleId;
  /** Maps to AdCardTemplate layoutVariant */
  variant: LayoutExampleVariant;
  path: string;
  title: string;
  structure: string;
  headlinePattern: string;
  rightPanel: string;
  footer: string;
  notes: string;
}

export const LAYOUT_EXAMPLES: LayoutExample[] = [
  {
    id: "split-office-laptop",
    variant: "split-office",
    path: "/ad-assets/layout-examples/split-office-laptop.png",
    title: "Split office — laptop",
    structure: "50/50 vertical split: copy left, lifestyle laptop right, navy trust footer",
    headlinePattern: "The most time-consuming part of client reviews was Never the advice.",
    rightPanel: "Laptop on desk, city skyline, branded mug — product UI on screen",
    footer: "Secure / Scalable / Built for Advisors + slogan",
    notes: "Canonical split-office reference. Prefer real product screenshots on device, not fake dashboards.",
  },
  {
    id: "split-office-monitor",
    variant: "split-office",
    path: "/ad-assets/layout-examples/split-office-monitor.png",
    title: "Split office — monitor",
    structure: "50/50 split: copy left, desktop monitor right, institutional footer band",
    headlinePattern: "The most time-consuming part of client reviews was Never the advice.",
    rightPanel: "Monitor on wood desk with city view — portfolio review dashboard",
    footer: "OPERATIONAL INFRASTRUCTURE FOR MODERN ADVISORY FIRMS",
    notes: "Same split as laptop variant; wider device frame. Good for LinkedIn 1:1.",
  },
  {
    id: "split-office-trust-bar",
    variant: "split-office",
    path: "/ad-assets/layout-examples/split-office-trust-bar.png",
    title: "Split office — trust bar",
    structure: "50/50 split with dense trust footer (icons + slogan)",
    headlinePattern: "The most time-consuming part of client reviews was Never the advice.",
    rightPanel: "Laptop lifestyle with Client Review Overview UI",
    footer: "Three trust icons left, relationship slogan right",
    notes: "Use when emphasizing security/scale; keep footer quiet vs headline.",
  },
  {
    id: "split-clarity",
    variant: "split-clarity",
    path: "/ad-assets/layout-examples/split-clarity.png",
    title: "Split clarity",
    structure: "50/50 split: clarity-focused headline, four benefit icons, monitor lifestyle",
    headlinePattern: "Turn client reviews into Clarity. Not more Admin Work.",
    rightPanel: "Monitor — Review Intelligence Dashboard in office setting",
    footer: "Four trust/benefit icons across navy bar",
    notes: "Maps to statement-intelligence / compliance pillars. Highlight words in royal blue.",
  },
  {
    id: "diagonal-growth",
    variant: "diagonal-growth",
    path: "/ad-assets/layout-examples/diagonal-growth.png",
    title: "Diagonal growth",
    structure: "Diagonal cut: light copy panel left (~60%), navy mountain + rising chart right (~40%)",
    headlinePattern: "Better insights. Stronger advice. Sustainable growth.",
    rightPanel: "Mountain landscape with navy overlay and ascending line chart watermark",
    footer: "Four brand pillars: Analyze / Insight / Advise / Grow",
    notes: "Maps to operational-scale. Serif headline optional in reference; Creative Studio uses editorial sans.",
  },
];

/** Canonical example path per layout variant (used as visual reference). */
export const LAYOUT_EXAMPLE_BY_VARIANT: Record<LayoutExampleVariant, string> = {
  "split-office": "/ad-assets/layout-examples/split-office-laptop.png",
  "split-clarity": "/ad-assets/layout-examples/split-clarity.png",
  "diagonal-growth": "/ad-assets/layout-examples/diagonal-growth.png",
};

/** Legacy public paths kept for compatibility (synced copies of canonical examples). */
export const LAYOUT_LEGACY_BACKGROUNDS: Record<LayoutExampleVariant, string> = {
  "split-office": "/ad-assets/square-reference.png",
  "split-clarity": "/ad-assets/template-clarity.png",
  "diagonal-growth": "/ad-assets/template-growth.png",
};

export function getLayoutExample(id: LayoutExampleId): LayoutExample | undefined {
  return LAYOUT_EXAMPLES.find((e) => e.id === id);
}

export function getLayoutExamplesForVariant(variant: LayoutExampleVariant): LayoutExample[] {
  return LAYOUT_EXAMPLES.filter((e) => e.variant === variant);
}

/** Prompt block: structure inspiration only — do not copy fake dashboards or literal PNG. */
export function getLayoutExamplesPromptBlock(variant?: LayoutExampleVariant): string {
  const examples = variant
    ? getLayoutExamplesForVariant(variant)
    : LAYOUT_EXAMPLES;

  const lines = examples.map(
    (e) =>
      `- ${e.title} [${e.variant}] (${e.path}): ${e.structure}. Headline pattern: "${e.headlinePattern}"`
  );

  return `AD-CARD LAYOUT EXAMPLES (composition inspiration only — never paste these PNGs literally):
${lines.join("\n")}

Shared split rules: logo top-left, editorial headline, short subhead, optional 4 feature icons,
CTA text (or QR in Creative Studio), product proof on right, quiet navy footer.
Replace lifestyle fake dashboards with real AdvisorPilot screenshots from the product catalog.
Diagonal-growth uses a diagonal color/photo plane instead of a device mock.`;
}
