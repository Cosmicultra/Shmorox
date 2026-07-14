/**
 * Real AdvisorPilot UI screenshots for ad creative.
 * Files live in public/ad-assets/screenshots/
 */

export type ProductScreenshotId =
  | "prospect-review"
  | "book-of-record"
  | "statement-intake"
  | "portfolio-analysis"
  | "deliverables"
  | "review-handoffs"
  | "confirm-holdings"
  | "review-analysis"
  | "meeting-deliverables"
  | "statement-capture";

export interface ProductScreenshot {
  id: ProductScreenshotId;
  path: string;
  title: string;
  description: string;
  /** Content pillars this screen best supports */
  pillars: string[];
}

export const PRODUCT_SCREENSHOTS: ProductScreenshot[] = [
  {
    id: "prospect-review",
    path: "/ad-assets/screenshots/prospect-review.png",
    title: "Prospect review",
    description:
      "Prep sequence with statement ingested, holdings confirmed, talking points drafted; ready for meeting.",
    pillars: ["prospect-workflow", "operational-scale"],
  },
  {
    id: "statement-capture",
    path: "/ad-assets/screenshots/statement-capture.png",
    title: "Statement capture",
    description:
      "Drop-zone upload for custodian statements with secure client link and completed file status.",
    pillars: ["statement-intelligence", "prospect-workflow"],
  },
  {
    id: "statement-intake",
    path: "/ad-assets/screenshots/statement-intake.png",
    title: "Statement intake",
    description:
      "Extracted PDF with qualified/taxable/Roth totals and concentration flag callout.",
    pillars: ["statement-intelligence"],
  },
  {
    id: "confirm-holdings",
    path: "/ad-assets/screenshots/confirm-holdings.png",
    title: "Confirm holdings",
    description:
      "Account-type tabs (Qualified / Roth / Taxable) with holdings list and confirm book of record CTA.",
    pillars: ["statement-intelligence", "prospect-workflow"],
  },
  {
    id: "book-of-record",
    path: "/ad-assets/screenshots/book-of-record.png",
    title: "Book of record",
    description:
      "Confirmed holdings table with reconciled badge, account values, and standardization callout.",
    pillars: ["statement-intelligence", "compliance-posture"],
  },
  {
    id: "portfolio-analysis",
    path: "/ad-assets/screenshots/portfolio-analysis.png",
    title: "Portfolio analysis",
    description:
      "Risk budget, diversification, and income reliability meters plus editable draft talking point.",
    pillars: ["portfolio-narrative"],
  },
  {
    id: "review-analysis",
    path: "/ad-assets/screenshots/review-analysis.png",
    title: "Review & analysis",
    description:
      "Risk score, diversification, concentration metrics with stress framing narrative.",
    pillars: ["portfolio-narrative", "compliance-posture"],
  },
  {
    id: "deliverables",
    path: "/ad-assets/screenshots/deliverables.png",
    title: "Deliverables",
    description:
      "Client review document card with PDF, email draft, and archive export actions.",
    pillars: ["portfolio-narrative", "prospect-workflow", "operational-scale"],
  },
  {
    id: "meeting-deliverables",
    path: "/ad-assets/screenshots/meeting-deliverables.png",
    title: "Meeting & deliverables",
    description:
      "Meeting checklist (goals, concentration, follow-ups) with export PDF and draft email.",
    pillars: ["prospect-workflow", "operational-scale"],
  },
  {
    id: "review-handoffs",
    path: "/ad-assets/screenshots/review-handoffs.png",
    title: "Review handoffs",
    description:
      "Convergence of custodian PDF, positions, and narrative into one reconciled book of record across analyst, lead advisor, and client.",
    pillars: ["operational-scale", "compliance-posture", "prospect-workflow"],
  },
];

/** Primary screenshot per content pillar (hero UI for that message). */
export const PILLAR_PRIMARY_SCREENSHOT: Record<string, ProductScreenshotId> = {
  "prospect-workflow": "prospect-review",
  "statement-intelligence": "book-of-record",
  "portfolio-narrative": "portfolio-analysis",
  "operational-scale": "review-handoffs",
  "compliance-posture": "book-of-record",
};

/** Supporting screens to mention or pair with the primary. */
export const PILLAR_SUPPORTING_SCREENSHOTS: Record<string, ProductScreenshotId[]> = {
  "prospect-workflow": ["statement-capture", "meeting-deliverables", "deliverables"],
  "statement-intelligence": ["statement-capture", "statement-intake", "confirm-holdings"],
  "portfolio-narrative": ["review-analysis", "deliverables"],
  "operational-scale": ["prospect-review", "deliverables", "meeting-deliverables"],
  "compliance-posture": ["review-analysis", "review-handoffs"],
};

export function getScreenshotById(id: ProductScreenshotId): ProductScreenshot | undefined {
  return PRODUCT_SCREENSHOTS.find((s) => s.id === id);
}

export function getScreenshotsForPillar(pillarId?: string): ProductScreenshot[] {
  if (!pillarId) return PRODUCT_SCREENSHOTS;
  return PRODUCT_SCREENSHOTS.filter((s) => s.pillars.includes(pillarId));
}

export function getPrimaryScreenshotForPillar(
  pillarId?: string
): ProductScreenshot | undefined {
  if (!pillarId) return PRODUCT_SCREENSHOTS[0];
  const id = PILLAR_PRIMARY_SCREENSHOT[pillarId];
  return id ? getScreenshotById(id) : getScreenshotsForPillar(pillarId)[0];
}

/** Prompt block describing available real UI for image/director models. */
export function getProductScreenshotsPromptBlock(pillarId?: string): string {
  const primary = getPrimaryScreenshotForPillar(pillarId);
  const supportingIds = pillarId ? PILLAR_SUPPORTING_SCREENSHOTS[pillarId] ?? [] : [];
  const supporting = supportingIds
    .map((id) => getScreenshotById(id))
    .filter((s): s is ProductScreenshot => Boolean(s));

  const all =
    pillarId && (primary || supporting.length)
      ? [primary, ...supporting].filter((s): s is ProductScreenshot => Boolean(s))
      : PRODUCT_SCREENSHOTS;

  const lines = all.map(
    (s) =>
      `- ${s.title} (${s.path}): ${s.description}${
        primary && s.id === primary.id ? " [PRIMARY for this pillar]" : ""
      }`
  );

  return `REAL ADVISORPILOT UI SCREENSHOTS (use these — do not invent fake dashboards):
${lines.join("\n")}

When the layout archetype calls for product UI, depict one of these screens accurately:
dark navy window chrome, light grid workspace, royal blue accents, green success badges,
square/institutional corners (not bubbly SaaS). Prefer the PRIMARY screen for the pillar.`;
}
