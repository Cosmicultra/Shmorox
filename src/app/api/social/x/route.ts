import { NextRequest, NextResponse } from "next/server";

const DEMO_MODE = !process.env.X_API_KEY;

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json({ connected: false, demoMode: true });
  }
  return NextResponse.json({
    connected: !!process.env.X_ACCESS_TOKEN,
    accountName: process.env.X_ACCOUNT_NAME ?? "@ConnectedAccount",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, imageDataUrl } = body;

  if (!text) {
    return NextResponse.json({ success: false, message: "Post text is required" }, { status: 400 });
  }

  if (text.length > 280) {
    return NextResponse.json(
      { success: false, message: `Post exceeds 280 character limit (${text.length} chars)` },
      { status: 400 }
    );
  }

  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({
      success: true,
      message: "Demo mode: X post simulated successfully. Connect X API credentials for live posting.",
      postId: `demo-x-${Date.now()}`,
      demoMode: true,
      preview: { text, hasImage: !!imageDataUrl },
    });
  }

  const token = process.env.X_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "X not connected. Add X_ACCESS_TOKEN to environment." },
      { status: 401 }
    );
  }

  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, message: `X API error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: "Posted to X successfully",
      postId: data.data?.id,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: `X posting failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
