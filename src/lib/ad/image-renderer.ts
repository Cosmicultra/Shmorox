import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { createElement } from "react";
import { AdCardTemplate } from "@/components/AdCardTemplate";
import type { GeneratedAd } from "@/lib/types";
import { buildDemoUrl } from "@/lib/knowledge/advisorpilot";
import { enrichGeneratedAd } from "./ad-creative-content";
import { AD_CARD_LAYOUT_VERSION } from "./ad-card-layout-version";
import { ASSET_PACK_VERSION } from "./asset-pack";
import {
  getCachedAdImage,
  invalidateCachedAdImage,
  setCachedAdImage,
} from "./ad-image-cache";
import { LAYOUT } from "./ad-design-system";
import { PRODUCT_SCREENSHOTS } from "./product-screenshots";
import { generateQRDataUrl } from "./qr-compositor";
import { AD_TEMPLATE_REGISTRY } from "./ad-template-registry";

const LAYOUT_EXAMPLE_PATHS = Object.values(AD_TEMPLATE_REGISTRY)
  .map((t) => t.visual.backgroundAsset)
  .filter((p): p is string => Boolean(p));

const ASSET_PATHS = [
  "/ad-assets/advisorpilot-logo.png",
  ...PRODUCT_SCREENSHOTS.map((s) => s.path),
  ...LAYOUT_EXAMPLE_PATHS,
];

const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

const RENDER_FONT_STYLE_ID = "shmorox-ad-render-fonts";

let fontEmbedCache: string | null = null;

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Fetch font CSS via network (not document.styleSheets) to avoid cssRules SecurityError. */
async function buildFontEmbedCSS(): Promise<string> {
  if (fontEmbedCache != null) return fontEmbedCache;

  try {
    const response = await fetch(FONT_CSS_URL);
    if (!response.ok) {
      fontEmbedCache = "";
      return fontEmbedCache;
    }

    let css = await response.text();
    const urlPattern = /url\(([^)]+)\)/g;
    const replacements = new Map<string, string>();

    for (const match of css.matchAll(urlPattern)) {
      const raw = match[1].replace(/['"]/g, "").trim();
      if (!raw || replacements.has(raw)) continue;

      try {
        const fontResponse = await fetch(raw);
        if (!fontResponse.ok) continue;
        replacements.set(raw, await blobToDataUrl(await fontResponse.blob()));
      } catch {
        // Keep original URL if a single font file fails.
      }
    }

    for (const [url, dataUrl] of replacements) {
      css = css.split(url).join(dataUrl);
    }

    fontEmbedCache = css;
    return fontEmbedCache;
  } catch {
    fontEmbedCache = "";
    return fontEmbedCache;
  }
}

async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === "undefined") return;

  const css = await buildFontEmbedCSS();
  if (!css) return;

  if (!document.getElementById(RENDER_FONT_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = RENDER_FONT_STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
}

let renderEnvironmentReady: Promise<void> | null = null;

/** Load fonts and assets once per session — reused across all ad renders. */
export async function prepareAdRenderEnvironment(): Promise<void> {
  if (!renderEnvironmentReady) {
    renderEnvironmentReady = (async () => {
      await ensureFontsLoaded();
      await Promise.all(ASSET_PATHS.map(preloadImage));
    })();
  }
  return renderEnvironmentReady;
}

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
}

function shouldUseServerRender(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SERVER_RENDER === "true") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

async function renderAdViaServer(
  ad: GeneratedAd,
  includeQR: boolean,
  qrUrl?: string
): Promise<string | null> {
  try {
    const response = await fetch("/api/render-ad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad, includeQR, qrUrl }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { imageDataUrl?: string };
    return data.imageDataUrl ?? null;
  } catch {
    return null;
  }
}

export async function renderAdToImage(
  ad: GeneratedAd,
  includeQR = true,
  qrUrl?: string
): Promise<string> {
  const enriched = enrichGeneratedAd(ad);

  if (shouldUseServerRender()) {
    const serverImage = await renderAdViaServer(enriched, includeQR, qrUrl);
    if (serverImage) return serverImage;
  }

  await prepareAdRenderEnvironment();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const effectiveQrUrl = qrUrl || buildDemoUrl(enriched.platform, undefined);
  let qrDataUrl: string | undefined;
  if (includeQR) {
    qrDataUrl = await generateQRDataUrl(effectiveQrUrl, LAYOUT.qrSize * 2);
  }

  const root = createRoot(container);
  root.render(
    createElement(AdCardTemplate, {
      headline: enriched.headline,
      subhead: enriched.subhead,
      cta: enriched.cta,
      disclaimer: enriched.disclaimer,
      aspectRatio: enriched.aspectRatio,
      contentPillarId: enriched.contentPillarId,
      layoutVariant: enriched.layoutVariant,
      templateId: enriched.templateId,
      platform: enriched.platform,
      qrDataUrl,
    })
  );

  await waitForPaint();

  const element = container.firstElementChild as HTMLElement;
  const fontEmbedCSS = await buildFontEmbedCSS();

  const dataUrl = await toPng(element, {
    width: enriched.width,
    height: enriched.height,
    pixelRatio: 2,
    cacheBust: true,
    includeQueryParams: true,
    fontEmbedCSS,
    skipFonts: fontEmbedCSS === "",
  });

  root.unmount();
  document.body.removeChild(container);

  return dataUrl;
}

export interface RenderAdsOptions {
  campaignId?: string;
  /** Re-render even when a cached or in-memory image already exists */
  force?: boolean;
}

async function renderSingleAd(
  ad: GeneratedAd,
  includeQR: boolean,
  qrUrl: string | undefined,
  options?: RenderAdsOptions
): Promise<GeneratedAd> {
  const { campaignId, force = false } = options ?? {};
  const enriched = enrichGeneratedAd(ad);

  if (!force && enriched.imageDataUrl) {
    return enriched;
  }

  if (
    !force &&
    enriched.renderedLayoutVersion === AD_CARD_LAYOUT_VERSION &&
    enriched.contentHash &&
    enriched.imageDataUrl
  ) {
    return enriched;
  }

  if (!force && campaignId) {
    const cached = await getCachedAdImage(campaignId, enriched.id, {
      contentHash: enriched.contentHash,
      layoutVersion: AD_CARD_LAYOUT_VERSION,
      assetPackVersion: ASSET_PACK_VERSION,
    });
    if (cached && cached.layoutVersion === AD_CARD_LAYOUT_VERSION) {
      return {
        ...enriched,
        imageDataUrl: cached.imageDataUrl,
        renderedLayoutVersion: cached.layoutVersion,
      };
    }
  }

  const imageDataUrl = await renderAdToImage(enriched, includeQR, qrUrl);
  const renderedLayoutVersion = AD_CARD_LAYOUT_VERSION;

  if (campaignId) {
    await setCachedAdImage(campaignId, enriched.id, imageDataUrl, renderedLayoutVersion, {
      contentHash: enriched.contentHash,
      assetPackVersion: ASSET_PACK_VERSION,
    });
  }

  return { ...enriched, imageDataUrl, renderedLayoutVersion };
}

export async function invalidateAdRenderCache(
  campaignId: string,
  adIds: string[]
): Promise<void> {
  await Promise.all(adIds.map((adId) => invalidateCachedAdImage(campaignId, adId)));
}

export async function renderAllAds(
  ads: GeneratedAd[],
  includeQR = true,
  qrUrl?: string,
  options?: RenderAdsOptions
): Promise<GeneratedAd[]> {
  await prepareAdRenderEnvironment();

  return Promise.all(
    ads.map((ad) => renderSingleAd(ad, includeQR, qrUrl, options))
  );
}

/** Packages ads into final export PNGs using the branded AdCardTemplate (screenshots + layout). */
export async function renderAdsForPipeline(
  ads: GeneratedAd[],
  includeQR = true,
  qrUrl?: string,
  options?: RenderAdsOptions
): Promise<GeneratedAd[]> {
  return renderAllAds(ads, includeQR, qrUrl ?? buildDemoUrl("social"), options);
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}
