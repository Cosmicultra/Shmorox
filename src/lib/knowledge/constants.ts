export const ADVISORPILOT_BRAND_MARK = "AdvisorPilot™";
export const ADVISORPILOT_DEMO_URL = "https://www.advisorpilot.ai/demo";
export const ADVISORPILOT_POST_LINK_LABEL =
  "Book a Demo with AdvisorPilot, or sign-up for our free trial account and see for yourself.";
export const ADVISORPILOT_AD_CARD_TRIAL_CTA = "or sign-up for our free trial account.";
export const ADVISORPILOT_STANDARD_DISCLAIMER =
  "For professional workflow and discussion only. Not an offer, solicitation, or recommendation of securities or advisory services. AI assists workflow preparation, not investment advice.";

const PILLAR_TITLES: Record<string, string> = {
  "prospect-workflow": "Prospect Review Workflow",
  "statement-intelligence": "Statement Intelligence",
  "portfolio-narrative": "Portfolio Narrative",
  "operational-scale": "Operational Scale",
  "compliance-posture": "Compliance Posture",
  "company-launch": "Company Launch",
  "custom-request": "Custom Request",
  "personal-brand": "Personal Brand",
};

export function getPillarTitle(pillarId: string): string {
  return PILLAR_TITLES[pillarId] ?? ADVISORPILOT_BRAND_MARK;
}
