import { NextRequest, NextResponse } from "next/server";

const DEMO_MODE = !process.env.TIKTOK_CLIENT_KEY;

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json({ connected: false, demoMode: true });
  }
  return NextResponse.json({
    connected: !!process.env.TIKTOK_ACCESS_TOKEN,
    accountName: process.env.TIKTOK_ACCOUNT_NAME ?? "Connected Account",
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
      message: "Demo mode: TikTok post simulated successfully. Connect TikTok API credentials for live posting.",
      postId: `demo-tt-${Date.now()}`,
      demoMode: true,
      preview: { text: text.slice(0, 100), hasImage: !!imageDataUrl },
    });
  }

  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "TikTok not connected. Add TIKTOK_ACCESS_TOKEN to environment." },
      { status: 401 }
    );
  }

  try {
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: { title: text, privacy_level: "PUBLIC_TO_EVERYONE" },
        source_info: { source: "PULL_FROM_URL", photo_images: imageDataUrl ? [imageDataUrl] : [] },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, message: `TikTok API error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: "Posted to TikTok successfully",
      postId: data.data?.publish_id,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `TikTok posting failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
