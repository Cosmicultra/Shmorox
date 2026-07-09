import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { createElement } from "react";
import { AdCardTemplate } from "@/components/AdCardTemplate";
import type { GeneratedAd } from "@/lib/types";
import { buildDemoUrl } from "@/lib/knowledge/advisorpilot";
import { packageMarketingAsset } from "./marketing-packager";
import { generateQRDataUrl } from "./qr-compositor";

const ASSET_PATHS = ["/ad-assets/advisorpilot-logo.png"];

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
  await new Promise((resolve) => setTimeout(resolve, 350));
}

export async function renderAdToImage(
  ad: GeneratedAd,
  includeQR = true,
  qrUrl?: string
): Promise<string> {
  await prepareAdRenderEnvironment();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const effectiveQrUrl =
    qrUrl || buildDemoUrl(ad.platform, undefined);
  let qrDataUrl: string | undefined;
  if (includeQR) {
    qrDataUrl = await generateQRDataUrl(effectiveQrUrl, 320);
  }

  const root = createRoot(container);
  root.render(
    createElement(AdCardTemplate, {
      headline: ad.headline,
      subhead: ad.subhead,
      cta: ad.cta,
      disclaimer: ad.disclaimer,
      aspectRatio: ad.aspectRatio,
      contentPillarId: ad.contentPillarId,
      layoutVariant: ad.layoutVariant,
      qrDataUrl,
    })
  );

  await waitForPaint();

  const element = container.firstElementChild as HTMLElement;
  const fontEmbedCSS = await buildFontEmbedCSS();

  const dataUrl = await toPng(element, {
    width: ad.width,
    height: ad.height,
    pixelRatio: 2,
    cacheBust: true,
    includeQueryParams: true,
    // Pre-inlined fonts bypass html-to-image's cssRules walk (cross-origin SecurityError).
    fontEmbedCSS,
    skipFonts: fontEmbedCSS === "",
  });

  root.unmount();
  document.body.removeChild(container);

  return dataUrl;
}

export async function renderAllAds(
  ads: GeneratedAd[],
  includeQR = true,
  qrUrl?: string
): Promise<GeneratedAd[]> {
  await prepareAdRenderEnvironment();

  return Promise.all(
    ads.map(async (ad) => {
      const imageDataUrl = await renderAdToImage(ad, includeQR, qrUrl);
      return { ...ad, imageDataUrl };
    })
  );
}

/** Packages creative assets into marketing-ready ads (logo, disclaimer, QR, safe zones). */
export async function renderAdsForPipeline(
  ads: GeneratedAd[],
  includeQR = true,
  qrUrl?: string
): Promise<GeneratedAd[]> {
  const effectiveQrUrl = qrUrl ?? buildDemoUrl("social");
  await prepareAdRenderEnvironment();

  return Promise.all(
    ads.map(async (ad) => {
      let creativeSource = ad.creativeAssetUrl ?? ad.imageDataUrl;

      if (creativeSource && ad.creativeAssetUrl && ad.aspectRatio !== "1:1") {
        const { adaptMasterToAspectRatio } = await import("./layout-adapter");
        creativeSource = await adaptMasterToAspectRatio(ad.creativeAssetUrl, ad.aspectRatio);
      }

      if (creativeSource && ad.creativeAssetUrl) {
        const packaged = await packageMarketingAsset({
          creativeAssetUrl: creativeSource,
          headline: ad.headline,
          subhead: ad.subhead,
          cta: ad.cta,
          disclaimer: ad.disclaimer,
          aspectRatio: ad.aspectRatio,
          platform: ad.platform,
          qrUrl: effectiveQrUrl,
          includeQR,
        });
        return { ...ad, imageDataUrl: packaged };
      }

      if (creativeSource && !ad.creativeAssetUrl) {
        return ad;
      }

      const imageDataUrl = await renderAdToImage(ad, includeQR, effectiveQrUrl);
      return { ...ad, imageDataUrl };
    })
  );
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
