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
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
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
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "portfolio-narrative",
      title: "Portfolio Narrative",
      headline: "Reports clients\nactually want to see.",
      subhead:
        "Uses AI to show clients and prospects your value in the first meeting.",
      cta: "Request a demo",
      description: "Client-ready reports and narratives for reviews and first meetings.",
      highlightWord: "want",
      transformationBefore: "Dense spreadsheets clients skim past",
      transformationAfter: "Reports and narratives clients engage with",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "operational-scale",
      title: "Operational Scale",
      headline: "Scale your business\nwithout adding headcount.",
      subhead:
        "Uses AI to reduce prospect prep time and grow without hiring more staff.",
      cta: "Request a demo",
      description: "Grow the practice with AI, not more hires.",
      highlightWord: "headcount",
      transformationBefore: "More prospects and reviews, same team size",
      transformationAfter: "More capacity without adding headcount",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "compliance-posture",
      title: "Compliance Posture",
      headline: "AI that keeps you compliant\nand in control.",
      subhead:
        "Compliant analysis, compliant deliverables, compliant automated CRM constant contact.",
      cta: "Request a demo",
      description: "Compliance-ready analysis, deliverables, and client outreach.",
      highlightWord: "compliant",
      transformationBefore: "Compliance gaps across analysis and client materials",
      transformationAfter: "Compliant workflow from analysis to deliverables",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "company-launch",
      title: "Company Launch",
      headline: "AdvisorPilot is\nlive today",
      subhead:
        "Turns statements into analysis and client-ready materials for advisors.",
      cta: "Request a demo",
      description: "AdvisorPilot is live: statements to analysis to meeting materials.",
      highlightWord: "live",
      transformationBefore: "Scattered prep across PDFs, sheets, and drafts",
      transformationAfter: "One live workflow from statement to deliverables",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
      ],
    },
    {
      id: "custom-request",
      title: "Custom Request",
      headline: "Your angle.\nOur product.",
      subhead:
        "Turns statements into analysis and client-ready materials for advisors.",
      cta: "Request a demo",
      description: "Describe the topic — we research AdvisorPilot and write the post.",
      highlightWord: "angle",
      transformationBefore: "Unclear what to say about AdvisorPilot",
      transformationAfter: "A grounded post tied to real product value",
      outcomeLine: "Purpose-built for advisors. Not another generic dashboard.",
      workflowSteps: [
        { title: "Built by financial advisors, for financial advisors", description: "Made by financial advisors who know the review grind." },
        { title: "Time-saving workflow from statement, analysis, to PDF leave-behinds", description: "Less time on prep. More time with clients." },
        { title: "Enterprise power for every financial advisor", description: "Big-firm capability without big-firm overhead." },
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
