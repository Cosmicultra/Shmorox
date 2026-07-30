/**
 * Upload an image via LinkedIn Images API for use with /rest/posts.
 * @see https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
 */

export const LINKEDIN_API_VERSION = "202502";

export function linkedInApiHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

async function loadImageBytes(
  imageDataUrl: string
): Promise<{ bytes: Buffer; contentType: string }> {
  if (imageDataUrl.startsWith("data:")) {
    // Avoid regex on multi-MB base64 payloads — `.+` can blow the call stack.
    const comma = imageDataUrl.indexOf(",");
    if (comma < 0) {
      throw new Error("Invalid image data URL");
    }
    const header = imageDataUrl.slice(0, comma);
    const base64 = imageDataUrl.slice(comma + 1);
    if (!header.includes(";base64")) {
      throw new Error("Invalid image data URL (expected base64)");
    }
    const contentType = header.slice("data:".length).split(";")[0] || "image/png";
    return {
      contentType,
      bytes: Buffer.from(base64, "base64"),
    };
  }

  if (imageDataUrl.startsWith("http://") || imageDataUrl.startsWith("https://")) {
    const res = await fetch(imageDataUrl);
    if (!res.ok) {
      throw new Error(`Failed to download image (${res.status})`);
    }
    const contentType = res.headers.get("content-type")?.split(";")[0] || "image/png";
    const bytes = Buffer.from(await res.arrayBuffer());
    return { contentType, bytes };
  }

  throw new Error("Unsupported image format. Expected a data URL or https URL.");
}

type InitializeUploadResponse = {
  value?: {
    uploadUrl?: string;
    image?: string;
  };
};

/** Initialize + upload image; returns urn:li:image:… for Posts API content.media.id */
export async function uploadLinkedInImage(options: {
  accessToken: string;
  ownerUrn: string;
  imageDataUrl: string;
}): Promise<string> {
  const { accessToken, ownerUrn, imageDataUrl } = options;
  const { bytes } = await loadImageBytes(imageDataUrl);

  const registerRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: linkedInApiHeaders(accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: ownerUrn,
      },
    }),
  });

  const registerText = await registerRes.text();
  if (!registerRes.ok) {
    throw new Error(`LinkedIn image register failed (${registerRes.status}): ${registerText}`);
  }

  let registerJson: InitializeUploadResponse;
  try {
    registerJson = JSON.parse(registerText) as InitializeUploadResponse;
  } catch {
    throw new Error(`LinkedIn image register returned non-JSON: ${registerText.slice(0, 200)}`);
  }

  const imageUrn = registerJson.value?.image;
  const uploadUrl = registerJson.value?.uploadUrl;

  if (!imageUrn || !uploadUrl) {
    throw new Error("LinkedIn image register did not return uploadUrl/image");
  }

  // Pre-signed upload URL — do not send Authorization (LinkedIn rejects it).
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`LinkedIn image upload failed (${uploadRes.status}): ${err || uploadRes.statusText}`);
  }

  return imageUrn;
}

/**
 * Escape reserved characters in Posts API commentary.
 * @see https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 */
export function escapeLinkedInCommentary(text: string): string {
  return text.replace(/([|{}@\[\]()<>*_~\\])/g, "\\$1");
}
