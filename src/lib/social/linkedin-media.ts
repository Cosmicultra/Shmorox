/**
 * Upload an image via LinkedIn Images API for use with /rest/posts.
 * @see https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
 */

/**
 * LinkedIn sunsets each monthly version roughly a year after release, so any pinned
 * value eventually starts returning 426 NONEXISTENT_VERSION. Set LINKEDIN_API_VERSION
 * to pin explicitly; otherwise a rejected version is renegotiated at runtime.
 * @see https://learn.microsoft.com/en-us/linkedin/marketing/versioning
 */
export const LINKEDIN_API_VERSION = "202607";

const VERSION_PATTERN = /^\d{6}(\.\d{2})?$/;

let negotiatedVersion: string | null = null;

function pinnedApiVersion(): string | null {
  const raw = process.env.LINKEDIN_API_VERSION?.trim();
  return raw && VERSION_PATTERN.test(raw) ? raw : null;
}

export function linkedInApiVersion(): string {
  return pinnedApiVersion() ?? negotiatedVersion ?? LINKEDIN_API_VERSION;
}

/** Months to fall back through, newest first. Skips the current month, which may not be published yet. */
function versionCandidates(exclude: string): string[] {
  const now = new Date();
  const candidates: string[] = [];
  for (let monthsBack = 1; monthsBack <= 11; monthsBack++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
    const version = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (version !== exclude) candidates.push(version);
  }
  return candidates;
}

function isSunsetVersionError(status: number, body: string): boolean {
  return status === 426 && body.includes("NONEXISTENT_VERSION");
}

export function linkedInApiHeaders(
  accessToken: string,
  version: string = linkedInApiVersion()
): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": version,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

export type LinkedInRestResult = {
  ok: boolean;
  status: number;
  headers: Headers;
  text: string;
  version: string;
};

/** Call a /rest/ endpoint, retrying with older API versions if the current one has been sunset. */
export async function linkedInRestFetch(
  label: string,
  url: string,
  options: { accessToken: string; method?: string; body?: unknown }
): Promise<LinkedInRestResult> {
  const { accessToken, method = "POST", body } = options;
  const startingVersion = linkedInApiVersion();

  // An explicit env pin is an operator decision, so don't silently substitute another version.
  const attempts = pinnedApiVersion()
    ? [startingVersion]
    : [startingVersion, ...versionCandidates(startingVersion)];

  let last: LinkedInRestResult | undefined;

  for (const version of attempts) {
    const res = await fetchWithRetry(label, url, {
      method,
      headers: linkedInApiHeaders(accessToken, version),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    last = { ok: res.ok, status: res.status, headers: res.headers, text, version };

    if (!isSunsetVersionError(res.status, text)) {
      if (version !== startingVersion && negotiatedVersion !== version) {
        negotiatedVersion = version;
        console.warn(
          `[linkedin] API version ${startingVersion} is sunset; using ${version}. ` +
            `Update LINKEDIN_API_VERSION in linkedin-media.ts or set the LINKEDIN_API_VERSION env var.`
        );
      }
      return last;
    }

    console.warn(`[linkedin/${label}] version ${version} rejected (426 NONEXISTENT_VERSION)`);
  }

  return last!;
}

/** Undici hides the real network error (ECONNRESET, ENOTFOUND, …) behind "fetch failed" in err.cause. */
export function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown error";
  const cause = err.cause;
  if (cause instanceof Error) {
    const code = (cause as NodeJS.ErrnoException).code;
    return code ? `${err.message} (${code}: ${cause.message})` : `${err.message} (${cause.message})`;
  }
  return err.message;
}

/** Retry transient network-level failures (undici "fetch failed"); HTTP error statuses are returned, not retried. */
async function fetchWithRetry(
  label: string,
  input: string,
  init: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        console.warn(
          `[linkedin/media] ${label} network error (attempt ${attempt}/${attempts}), retrying: ${describeFetchError(err)}`
        );
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw new Error(`${label} network error after ${attempts} attempts: ${describeFetchError(lastError)}`);
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
    const res = await fetchWithRetry("image download", imageDataUrl, {});
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

  const register = await linkedInRestFetch(
    "image register",
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      accessToken,
      method: "POST",
      body: {
        initializeUploadRequest: {
          owner: ownerUrn,
        },
      },
    }
  );

  if (!register.ok) {
    throw new Error(`LinkedIn image register failed (${register.status}): ${register.text}`);
  }

  let registerJson: InitializeUploadResponse;
  try {
    registerJson = JSON.parse(register.text) as InitializeUploadResponse;
  } catch {
    throw new Error(`LinkedIn image register returned non-JSON: ${register.text.slice(0, 200)}`);
  }

  const imageUrn = registerJson.value?.image;
  const uploadUrl = registerJson.value?.uploadUrl;

  if (!imageUrn || !uploadUrl) {
    throw new Error("LinkedIn image register did not return uploadUrl/image");
  }

  // Pre-signed upload URL — do not send Authorization (LinkedIn rejects it).
  const uploadRes = await fetchWithRetry("image bytes upload", uploadUrl, {
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
