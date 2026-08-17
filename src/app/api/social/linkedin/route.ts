import { NextRequest, NextResponse } from "next/server";
import {
  clearLinkedInCredentials,
  getLinkedInAuthorUrn,
  getLinkedInClientConfig,
  getLinkedInDisplayName,
  readLinkedInCredentials,
  writeLinkedInCredentials,
} from "@/lib/social/linkedin-credentials";
import {
  describeFetchError,
  escapeLinkedInCommentary,
  linkedInRestFetch,
  uploadLinkedInImage,
} from "@/lib/social/linkedin-media";

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
  const hasImage = typeof imageDataUrl === "string" && imageDataUrl.length > 0;

  try {
    let imageUrn: string | undefined;

    if (hasImage) {
      try {
        imageUrn = await uploadLinkedInImage({
          accessToken: credentials.accessToken,
          ownerUrn: authorUrn,
          imageDataUrl,
        });
      } catch (uploadErr) {
        const msg = describeFetchError(uploadErr);
        console.error("[linkedin/post] image upload failed", {
          authorUrn,
          postAs: credentials.postAs,
          error: msg.slice(0, 800),
        });
        return NextResponse.json(
          {
            success: false,
            message: `LinkedIn image upload failed: ${msg}`,
          },
          { status: 502 }
        );
      }
    }

    const payload: Record<string, unknown> = {
      author: authorUrn,
      commentary: escapeLinkedInCommentary(text),
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    };

    if (imageUrn) {
      payload.content = {
        media: {
          title: "AdvisorPilot",
          id: imageUrn,
        },
      };
    }

    const res = await linkedInRestFetch("post", "https://api.linkedin.com/rest/posts", {
      accessToken: credentials.accessToken,
      method: "POST",
      body: payload,
    });

    if (!res.ok) {
      console.error("[linkedin/post] rest/posts failed", {
        status: res.status,
        authorUrn,
        postAs: credentials.postAs,
        hasImage,
        apiVersion: res.version,
        error: res.text.slice(0, 800),
      });
      return NextResponse.json(
        { success: false, message: `LinkedIn API error (${res.status}): ${res.text}` },
        { status: 502 }
      );
    }

    const postId = res.headers.get("x-restli-id") || res.headers.get("X-RestLi-Id") || undefined;

    return NextResponse.json({
      success: true,
      message: postingAsCompany
        ? `Posted to ${credentials.organizationName ?? "company page"} successfully`
        : `Posted to your LinkedIn profile (${credentials.accountName}) successfully`,
      postId,
      author: authorUrn,
    });
  } catch (err) {
    const msg = describeFetchError(err);
    console.error("[linkedin/post] failed", { authorUrn, postAs: credentials.postAs, hasImage, error: msg.slice(0, 800) });
    return NextResponse.json(
      { success: false, message: `LinkedIn posting failed: ${msg}` },
      { status: 500 }
    );
  }
}
