import type { AspectRatio } from "@/lib/types";

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

const BRAND_BACKGROUND = "#051c2c";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load master image for layout adaptation"));
    img.src = src;
  });
}

/**
 * Phase 4: adapt the single master image to other aspect ratios via canvas rendering.
 * No additional AI image generations.
 */
export async function adaptMasterToAspectRatio(
  masterImageUrl: string,
  aspectRatio: AspectRatio
): Promise<string> {
  if (aspectRatio === "1:1") return masterImageUrl;
  if (typeof document === "undefined") {
    return masterImageUrl;
  }

  const master = await loadImage(masterImageUrl);
  const target = ASPECT_DIMENSIONS[aspectRatio];
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for layout adaptation");

  ctx.fillStyle = BRAND_BACKGROUND;
  ctx.fillRect(0, 0, target.width, target.height);

  const heroMaxHeight = Math.round(target.height * 0.58);
  const scale = Math.min(target.width / master.width, heroMaxHeight / master.height);
  const width = master.width * scale;
  const height = master.height * scale;
  const x = (target.width - width) / 2;
  const y = Math.round(target.height * 0.06);

  ctx.drawImage(master, x, y, width, height);

  return canvas.toDataURL("image/png");
}

export async function adaptMasterToAspectRatios(
  masterImageUrl: string,
  aspectRatios: AspectRatio[]
): Promise<Partial<Record<AspectRatio, string>>> {
  const adapted: Partial<Record<AspectRatio, string>> = {
    "1:1": masterImageUrl,
  };

  const toAdapt = aspectRatios.filter((ratio) => ratio !== "1:1");
  await Promise.all(
    toAdapt.map(async (ratio) => {
      adapted[ratio] = await adaptMasterToAspectRatio(masterImageUrl, ratio);
    })
  );

  return adapted;
}
