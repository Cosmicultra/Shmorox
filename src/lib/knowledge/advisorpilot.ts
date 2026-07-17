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
  outcomeLine?: string;
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
    { title: "Upload once", description: "Custodian PDFs in. Data extracted." },
    { title: "Prep in minutes", description: "Holdings, risk, and talking points ready." },
    { title: "Deliver with confidence", description: "Walk in prepared. Leave impressed." },
  ],
  contentPillars: [
    {
      id: "prospect-workflow",
      title: "Prospect Review Workflow",
      headline: "Client reviews,\naccelerated.",
      subhead:
        "Automates client review prep from statement intake to meeting materials.",
      cta: "Request a demo",
      description: "Prospect review prep automated across intake, analysis, and follow-up.",
      highlightWord: "accelerated",
      transformationBefore: "Hours rebuilding prep decks before every meeting",
      transformationAfter: "Minutes to client-ready materials",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by advisors, for advisors", description: "Made by advisors who know the review grind." },
        { title: "Statement to PDF leave-behinds", description: "Less time on analysis and prep. More time with clients." },
        { title: "Enterprise power for every advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "statement-intelligence",
      title: "Statement Intelligence",
      headline: "From static statements\nto actionable data.",
      subhead:
        "Extracts custodian statements, confirms holdings, and powers detailed analysis.",
      cta: "Request a demo",
      description: "Custodian statement extraction, holdings confirmation, and analysis.",
      highlightWord: "actionable",
      transformationBefore: "Reconciling PDFs before every review",
      transformationAfter: "Confirmed book of record in minutes",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by advisors, for advisors", description: "Made by advisors who know the review grind." },
        { title: "Statement to PDF leave-behinds", description: "Less time on analysis and prep. More time with clients." },
        { title: "Enterprise power for every advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "portfolio-narrative",
      title: "Portfolio Narrative",
      headline: "Reviews clients\nactually read.",
      subhead:
        "Drafts client-ready portfolio narratives from your holdings data.",
      cta: "Request a demo",
      description: "Structured portfolio summaries and advisor-facing prompts.",
      highlightWord: "read",
      transformationBefore: "Dense spreadsheets clients skim past",
      transformationAfter: "Narratives drafted for your review",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Analysis generates drafts", description: "Risk, diversification, income scores." },
        { title: "Edit with your judgment", description: "Themes aligned to how you advise." },
        { title: "Deliver client-ready reports", description: "PDF, download, or email." },
      ],
    },
    {
      id: "operational-scale",
      title: "Operational Scale",
      headline: "Scale reviews.\nNot headcount.",
      subhead:
        "Scales review prep so your team handles more clients without hiring.",
      cta: "Request a demo",
      description: "Operational efficiency for growing review volume.",
      highlightWord: "headcount",
      transformationBefore: "Three disconnected projects per review cycle",
      transformationAfter: "One workflow from intake to deliverables",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "One intake workflow", description: "Statement to deliverables, connected." },
        { title: "Team throughput visible", description: "Prep time and on-time delivery tracked." },
        { title: "Scale without hiring", description: "Capacity grows with your book." },
      ],
    },
    {
      id: "compliance-posture",
      title: "Compliance Posture",
      headline: "AI assists.\nYou decide.",
      subhead:
        "Traces every step from statement intake to client deliverables.",
      cta: "Request a demo",
      description: "Compliance-conscious positioning for RIA marketing.",
      highlightWord: "decide",
      transformationBefore: "Undocumented prep scattered across tools",
      transformationAfter: "Supervision-ready workflow traceability",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
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
