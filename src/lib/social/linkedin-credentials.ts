import { promises as fs } from "fs";
import path from "path";

export type LinkedInCredentials = {
  accessToken: string;
  personId: string;
  accountName: string;
  connectedAt: string;
  expiresAt?: string;
  /** Numeric LinkedIn organization id for company-page posting */
  organizationId?: string;
  organizationName?: string;
  /** When organizationId is set, posts go out as the company page */
  postAs: "person" | "organization";
};

const DATA_DIR = path.join(process.cwd(), ".data");
const CREDENTIALS_PATH = path.join(DATA_DIR, "linkedin.json");

export function getLinkedInRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/linkedin-callback`;
}

export function getLinkedInClientConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Prefer env vanity (e.g. advisorpilot from linkedin.com/company/advisorpilot). */
export function getPreferredOrganizationVanity(): string {
  return (process.env.LINKEDIN_ORGANIZATION_VANITY ?? "advisorpilot").trim().toLowerCase();
}

export function getPreferredOrganizationId(): string | undefined {
  return process.env.LINKEDIN_ORGANIZATION_ID?.trim() || undefined;
}

export async function readLinkedInCredentials(): Promise<LinkedInCredentials | null> {
  try {
    const raw = await fs.readFile(CREDENTIALS_PATH, "utf8");
    const parsed = JSON.parse(raw) as LinkedInCredentials;
    if (!parsed.accessToken || !parsed.personId) return null;
    const postAs =
      parsed.postAs === "person" || parsed.postAs === "organization"
        ? parsed.postAs
        : parsed.organizationId
          ? "organization"
          : "person";
    return {
      ...parsed,
      postAs,
    };
  } catch {
    // Fall back to env vars for manual setup
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const personId = process.env.LINKEDIN_PERSON_ID?.trim();
  if (!accessToken || !personId) return null;

  const organizationId = getPreferredOrganizationId();
  return {
    accessToken,
    personId,
    accountName: process.env.LINKEDIN_ACCOUNT_NAME?.trim() || "Connected Account",
    connectedAt: new Date().toISOString(),
    organizationId,
    organizationName: process.env.LINKEDIN_ORGANIZATION_NAME?.trim(),
    postAs: organizationId ? "organization" : "person",
  };
}

export async function writeLinkedInCredentials(credentials: LinkedInCredentials): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2), "utf8");
}

export async function clearLinkedInCredentials(): Promise<void> {
  try {
    await fs.unlink(CREDENTIALS_PATH);
  } catch {
    // Already gone
  }
}

type OrgCandidate = { id: string; name: string; vanityName?: string };

function extractOrgId(urnOrId: string): string {
  const match = urnOrId.match(/organization:(\d+)/);
  return match?.[1] ?? (urnOrId.replace(/\D/g, "") || urnOrId);
}

/** Find the company page to post as (AdvisorPilot by default). */
export async function resolveLinkedInOrganization(
  accessToken: string
): Promise<OrgCandidate | null> {
  const preferredId = getPreferredOrganizationId();
  if (preferredId) {
    return {
      id: preferredId,
      name: process.env.LINKEDIN_ORGANIZATION_NAME?.trim() || "Company Page",
    };
  }

  const preferredVanity = getPreferredOrganizationVanity();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1) Direct vanity lookup (linkedin.com/company/advisorpilot)
  try {
    const vanityUrl = new URL("https://api.linkedin.com/v2/organizations");
    vanityUrl.searchParams.set("q", "vanityName");
    vanityUrl.searchParams.set("vanityName", preferredVanity);
    const vanityRes = await fetch(vanityUrl, { headers });
    if (vanityRes.ok) {
      const data = (await vanityRes.json()) as {
        elements?: Array<{ id?: number | string; localizedName?: string; vanityName?: string }>;
      };
      const org = data.elements?.[0];
      if (org?.id != null) {
        return {
          id: String(org.id),
          name: org.localizedName || "Company Page",
          vanityName: org.vanityName,
        };
      }
    }
  } catch {
    // continue
  }

  // 2) Pages where this member is an admin
  const candidates: OrgCandidate[] = [];
  try {
    const aclUrl =
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED";
    const aclRes = await fetch(aclUrl, {
      headers: {
        ...headers,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    if (aclRes.ok) {
      const data = (await aclRes.json()) as {
        elements?: Array<{ organization?: string; organizationalTarget?: string }>;
      };
      for (const el of data.elements ?? []) {
        const urn = el.organization || el.organizationalTarget;
        if (!urn) continue;
        const id = extractOrgId(urn);
        if (!id) continue;
        candidates.push({ id, name: `Organization ${id}` });
      }
    }
  } catch {
    // continue
  }

  // Enrich names when possible
  for (const candidate of candidates) {
    try {
      const orgRes = await fetch(`https://api.linkedin.com/v2/organizations/${candidate.id}`, {
        headers,
      });
      if (!orgRes.ok) continue;
      const org = (await orgRes.json()) as { localizedName?: string; vanityName?: string };
      candidate.name = org.localizedName || candidate.name;
      candidate.vanityName = org.vanityName;
    } catch {
      // keep placeholder name
    }
  }

  const byVanity = candidates.find((c) => c.vanityName?.toLowerCase() === preferredVanity);
  if (byVanity) return byVanity;

  const byName = candidates.find((c) => c.name.toLowerCase().includes("advisorpilot"));
  if (byName) return byName;

  return candidates[0] ?? null;
}

export function getLinkedInAuthorUrn(credentials: LinkedInCredentials): string {
  if (credentials.postAs === "organization" && credentials.organizationId) {
    return `urn:li:organization:${credentials.organizationId}`;
  }
  return `urn:li:person:${credentials.personId}`;
}

export function getLinkedInDisplayName(credentials: LinkedInCredentials): string {
  if (credentials.postAs === "organization" && credentials.organizationName) {
    return `${credentials.organizationName} (Company Page)`;
  }
  if (credentials.postAs === "organization" && credentials.organizationId) {
    return "Company Page";
  }
  return `${credentials.accountName} (Personal Profile)`;
}
