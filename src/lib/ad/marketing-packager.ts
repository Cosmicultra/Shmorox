import type { AspectRatio, SocialPlatform } from "@/lib/types";
import { ADVISORPILOT_KNOWLEDGE } from "@/lib/knowledge/advisorpilot";
import { generateQRDataUrl } from "./qr-compositor";

const SAFE_ZONES: Record<AspectRatio, { top: number; bottom: number }> = {
  "1:1": { top: 0, bottom: 0 },
  "9:16": { top: 120, bottom: 200 },
};

export interface MarketingPackageOptions {
  creativeAssetUrl: string;
  headline: string;
  subhead: string;
  cta: string;
  disclaimer: string;
  aspectRatio: AspectRatio;
  platform: SocialPlatform;
  qrUrl?: string;
  includeQR?: boolean;
  logoPath?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Transforms a raw creative asset into a marketing-ready asset.
 * AI creates the creative. The renderer creates the marketing asset.
 */
export async function packageMarketingAsset(
  options: MarketingPackageOptions
): Promise<string> {
  const {
    creativeAssetUrl,
    disclaimer,
    aspectRatio,
    qrUrl,
    includeQR = true,
    logoPath = ADVISORPILOT_KNOWLEDGE.logoPath,
  } = options;

  const [baseImage, logoImage] = await Promise.all([
    loadImage(creativeAssetUrl),
    loadImage(logoPath).catch(() => null),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const safeZone = SAFE_ZONES[aspectRatio];
  const scale = canvas.width / 1080;

  ctx.drawImage(baseImage, 0, 0);

  const disclaimerHeight = Math.round(72 * scale);
  const disclaimerY = canvas.height - disclaimerHeight - Math.round(safeZone.bottom * (scale / 2));

  ctx.fillStyle = "rgba(5, 28, 44, 0.92)";
  ctx.fillRect(0, disclaimerY, canvas.width, canvas.height - disclaimerY);

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = `${Math.round(11 * scale)}px Inter, system-ui, sans-serif`;
  const disclaimerLines = wrapText(ctx, disclaimer, canvas.width - Math.round(48 * scale));
  disclaimerLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, Math.round(24 * scale), disclaimerY + Math.round(28 * scale) + i * Math.round(16 * scale));
  });

  if (logoImage) {
    const logoH = Math.round(28 * scale);
    const logoW = (logoImage.width / logoImage.height) * logoH;
    const logoX = Math.round(24 * scale);
    const logoY = Math.round(24 * scale) + safeZone.top * (scale / 2);
    ctx.drawImage(logoImage, logoX, logoY, logoW, logoH);
  }

  if (includeQR && qrUrl) {
    const qrSize = Math.round(56 * scale);
    const padding = Math.round(32 * scale);
    const qrDataUrl = await generateQRDataUrl(qrUrl, qrSize * 2);
    const qrImage = await loadImage(qrDataUrl);

    const x = canvas.width - qrSize - padding;
    const y = canvas.height - qrSize - padding - disclaimerHeight;

    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    const bgPad = Math.round(6 * scale);
    ctx.beginPath();
    ctx.roundRect(x - bgPad, y - bgPad, qrSize + bgPad * 2, qrSize + bgPad * 2, Math.round(6 * scale));
    ctx.fill();

    ctx.globalAlpha = 0.85;
    ctx.drawImage(qrImage, x, y, qrSize, qrSize);
    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL("image/png");
}

export async function packageMarketingAssetsForAds(
  ads: {
    id: string;
    creativeAssetUrl?: string;
    imageDataUrl?: string;
    headline: string;
    subhead: string;
    cta: string;
    disclaimer: string;
    aspectRatio: AspectRatio;
    platform: SocialPlatform;
  }[],
  qrUrl?: string,
  includeQR = true
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const ad of ads) {
    const source = ad.creativeAssetUrl ?? ad.imageDataUrl;
    if (!source) continue;

    results[ad.id] = await packageMarketingAsset({
      creativeAssetUrl: source,
      headline: ad.headline,
      subhead: ad.subhead,
      cta: ad.cta,
      disclaimer: ad.disclaimer,
      aspectRatio: ad.aspectRatio,
      platform: ad.platform,
      qrUrl,
      includeQR,
    });
  }

  return results;
}
