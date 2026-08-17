import { NextResponse } from "next/server";
import type { GeneratedAd } from "@/lib/types";
import { enrichGeneratedAd } from "@/lib/ad/ad-creative-content";
import {
  deleteRenderPayload,
  putRenderPayload,
  takeRenderPayload,
} from "@/lib/ad/render-payload-store";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RenderAdRequest {
  ad: GeneratedAd;
  includeQR?: boolean;
  qrUrl?: string;
  campaignId?: string;
}

async function renderWithPlaywright(
  ad: GeneratedAd,
  includeQR: boolean,
  qrUrl?: string
): Promise<Buffer | null> {
  const token = putRenderPayload({ ad, includeQR, qrUrl });

  try {
    const { chromium } = await import("playwright");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const query = new URLSearchParams({ payload: token });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: ad.width, height: ad.height },
      deviceScaleFactor: 2,
    });

    await page.goto(`${baseUrl}/render/ad?${query.toString()}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    await page.waitForSelector('[data-render-status="ready"]', { timeout: 30000 });

    const element = page.locator("[data-ad-id]");
    const screenshot = await element.screenshot({ type: "png" });
    await browser.close();
    return screenshot;
  } catch (error) {
    console.warn("[render-ad] Playwright unavailable or failed:", error);
    return null;
  } finally {
    deleteRenderPayload(token);
  }
}

/** Payload handoff for the Playwright render page — keeps large artwork out of the URL. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("payload");
  if (!token) {
    return NextResponse.json({ error: "Missing payload token" }, { status: 400 });
  }

  const payload = takeRenderPayload(token);
  if (!payload) {
    return NextResponse.json({ error: "Payload expired or not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  let body: RenderAdRequest;
  try {
    body = (await request.json()) as RenderAdRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.ad?.id) {
    return NextResponse.json({ error: "Missing ad payload" }, { status: 400 });
  }

  const ad = enrichGeneratedAd(body.ad);
  const includeQR = body.includeQR !== false;

  const pngBuffer = await renderWithPlaywright(ad, includeQR, body.qrUrl);
  if (!pngBuffer) {
    return NextResponse.json(
      { error: "Server render unavailable — use client fallback" },
      { status: 503 }
    );
  }

  const imageDataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;
  return NextResponse.json({ imageDataUrl, adId: ad.id });
}
