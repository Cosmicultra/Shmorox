"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import {
  ensureCampaignPipeline,
  syncBackgroundPipelines,
  type PipelineControllerDeps,
} from "@/lib/campaign-pipeline-controller";
import { mergeRemoteCampaign } from "@/lib/campaigns/merge-remote";
import { normalizeCampaign } from "@/lib/campaigns/normalize";
import { stripCampaignImages } from "@/lib/campaigns/strip-images";
import { uploadCampaignImagesClient } from "@/lib/campaigns/upload-assets-client";
import { markCampaignForInitialPipelineRun } from "@/lib/pipeline-launch";
import type { CampaignRun, ReviewResult, ReviewSubmission, SocialPlatform } from "@/lib/types";

const REVIEWS_STORAGE_KEY = "shmorox-reviews";
const CAMPAIGNS_STORAGE_KEY = "shmorox-campaigns";
const SOCIAL_STORAGE_KEY = "shmorox-social-connections";
const CAMPAIGNS_MIGRATED_KEY = "shmorox-campaigns-migrated";
const PERSIST_DEBOUNCE_MS = 800;

export interface SocialConnection {
  platform: SocialPlatform;
  connected: boolean;
  accountName?: string;
  connectedAt?: string;
}

interface AppState {
  reviews: ReviewSubmission[];
  results: Record<string, ReviewResult>;
  campaigns: CampaignRun[];
  socialConnections: SocialConnection[];
  storageReady: boolean;
  campaignsLoaded: boolean;
  addReview: (review: ReviewSubmission) => void;
  updateReview: (id: string, patch: Partial<ReviewSubmission>) => void;
  deleteReview: (id: string) => void;
  setResult: (submissionId: string, result: ReviewResult) => void;
  getReview: (id: string) => ReviewSubmission | undefined;
  getResult: (id: string) => ReviewResult | undefined;
  addCampaign: (campaign: CampaignRun) => void;
  updateCampaign: (id: string, patch: Partial<CampaignRun>) => void;
  deleteCampaign: (id: string) => void;
  getCampaign: (id: string) => CampaignRun | undefined;
  hydrateCampaign: (id: string) => Promise<void>;
  /** Start campaign generation in the background — safe to navigate away. */
  launchCampaignPipeline: (campaignId: string) => void;
  setSocialConnection: (connection: SocialConnection) => void;
  getSocialConnection: (platform: SocialPlatform) => SocialConnection | undefined;
}

const AppContext = createContext<AppState | null>(null);

function useDebouncedEffect(effect: () => void, deps: unknown[], delayMs: number) {
  useEffect(() => {
    const timer = window.setTimeout(effect, delayMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

async function persistCampaign(campaign: CampaignRun, isNew: boolean) {
  await uploadCampaignImagesClient(campaign);

  const stripped = stripCampaignImages(campaign);
  const res = await fetch(isNew ? "/api/campaigns" : `/api/campaigns/${campaign.id}`, {
    method: isNew ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stripped),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to save campaign (${res.status})`);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ReviewSubmission[]>([]);
  const [results, setResults] = useState<Record<string, ReviewResult>>({});
  const [campaigns, setCampaigns] = useState<CampaignRun[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);

  const reviewsRef = useRef(reviews);
  const resultsRef = useRef(results);
  const campaignsRef = useRef(campaigns);
  const socialConnectionsRef = useRef(socialConnections);
  const pendingSaveIdsRef = useRef<Set<string>>(new Set());
  const newCampaignIdsRef = useRef<Set<string>>(new Set());
  const hydratingIdsRef = useRef<Set<string>>(new Set());
  /** Bumps on every local mutation — used to detect stale in-flight saves. */
  const campaignRevisionRef = useRef<Map<string, number>>(new Map());
  /** Per-campaign save chain so PATCHes never complete out of order. */
  const saveChainRef = useRef<Map<string, Promise<void>>>(new Map());
  const savingIdsRef = useRef<Set<string>>(new Set());

  reviewsRef.current = reviews;
  resultsRef.current = results;
  campaignsRef.current = campaigns;
  socialConnectionsRef.current = socialConnections;

  const pipelineDepsRef = useRef<PipelineControllerDeps>({
    getCampaign: (id) => campaignsRef.current.find((c) => c.id === id),
    updateCampaign: () => {},
    addReview: () => {},
    setResult: () => {},
    updateReview: () => {},
    getResult: (id) => resultsRef.current[id],
  });

  const bumpCampaignRevision = useCallback((id: string) => {
    const next = (campaignRevisionRef.current.get(id) ?? 0) + 1;
    campaignRevisionRef.current.set(id, next);
    return next;
  }, []);

  const flushCampaignSave = useCallback(async (id: string) => {
    // Keep writing until no newer local revision appeared mid-upload.
    for (;;) {
      const campaign = campaignsRef.current.find((c) => c.id === id);
      if (!campaign) return;

      const revision = campaignRevisionRef.current.get(id) ?? 0;
      const isNew = newCampaignIdsRef.current.has(id);

      savingIdsRef.current.add(id);
      try {
        await persistCampaign(campaign, isNew);
        if (isNew) newCampaignIdsRef.current.delete(id);
      } finally {
        savingIdsRef.current.delete(id);
      }

      if ((campaignRevisionRef.current.get(id) ?? 0) === revision) return;
    }
  }, []);

  const enqueueCampaignSave = useCallback(
    (id: string) => {
      const prev = saveChainRef.current.get(id) ?? Promise.resolve();
      const next = prev
        .catch(() => {
          /* prior failure must not break the chain */
        })
        .then(() => flushCampaignSave(id))
        .catch((err) => {
          console.error("Campaign save failed:", err);
        });
      saveChainRef.current.set(id, next);
    },
    [flushCampaignSave]
  );

  useEffect(() => {
    let cancelled = false;

    try {
      const reviewsRaw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (reviewsRaw) {
        const parsed = JSON.parse(reviewsRaw);
        setReviews(parsed.reviews ?? []);
        setResults(parsed.results ?? {});
      }
      const socialRaw = localStorage.getItem(SOCIAL_STORAGE_KEY);
      if (socialRaw) {
        setSocialConnections(JSON.parse(socialRaw));
      }
    } catch {
      /* ignore corrupt storage */
    }

    setStorageReady(true);

    const loadCampaigns = async () => {
      try {
        const res = await fetch("/api/campaigns");
        if (!res.ok) throw new Error("Failed to load campaigns");

        let loaded: CampaignRun[] = [];
        const payload = await res.json();
        loaded = (payload.campaigns ?? []).map((c: Partial<CampaignRun> & { id: string }) =>
          normalizeCampaign(c)
        );

        if (loaded.length === 0 && !localStorage.getItem(CAMPAIGNS_MIGRATED_KEY)) {
          const legacyRaw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
          if (legacyRaw) {
            const legacy = (JSON.parse(legacyRaw) as Partial<CampaignRun>[])
              .filter((c): c is Partial<CampaignRun> & { id: string } => typeof c?.id === "string")
              .map(normalizeCampaign);

            for (const campaign of legacy) {
              await persistCampaign(campaign, true);
            }

            loaded = legacy;
            localStorage.setItem(CAMPAIGNS_MIGRATED_KEY, "1");
            localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
          }
        }

        if (!cancelled) {
          setCampaigns((prev) => {
            const byId = new Map<string, CampaignRun>();
            for (const remote of loaded) byId.set(remote.id, remote);
            for (const local of prev) {
              const remote = byId.get(local.id);
              byId.set(local.id, remote ? mergeRemoteCampaign(local, remote) : local);
            }
            return Array.from(byId.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
      } catch {
        /* keep empty — user may be offline or migrations not run yet */
      }

      if (!cancelled) setCampaignsLoaded(true);
    };

    loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, []);

  useDebouncedEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify({ reviews: reviewsRef.current, results: resultsRef.current })
    );
  }, [reviews, results, storageReady], PERSIST_DEBOUNCE_MS);

  useDebouncedEffect(() => {
    if (!campaignsLoaded) return;

    const ids = Array.from(pendingSaveIdsRef.current);
    pendingSaveIdsRef.current.clear();

    for (const id of ids) {
      if (!campaignsRef.current.some((c) => c.id === id)) continue;
      enqueueCampaignSave(id);
    }
  }, [campaigns, campaignsLoaded, enqueueCampaignSave], PERSIST_DEBOUNCE_MS);

  useDebouncedEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(socialConnectionsRef.current));
  }, [socialConnections, storageReady], PERSIST_DEBOUNCE_MS);

  const queueCampaignSave = useCallback(
    (id: string) => {
      bumpCampaignRevision(id);
      pendingSaveIdsRef.current.add(id);
    },
    [bumpCampaignRevision]
  );

  const addReview = useCallback((review: ReviewSubmission) => {
    setReviews((prev) => [review, ...prev]);
  }, []);

  const updateReview = useCallback((id: string, patch: Partial<ReviewSubmission>) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const deleteReview = useCallback(
    (id: string) => {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setResults((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setCampaigns((prev) => {
        let changed = false;
        const next = prev.map((c) => {
          if (c.legalReviewId !== id) return c;
          changed = true;
          queueCampaignSave(c.id);
          return { ...c, legalReviewId: undefined };
        });
        return changed ? next : prev;
      });
    },
    [queueCampaignSave]
  );

  const setResult = useCallback((submissionId: string, result: ReviewResult) => {
    setResults((prev) => {
      const next = { ...prev, [submissionId]: result };
      resultsRef.current = next;
      return next;
    });
  }, []);

  const getReview = useCallback((id: string) => reviews.find((r) => r.id === id), [reviews]);
  const getResult = useCallback((id: string) => resultsRef.current[id], []);

  const addCampaign = useCallback(
    (campaign: CampaignRun) => {
      newCampaignIdsRef.current.add(campaign.id);
      queueCampaignSave(campaign.id);
      setCampaigns((prev) => {
        const next = [campaign, ...prev];
        campaignsRef.current = next;
        return next;
      });
    },
    [queueCampaignSave]
  );

  const updateCampaign = useCallback(
    (id: string, patch: Partial<CampaignRun>) => {
      queueCampaignSave(id);
      setCampaigns((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        campaignsRef.current = next;
        return next;
      });
    },
    [queueCampaignSave]
  );

  // Keep pipeline callbacks on refs so background runs always see latest state.
  pipelineDepsRef.current = {
    getCampaign: (id) => campaignsRef.current.find((c) => c.id === id),
    updateCampaign,
    addReview,
    setResult,
    updateReview,
    getResult: (id) => resultsRef.current[id],
  };

  const launchCampaignPipeline = useCallback((campaignId: string) => {
    markCampaignForInitialPipelineRun(campaignId);
    void ensureCampaignPipeline(campaignId, pipelineDepsRef.current);
  }, []);

  useEffect(() => {
    if (!campaignsLoaded) return;
    syncBackgroundPipelines(campaignsRef.current, pipelineDepsRef.current);
  }, [campaignsLoaded, campaigns]);

  const deleteCampaign = useCallback(async (id: string) => {
    let linkedReviewId: string | undefined;

    setCampaigns((prev) => {
      linkedReviewId = prev.find((c) => c.id === id)?.legalReviewId;
      return prev.filter((c) => c.id !== id);
    });

    pendingSaveIdsRef.current.delete(id);
    newCampaignIdsRef.current.delete(id);
    campaignRevisionRef.current.delete(id);
    savingIdsRef.current.delete(id);
    saveChainRef.current.delete(id);

    if (linkedReviewId) {
      setReviews((reviews) => reviews.filter((r) => r.id !== linkedReviewId));
      setResults((results) => {
        const next = { ...results };
        delete next[linkedReviewId!];
        return next;
      });
    }

    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Campaign delete failed:", err);
    }
  }, []);

  const getCampaign = useCallback((id: string) => campaigns.find((c) => c.id === id), [campaigns]);

  const hydrateCampaign = useCallback(
    async (id: string) => {
      if (hydratingIdsRef.current.has(id)) return;
      hydratingIdsRef.current.add(id);

      try {
        // Don't clobber an in-flight local pipeline write with a possibly stale GET.
        if (
          pendingSaveIdsRef.current.has(id) ||
          savingIdsRef.current.has(id) ||
          newCampaignIdsRef.current.has(id)
        ) {
          return;
        }

        const res = await fetch(`/api/campaigns/${id}`);
        if (!res.ok) return;

        const { campaign } = await res.json();
        if (!campaign) return;

        // Re-check after the network round-trip — a save may have started.
        if (pendingSaveIdsRef.current.has(id) || savingIdsRef.current.has(id)) {
          return;
        }

        setCampaigns((prev) => {
          const normalized = normalizeCampaign(campaign);
          const existing = prev.find((c) => c.id === id);
          if (!existing) return [normalized, ...prev];
          return prev.map((c) => (c.id === id ? mergeRemoteCampaign(c, normalized) : c));
        });
      } catch {
        /* ignore */
      } finally {
        hydratingIdsRef.current.delete(id);
      }
    },
    []
  );

  const setSocialConnection = useCallback((connection: SocialConnection) => {
    setSocialConnections((prev) => {
      const filtered = prev.filter((c) => c.platform !== connection.platform);
      return [...filtered, connection];
    });
  }, []);

  const getSocialConnection = useCallback(
    (platform: SocialPlatform) => socialConnections.find((c) => c.platform === platform),
    [socialConnections]
  );

  const value = useMemo<AppState>(
    () => ({
      reviews,
      results,
      campaigns,
      socialConnections,
      storageReady,
      campaignsLoaded,
      addReview,
      updateReview,
      deleteReview,
      setResult,
      getReview,
      getResult,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaign,
      hydrateCampaign,
      launchCampaignPipeline,
      setSocialConnection,
      getSocialConnection,
    }),
    [
      reviews,
      results,
      campaigns,
      socialConnections,
      storageReady,
      campaignsLoaded,
      addReview,
      updateReview,
      deleteReview,
      setResult,
      getReview,
      getResult,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaign,
      hydrateCampaign,
      launchCampaignPipeline,
      setSocialConnection,
      getSocialConnection,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
