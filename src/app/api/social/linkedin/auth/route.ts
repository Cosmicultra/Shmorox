import { NextRequest, NextResponse } from "next/server";
import { getLinkedInClientConfig, getLinkedInRedirectUri } from "@/lib/social/linkedin-credentials";

/** Personal profile posting (Sign In with LinkedIn + Share on LinkedIn). */
const LINKEDIN_PERSON_SCOPES = ["openid", "profile", "w_member_social"].join(" ");

/** Company page posting (Community Management API). */
const LINKEDIN_ORG_SCOPES = [
  "openid",
  "profile",
  "w_member_social",
  "w_organization_social",
  "r_organization_social",
].join(" ");

export async function GET(req: NextRequest) {
  const config = getLinkedInClientConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL(
        "/settings/social?linkedin_error=" +
          encodeURIComponent("Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env.local, then restart the server."),
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      )
    );
  }

  const asParam = req.nextUrl.searchParams.get("as");
  const postAs = asParam === "person" ? "person" : "organization";
  const scope = postAs === "person" ? LINKEDIN_PERSON_SCOPES : LINKEDIN_ORG_SCOPES;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: getLinkedInRedirectUri(),
    scope,
    state: `postas:${postAs}`,
  });

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
}
