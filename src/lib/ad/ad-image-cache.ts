import type { GeneratedAd } from "@/lib/types";
import { AD_CARD_LAYOUT_VERSION } from "./ad-card-layout-version";
import { ASSET_PACK_VERSION } from "./asset-pack";

const DB_NAME = "shmorox-ad-images";
const DB_VERSION = 2;
const STORE = "renders";

export interface CachedAdRender {
  imageDataUrl: string;
  layoutVersion: number;
  contentHash?: string;
  assetPackVersion?: number;
}

export interface CacheLookupOptions {
  contentHash?: string;
  layoutVersion?: number;
  assetPackVersion?: number;
}

function legacyCacheKey(campaignId: string, adId: string): string {
  return `${campaignId}:${adId}`;
}

function v2CacheKey(
  campaignId: string,
  adId: string,
  contentHash: string,
  layoutVersion: number,
  assetPackVersion: number
): string {
  return `${campaignId}:${adId}:${contentHash}:${layoutVersion}:${assetPackVersion}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open ad image cache"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export async function getCachedAdImage(
  campaignId: string,
  adId: string,
  options?: CacheLookupOptions
): Promise<CachedAdRender | null> {
  try {
    const db = await openDb();
    const keys: string[] = [];

    if (options?.contentHash) {
      keys.push(
        v2CacheKey(
          campaignId,
          adId,
          options.contentHash,
          options.layoutVersion ?? AD_CARD_LAYOUT_VERSION,
          options.assetPackVersion ?? ASSET_PACK_VERSION
        )
      );
    }
    keys.push(legacyCacheKey(campaignId, adId));

    for (const key of keys) {
      const hit = await new Promise<CachedAdRender | null>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () =>
          resolve((request.result as CachedAdRender | undefined) ?? null);
        tx.oncomplete = () => undefined;
      });
      if (hit) {
        db.close();
        return hit;
      }
    }

    db.close();
    return null;
  } catch {
    return null;
  }
}

export async function setCachedAdImage(
  campaignId: string,
  adId: string,
  imageDataUrl: string,
  layoutVersion: number,
  options?: { contentHash?: string; assetPackVersion?: number }
): Promise<void> {
  try {
    const db = await openDb();
    const record: CachedAdRender = {
      imageDataUrl,
      layoutVersion,
      contentHash: options?.contentHash,
      assetPackVersion: options?.assetPackVersion ?? ASSET_PACK_VERSION,
    };

    const key =
      options?.contentHash != null
        ? v2CacheKey(
            campaignId,
            adId,
            options.contentHash,
            layoutVersion,
            record.assetPackVersion!
          )
        : legacyCacheKey(campaignId, adId);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const request = store.put(record, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      tx.oncomplete = () => db.close();
    });
  } catch {
    // Cache is best-effort — rendering still works in memory.
  }
}

export async function invalidateCachedAdImage(campaignId: string, adId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        const key = String(cursor.key);
        if (key.startsWith(`${campaignId}:${adId}`)) {
          cursor.delete();
        }
        cursor.continue();
      };
      tx.oncomplete = () => db.close();
    });
  } catch {
    /* ignore */
  }
}

/** Restore in-memory previews from IndexedDB without re-rendering. */
export async function hydrateCampaignAdImages(
  campaignId: string,
  ads: GeneratedAd[]
): Promise<GeneratedAd[]> {
  const hydrated = await Promise.all(
    ads.map(async (ad) => {
      if (ad.imageDataUrl) return ad;

      const cached = await getCachedAdImage(campaignId, ad.id, {
        contentHash: ad.contentHash,
        layoutVersion: AD_CARD_LAYOUT_VERSION,
        assetPackVersion: ASSET_PACK_VERSION,
      });
      if (!cached) return ad;

      return {
        ...ad,
        imageDataUrl: cached.imageDataUrl,
        renderedLayoutVersion: cached.layoutVersion,
      };
    })
  );

  return hydrated;
}
