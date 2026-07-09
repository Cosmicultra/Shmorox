import QRCode from "qrcode";

export interface QRCompositorOptions {
  imageDataUrl: string;
  qrUrl: string;
  qrSize?: number;
  padding?: number;
}

export async function generateQRDataUrl(url: string, size = 200): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: "#051C2C", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}

export async function compositeQROnImage(
  options: QRCompositorOptions
): Promise<string> {
  const { imageDataUrl, qrUrl, qrSize = 56, padding = 32 } = options;

  const qrDataUrl = await generateQRDataUrl(qrUrl, qrSize);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous";

    baseImage.onload = () => {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      ctx.drawImage(baseImage, 0, 0);

      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";

      qrImage.onload = () => {
        const x = canvas.width - qrSize - padding;
        const y = canvas.height - qrSize - padding;

        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        const bgPad = 6;
        const radius = 6;
        const w = qrSize + bgPad * 2;
        const h = qrSize + bgPad * 2;
        const rx = x - bgPad;
        const ry = y - bgPad;
        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + w - radius, ry);
        ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + radius);
        ctx.lineTo(rx + w, ry + h - radius);
        ctx.quadraticCurveTo(rx + w, ry + h, rx + w - radius, ry + h);
        ctx.lineTo(rx + radius, ry + h);
        ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.72;
        ctx.drawImage(qrImage, x, y, qrSize, qrSize);
        ctx.globalAlpha = 1;
        resolve(canvas.toDataURL("image/png"));
      };

      qrImage.onerror = () => reject(new Error("Failed to load QR code"));
      qrImage.src = qrDataUrl;
    };

    baseImage.onerror = () => reject(new Error("Failed to load base image"));
    baseImage.src = imageDataUrl;
  });
}

export async function compositeQROnAllAds(
  ads: { id: string; imageDataUrl?: string }[],
  qrUrl: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const ad of ads) {
    if (!ad.imageDataUrl) continue;
    results[ad.id] = await compositeQROnImage({
      imageDataUrl: ad.imageDataUrl,
      qrUrl,
    });
  }

  return results;
}
