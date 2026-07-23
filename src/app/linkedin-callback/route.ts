import { NextRequest, NextResponse } from "next/server";
import {
  getLinkedInClientConfig,
  getLinkedInDisplayName,
  getLinkedInRedirectUri,
  resolveLinkedInOrganization,
  writeLinkedInCredentials,
} from "@/lib/social/linkedin-credentials";

function settingsRedirect(query: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL("/settings/social", base);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");
  if (error) {
    return settingsRedirect({
      linkedin_error: errorDescription || error,
    });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return settingsRedirect({
      linkedin_error: "LinkedIn did not return an authorization code. Try Connect again.",
    });
  }

  const state = req.nextUrl.searchParams.get("state") ?? "";
  const preferredPostAs =
    state === "postas:person" ? ("person" as const) : ("organization" as const);

  const config = getLinkedInClientConfig();
  if (!config) {
    return settingsRedirect({
      linkedin_error: "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env.local.",
    });
  }

  const redirectUri = getLinkedInRedirectUri();
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  let tokenRes: Response;
  try {
    tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });
  } catch (err) {
    return settingsRedirect({
      linkedin_error: `Could not reach LinkedIn token endpoint: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  const tokenText = await tokenRes.text();
  let tokenJson: {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  try {
    tokenJson = JSON.parse(tokenText) as typeof tokenJson;
  } catch {
    return settingsRedirect({
      linkedin_error: `LinkedIn token response was not JSON: ${tokenText.slice(0, 200)}`,
    });
  }

  if (!tokenRes.ok || !tokenJson.access_token) {
    return settingsRedirect({
      linkedin_error:
        tokenJson.error_description ||
        tokenJson.error ||
        `LinkedIn rejected the token exchange (${tokenRes.status}). Check Client ID/Secret and redirect URL.`,
    });
  }

  const accessToken = tokenJson.access_token;

  let personId = "";
  let accountName = "LinkedIn Account";

  try {
    const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userInfoRes.ok) {
      const userInfo = (await userInfoRes.json()) as { sub?: string; name?: string };
      personId = userInfo.sub ?? "";
      accountName = userInfo.name?.trim() || accountName;
    }
  } catch {
    // Fall through to /v2/me
  }

  if (!personId) {
    try {
      const meRes = await fetch("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok) {
        const me = (await meRes.json()) as {
          id?: string;
          localizedFirstName?: string;
          localizedLastName?: string;
        };
        personId = me.id ?? "";
        const name = [me.localizedFirstName, me.localizedLastName].filter(Boolean).join(" ");
        if (name) accountName = name;
      }
    } catch {
      // leave personId empty and fail below
    }
  }

  if (!personId) {
    return settingsRedirect({
      linkedin_error:
        "Got an access token, but could not read your LinkedIn person id. Ensure Sign In with LinkedIn (OpenID) is enabled on the app.",
    });
  }

  const organization = await resolveLinkedInOrganization(accessToken);
  const expiresAt =
    typeof tokenJson.expires_in === "number"
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : undefined;

  const canPostAsOrg = !!organization?.id;
  const postAs =
    preferredPostAs === "person" || !canPostAsOrg
      ? ("person" as const)
      : ("organization" as const);

  const credentials = {
    accessToken,
    personId,
    accountName,
    connectedAt: new Date().toISOString(),
    expiresAt,
    organizationId: organization?.id,
    organizationName: organization?.name,
    postAs,
  };

  await writeLinkedInCredentials(credentials);

  if (preferredPostAs === "organization" && !canPostAsOrg) {
    return settingsRedirect({
      linkedin: "connected",
      account: `${accountName} (Personal Profile)`,
      linkedin_error:
        "Connected to your personal profile. No company page was found for this account — grant page admin access or set LINKEDIN_ORGANIZATION_ID.",
    });
  }

  return settingsRedirect({
    linkedin: "connected",
    account: getLinkedInDisplayName(credentials),
  });
}
