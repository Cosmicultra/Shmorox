import { NextRequest, NextResponse } from "next/server";
import {
  clearLinkedInCredentials,
  getLinkedInAuthorUrn,
  getLinkedInClientConfig,
  getLinkedInDisplayName,
  readLinkedInCredentials,
  writeLinkedInCredentials,
} from "@/lib/social/linkedin-credentials";
import { uploadLinkedInImage } from "@/lib/social/linkedin-media";

export async function GET() {
  const config = getLinkedInClientConfig();
  if (!config) {
    return NextResponse.json({ connected: false, demoMode: true });
  }

  const credentials = await readLinkedInCredentials();
  if (!credentials) {
    return NextResponse.json({ connected: false, demoMode: false });
  }

  return NextResponse.json({
    connected: true,
    accountName: getLinkedInDisplayName(credentials),
    personName: credentials.accountName,
    postAs: credentials.postAs,
    organizationId: credentials.organizationId,
    organizationName: credentials.organizationName,
    demoMode: false,
  });
}

export async function PATCH(req: NextRequest) {
  const credentials = await readLinkedInCredentials();
  if (!credentials) {
    return NextResponse.json({ success: false, message: "LinkedIn is not connected." }, { status: 401 });
  }

  let body: { postAs?: string };
  try {
    body = (await req.json()) as { postAs?: string };
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const postAs = body.postAs;
  if (postAs !== "person" && postAs !== "organization") {
    return NextResponse.json(
      { success: false, message: 'postAs must be "person" or "organization".' },
      { status: 400 }
    );
  }

  if (postAs === "organization" && !credentials.organizationId) {
    return NextResponse.json(
      {
        success: false,
        message:
          "No company page is available on this connection. Reconnect and choose Company Page, or set LINKEDIN_ORGANIZATION_ID.",
      },
      { status: 400 }
    );
  }

  const updated = { ...credentials, postAs };
  await writeLinkedInCredentials(updated);

  return NextResponse.json({
    success: true,
    connected: true,
    accountName: getLinkedInDisplayName(updated),
    personName: updated.accountName,
    postAs: updated.postAs,
    organizationId: updated.organizationId,
    organizationName: updated.organizationName,
  });
}

export async function DELETE() {
  await clearLinkedInCredentials();
  return NextResponse.json({ success: true, connected: false });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, imageDataUrl } = body;

  if (!text) {
    return NextResponse.json({ success: false, message: "Post text is required" }, { status: 400 });
  }

  const config = getLinkedInClientConfig();
  if (!config) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({
      success: true,
      message: "Demo mode: LinkedIn post simulated successfully. Connect API credentials for live posting.",
      postId: `demo-li-${Date.now()}`,
      demoMode: true,
      preview: { text: text.slice(0, 100), hasImage: !!imageDataUrl },
    });
  }

  const credentials = await readLinkedInCredentials();
  if (!credentials) {
    return NextResponse.json(
      {
        success: false,
        message: "LinkedIn not connected. Go to Settings → Social and click Connect on LinkedIn.",
      },
      { status: 401 }
    );
  }

  const authorUrn = getLinkedInAuthorUrn(credentials);
  const postingAsCompany = credentials.postAs === "organization" && !!credentials.organizationId;

  try {
    let shareContent: Record<string, unknown> = {
      shareCommentary: { text },
      shareMediaCategory: "NONE",
    };

    if (typeof imageDataUrl === "string" && imageDataUrl.length > 0) {
      try {
        const assetUrn = await uploadLinkedInImage({
          accessToken: credentials.accessToken,
          ownerUrn: authorUrn,
          imageDataUrl,
        });
        shareContent = {
          shareCommentary: { text },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              media: assetUrn,
              title: { text: "AdvisorPilot" },
            },
          ],
        };
      } catch (uploadErr) {
        return NextResponse.json(
          {
            success: false,
            message: `LinkedIn image upload failed: ${
              uploadErr instanceof Error ? uploadErr.message : "Unknown error"
            }`,
          },
          { status: 502 }
        );
      }
    }

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": shareContent,
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, message: `LinkedIn API error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: postingAsCompany
        ? `Posted to ${credentials.organizationName ?? "company page"} successfully`
        : `Posted to your LinkedIn profile (${credentials.accountName}) successfully`,
      postId: data.id,
      author: authorUrn,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `LinkedIn posting failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
