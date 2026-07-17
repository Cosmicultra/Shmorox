"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { normalizeCampaign } from "@/lib/campaigns/normalize";
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
  const res = await fetch(isNew ? "/api/campaigns" : `/api/campaigns/${campaign.id}`, {
    method: isNew ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
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

  reviewsRef.current = reviews;
  resultsRef.current = results;
  campaignsRef.current = campaigns;
  socialConnectionsRef.current = socialConnections;

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
          setCampaigns(
            loaded.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
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
      const campaign = campaignsRef.current.find((c) => c.id === id);
      if (!campaign) continue;

      const isNew = newCampaignIdsRef.current.has(id);
      if (isNew) newCampaignIdsRef.current.delete(id);

      persistCampaign(campaign, isNew).catch((err) => {
        console.error("Campaign save failed:", err);
      });
    }
  }, [campaigns, campaignsLoaded], PERSIST_DEBOUNCE_MS);

  useDebouncedEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(socialConnectionsRef.current));
  }, [socialConnections, storageReady], PERSIST_DEBOUNCE_MS);

  const queueCampaignSave = useCallback((id: string) => {
    pendingSaveIdsRef.current.add(id);
  }, []);

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
    setResults((prev) => ({ ...prev, [submissionId]: result }));
  }, []);

  const getReview = useCallback((id: string) => reviews.find((r) => r.id === id), [reviews]);
  const getResult = useCallback((id: string) => results[id], [results]);

  const addCampaign = useCallback(
    (campaign: CampaignRun) => {
      newCampaignIdsRef.current.add(campaign.id);
      queueCampaignSave(campaign.id);
      setCampaigns((prev) => [campaign, ...prev]);
    },
    [queueCampaignSave]
  );

  const updateCampaign = useCallback(
    (id: string, patch: Partial<CampaignRun>) => {
      queueCampaignSave(id);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [queueCampaignSave]
  );

  const deleteCampaign = useCallback(async (id: string) => {
    let linkedReviewId: string | undefined;

    setCampaigns((prev) => {
      linkedReviewId = prev.find((c) => c.id === id)?.legalReviewId;
      return prev.filter((c) => c.id !== id);
    });

    pendingSaveIdsRef.current.delete(id);
    newCampaignIdsRef.current.delete(id);

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
        const res = await fetch(`/api/campaigns/${id}`);
        if (!res.ok) return;

        const { campaign } = await res.json();
        if (!campaign) return;

        setCampaigns((prev) => {
          const normalized = normalizeCampaign(campaign);
          const exists = prev.some((c) => c.id === id);
          if (!exists) return [normalized, ...prev];
          return prev.map((c) => (c.id === id ? { ...c, ...normalized } : c));
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
