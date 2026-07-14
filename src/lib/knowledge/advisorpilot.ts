import { ADVISORPILOT_DEMO_URL, ADVISORPILOT_POST_LINK_LABEL } from "./constants";

export interface WorkflowStep {
  title: string;
  description: string;
}

export interface ContentPillar {
  id: string;
  title: string;
  headline: string;
  subhead: string;
  cta: string;
  description: string;
  highlightWord?: string;
  transformationBefore: string;
  transformationAfter: string;
  workflowSteps?: WorkflowStep[];
}

export interface AdvisorPilotKnowledge {
  brand: string;
  brandMark: string;
  logoPath: string;
  tagline: string;
  websiteUrl: string;
  demoUrl: string;
  postLinkLabel: string;
  voice: string[];
  valueProps: string[];
  approvedPhrases: string[];
  prohibitedClaims: string[];
  standardDisclaimer: string;
  targetAudience: string[];
  visualTokens: {
    navy: string;
    blue: string;
    mist: string;
    accent: string;
    textLight: string;
  };
  trustBanner: string;
  brandTagline: string;
  defaultWorkflowSteps: WorkflowStep[];
  contentPillars: ContentPillar[];
}

export const ADVISORPILOT_KNOWLEDGE: AdvisorPilotKnowledge = {
  brand: "AdvisorPilot",
  brandMark: "AdvisorPilot™",
  logoPath: "/ad-assets/advisorpilot-logo.png",
  tagline: "Built by Advisors for Advisors",
  websiteUrl: "https://www.advisorpilot.ai/",
  demoUrl: ADVISORPILOT_DEMO_URL,
  postLinkLabel: ADVISORPILOT_POST_LINK_LABEL,
  voice: [
    "Professional and fiduciary-aware",
    "Workflow-focused, not hype-driven",
    "Confident but never overpromising",
    "Speaks to independent RIAs as peers",
    "Emphasizes discipline over disruption",
  ],
  valueProps: [
    "One continuous workflow from statement intake to client-ready materials",
    "Statement intelligence: custodian PDFs to structured holdings in minutes",
    "Portfolio narrative drafts aligned to how advisors actually advise",
    "Scale review operations without adding headcount",
    "Traceability from intake to outbound materials for supervision",
    "AI assists operational prep, does not replace fiduciary judgment",
  ],
  approvedPhrases: [
    "Built by Advisors for Advisors",
    "Statement in. Materials out.",
    "Scale reviews with AI, not headcount",
    "Turning prospects into clients in half the time",
    "One continuous workflow, not three disconnected projects",
    "Purpose-built workflow software for independent advisors",
    "Wirehouse-grade discipline without wirehouse infrastructure",
    "AI structures risk and diversification into drafts",
    "Nothing is transmitted without your action",
  ],
  prohibitedClaims: [
    "guaranteed returns",
    "beat the market",
    "always outperforms",
    "SEC-approved",
    "FINRA-certified",
    "replaces your judgment",
    "automated advice",
    "we recommend you buy",
    "double your money",
    "best RIA software",
    "#1 advisor platform",
  ],
  standardDisclaimer:
    "For professional workflow and discussion only. Not an offer, solicitation, or recommendation of securities or advisory services. AI assists workflow preparation, not investment advice.",
  targetAudience: [
    "Independent RIAs",
    "Lead advisors and principals",
    "Small collaborative advisory offices",
    "Analysts at growing advisory firms",
    "Institutional firms seeking operational discipline",
  ],
  visualTokens: {
    navy: "#051C2C",
    blue: "#2251FF",
    mist: "#F4F6F8",
    accent: "#C8A96E",
    textLight: "#E8EDF2",
  },
  trustBanner: "Built for advisors. Trusted by forward-thinking firms.",
  brandTagline: "ANALYZE. INSIGHT. ADVISE. GROW.",
  defaultWorkflowSteps: [
    { title: "Upload statements", description: "We extract what matters." },
    { title: "AI analyzes & organizes", description: "Holdings, fees, performance, risk." },
    { title: "You review & deliver", description: "Professional, polished, and fast." },
  ],
  contentPillars: [
    {
      id: "prospect-workflow",
      title: "Prospect Review Workflow",
      headline: "Client reviews,\naccelerated.",
      subhead: "One continuous workflow from statement intake to client-ready materials.",
      cta: "Request a demo",
      description: "Prospect review prep automated across intake, analysis, and follow-up.",
      highlightWord: "accelerated",
      transformationBefore: "Hours on prep",
      transformationAfter: "Minutes to deliverables",
      workflowSteps: [
        { title: "Upload statements", description: "We extract what matters." },
        { title: "AI analyzes & organizes", description: "Holdings, fees, performance, risk." },
        { title: "You review & deliver", description: "Professional, polished, and fast." },
      ],
    },
    {
      id: "statement-intelligence",
      title: "Statement Intelligence",
      headline: "Custodian statements,\nstructured.",
      subhead: "Confirmed holdings before your analysis depends on them.",
      cta: "See the workflow",
      description: "Custodian statement extraction and holdings reconciliation.",
      highlightWord: "structured",
      transformationBefore: "Manual PDF parsing",
      transformationAfter: "Structured holdings",
      workflowSteps: [
        { title: "Import custodian PDFs", description: "Schwab, Fidelity, Pershing, and more." },
        { title: "AI structures holdings", description: "Positions mapped and reconciled." },
        { title: "Confirm before analysis", description: "Verified book of record." },
      ],
    },
    {
      id: "portfolio-narrative",
      title: "Portfolio Narrative",
      headline: "Reviews clients\nactually read.",
      subhead: "Structured narratives drafted for your review. Your judgment throughout.",
      cta: "Request a demo",
      description: "Structured portfolio summaries and advisor-facing prompts.",
      highlightWord: "read",
      transformationBefore: "Dense spreadsheets",
      transformationAfter: "Clear client narratives",
      workflowSteps: [
        { title: "Analysis generates drafts", description: "Risk, diversification, income scores." },
        { title: "Edit with your judgment", description: "Themes aligned to how you advise." },
        { title: "Deliver client-ready reports", description: "PDF preview, download, email." },
      ],
    },
    {
      id: "operational-scale",
      title: "Operational Scale",
      headline: "Scale reviews.\nNot headcount.",
      subhead: "Intake, analysis, and deliverables in one disciplined workflow.",
      cta: "Request access",
      description: "Operational efficiency for growing review volume.",
      highlightWord: "headcount",
      transformationBefore: "Disconnected systems",
      transformationAfter: "One unified platform",
      workflowSteps: [
        { title: "One intake workflow", description: "Statement to deliverables, connected." },
        { title: "Team throughput visible", description: "Prep time, completion, on-time delivery." },
        { title: "Scale without headcount", description: "More reviews, same team." },
      ],
    },
    {
      id: "compliance-posture",
      title: "Compliance Posture",
      headline: "AI assists.\nYou decide.",
      subhead: "Full traceability from source documents to outbound materials.",
      cta: "Learn more",
      description: "Compliance-conscious positioning for RIA marketing.",
      highlightWord: "decide",
      transformationBefore: "Manual analysis",
      transformationAfter: "Auditable AI workflow",
      workflowSteps: [
        { title: "Full audit trail", description: "Every action timestamped and logged." },
        { title: "AI assists, you decide", description: "Nothing transmits without your action." },
        { title: "Supervision-ready outputs", description: "Traceable from source to delivery." },
      ],
    },
  ],
};

export function getPillarById(id: string): ContentPillar | undefined {
  return ADVISORPILOT_KNOWLEDGE.contentPillars.find((p) => p.id === id);
}

export function buildDemoUrl(platform: string, campaignId?: string): string {
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: "organic",
    utm_campaign: "advisorpilot_social",
  });
  if (campaignId) params.set("utm_content", campaignId);
  return `${ADVISORPILOT_KNOWLEDGE.demoUrl}?${params.toString()}`;
}
