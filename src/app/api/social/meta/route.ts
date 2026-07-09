import { NextRequest, NextResponse } from "next/server";

const DEMO_MODE = !process.env.META_APP_ID;

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json({ connected: false, demoMode: true });
  }
  return NextResponse.json({
    connected: !!process.env.META_ACCESS_TOKEN,
    accountName: process.env.META_ACCOUNT_NAME ?? "Connected Account",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, imageDataUrl, platform = "instagram" } = body;

  if (!text) {
    return NextResponse.json({ success: false, message: "Post text is required" }, { status: 400 });
  }

  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({
      success: true,
      message: `Demo mode: ${platform} post simulated successfully. Connect Meta API credentials for live posting.`,
      postId: `demo-meta-${Date.now()}`,
      demoMode: true,
      preview: { text: text.slice(0, 100), hasImage: !!imageDataUrl, platform },
    });
  }

  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!token || !pageId) {
    return NextResponse.json(
      { success: false, message: "Meta not connected. Add META_ACCESS_TOKEN and META_PAGE_ID." },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, access_token: token }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, message: `Meta API error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: `Posted to ${platform} successfully`,
      postId: data.id,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `Meta posting failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
