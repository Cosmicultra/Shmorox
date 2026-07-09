import { NextRequest, NextResponse } from "next/server";

const DEMO_MODE = !process.env.LINKEDIN_CLIENT_ID;

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json({ connected: false, demoMode: true });
  }
  return NextResponse.json({
    connected: !!process.env.LINKEDIN_ACCESS_TOKEN,
    accountName: process.env.LINKEDIN_ACCOUNT_NAME ?? "Connected Account",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, imageDataUrl } = body;

  if (!text) {
    return NextResponse.json({ success: false, message: "Post text is required" }, { status: 400 });
  }

  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({
      success: true,
      message: "Demo mode: LinkedIn post simulated successfully. Connect API credentials for live posting.",
      postId: `demo-li-${Date.now()}`,
      demoMode: true,
      preview: { text: text.slice(0, 100), hasImage: !!imageDataUrl },
    });
  }

  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "LinkedIn not connected. Add LINKEDIN_ACCESS_TOKEN to environment." },
      { status: 401 }
    );
  }

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: imageDataUrl ? "IMAGE" : "NONE",
          },
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
      message: "Posted to LinkedIn successfully",
      postId: data.id,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `LinkedIn posting failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
