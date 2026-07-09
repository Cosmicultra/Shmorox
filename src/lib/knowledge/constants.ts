export const ADVISORPILOT_BRAND_MARK = "AdvisorPilot™";
export const ADVISORPILOT_DEMO_URL = "https://www.advisorpilot.ai/";
export const ADVISORPILOT_STANDARD_DISCLAIMER =
  "For professional workflow and discussion only. Not an offer, solicitation, or recommendation of securities or advisory services. AI assists workflow preparation, not investment advice.";

const PILLAR_TITLES: Record<string, string> = {
  "prospect-workflow": "Prospect Review Workflow",
  "statement-intelligence": "Statement Intelligence",
  "portfolio-narrative": "Portfolio Narrative",
  "operational-scale": "Operational Scale",
  "compliance-posture": "Compliance Posture",
};

export function getPillarTitle(pillarId: string): string {
  return PILLAR_TITLES[pillarId] ?? ADVISORPILOT_BRAND_MARK;
}
