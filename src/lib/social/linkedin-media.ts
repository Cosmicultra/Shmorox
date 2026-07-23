/**
 * Upload an image to LinkedIn Assets API for use in ugcPosts.
 * @see https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
 */

async function loadImageBytes(
  imageDataUrl: string
): Promise<{ bytes: Buffer; contentType: string }> {
  if (imageDataUrl.startsWith("data:")) {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid image data URL");
    }
    return {
      contentType: match[1] || "image/png",
      bytes: Buffer.from(match[2], "base64"),
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

type RegisterUploadResponse = {
  value?: {
    asset?: string;
    uploadMechanism?: {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: {
        uploadUrl?: string;
        headers?: Record<string, string>;
      };
    };
  };
};

/** Register + upload image; returns digitalmediaAsset URN for ugcPosts.media[].media */
export async function uploadLinkedInImage(options: {
  accessToken: string;
  ownerUrn: string;
  imageDataUrl: string;
}): Promise<string> {
  const { accessToken, ownerUrn, imageDataUrl } = options;
  const { bytes, contentType } = await loadImageBytes(imageDataUrl);

  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
        supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
      },
    }),
  });

  const registerText = await registerRes.text();
  if (!registerRes.ok) {
    throw new Error(`LinkedIn image register failed: ${registerText}`);
  }

  let registerJson: RegisterUploadResponse;
  try {
    registerJson = JSON.parse(registerText) as RegisterUploadResponse;
  } catch {
    throw new Error(`LinkedIn image register returned non-JSON: ${registerText.slice(0, 200)}`);
  }

  const assetUrn = registerJson.value?.asset;
  const uploadMeta =
    registerJson.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
  const uploadUrl = uploadMeta?.uploadUrl;

  if (!assetUrn || !uploadUrl) {
    throw new Error("LinkedIn image register did not return uploadUrl/asset");
  }

  const uploadHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": contentType,
    ...(uploadMeta?.headers ?? {}),
  };

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: new Uint8Array(bytes),
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`LinkedIn image upload failed: ${err || uploadRes.statusText}`);
  }

  return assetUrn;
}
