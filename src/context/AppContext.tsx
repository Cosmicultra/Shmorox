"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { CampaignRun, ReviewResult, ReviewSubmission, SocialPlatform } from "@/lib/types";

const REVIEWS_STORAGE_KEY = "shmorox-reviews";
const CAMPAIGNS_STORAGE_KEY = "shmorox-campaigns";
const SOCIAL_STORAGE_KEY = "shmorox-social-connections";
const PERSIST_DEBOUNCE_MS = 400;

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
  setResult: (submissionId: string, result: ReviewResult) => void;
  getReview: (id: string) => ReviewSubmission | undefined;
  getResult: (id: string) => ReviewResult | undefined;
  addCampaign: (campaign: CampaignRun) => void;
  updateCampaign: (id: string, patch: Partial<CampaignRun>) => void;
  deleteCampaign: (id: string) => void;
  getCampaign: (id: string) => CampaignRun | undefined;
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

/** Base64 ad PNGs can be several MB each — never persist them in localStorage. */
function stripCampaignForStorage(campaign: CampaignRun): CampaignRun {
  return {
    ...campaign,
    ads: campaign.ads.map(({ imageDataUrl: _image, ...ad }) => ad),
  };
}

function serializeCampaigns(campaigns: CampaignRun[]): string {
  return JSON.stringify(campaigns.map(stripCampaignForStorage));
}

/** Backfill defaults for campaigns saved before schema changes. */
function normalizeCampaign(raw: Partial<CampaignRun> & { id: string }): CampaignRun {
  const phase = raw.phase ?? "generating";
  const defaultStatus =
    phase === "ready_to_post" || phase === "posted"
      ? "approved"
      : phase === "failed"
        ? "failed"
        : ["generating", "legal_review", "fixing", "packaging", "approved"].includes(phase)
          ? "running"
          : "draft";

  return {
    id: raw.id,
    brand: "AdvisorPilot",
    contentPillar: raw.contentPillar ?? "prospect-workflow",
    platforms: raw.platforms ?? [],
    phase,
    status: raw.status ?? defaultStatus,
    ads: Array.isArray(raw.ads) ? raw.ads : [],
    legalReviewId: raw.legalReviewId,
    iteration: raw.iteration ?? 0,
    fixHistory: Array.isArray(raw.fixHistory) ? raw.fixHistory : [],
    caption: raw.caption,
    captionsByPlatform: raw.captionsByPlatform,
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    hashtagsByPlatform: raw.hashtagsByPlatform,
    qrUrl: raw.qrUrl ?? "",
    progressMessage: raw.progressMessage,
    creativeBrief: raw.creativeBrief,
    originalBrief: raw.originalBrief,
    creativeReview: raw.creativeReview,
    strategyApproved: raw.strategyApproved,
    strategyReviewHistory: raw.strategyReviewHistory,
    finalStrategyRationale: raw.finalStrategyRationale,
    conceptVariations: raw.conceptVariations,
    visualDiversityReport: raw.visualDiversityReport,
    variationGateHistory: raw.variationGateHistory,
    selectedConcept: raw.selectedConcept,
    creativeJob: raw.creativeJob,
    masterImageUrl: raw.masterImageUrl,
    imagesBlocked: raw.imagesBlocked,
    creativePipelineStep: raw.creativePipelineStep,
    adaptedImages: raw.adaptedImages,
    selectionRationale: raw.selectionRationale,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    completedAt: raw.completedAt,
    postedAt: raw.postedAt,
    postResults: raw.postResults,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ReviewSubmission[]>([]);
  const [results, setResults] = useState<Record<string, ReviewResult>>({});
  const [campaigns, setCampaigns] = useState<CampaignRun[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [campaignsPersistReady, setCampaignsPersistReady] = useState(false);

  const reviewsRef = useRef(reviews);
  const resultsRef = useRef(results);
  const campaignsRef = useRef(campaigns);
  const socialConnectionsRef = useRef(socialConnections);

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

    const loadCampaigns = () => {
      if (cancelled) return;
      try {
        const campaignsRaw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
        if (campaignsRaw) {
          const parsed = (JSON.parse(campaignsRaw) as Partial<CampaignRun>[])
            .filter((c): c is Partial<CampaignRun> & { id: string } => typeof c?.id === "string")
            .map(normalizeCampaign);
          const hadImages = parsed.some((c) => c.ads.some((a) => a.imageDataUrl));
          const stripped = parsed.map(stripCampaignForStorage);
          setCampaigns((prev) => {
            const byId = new Map(stripped.map((campaign) => [campaign.id, campaign]));
            for (const campaign of prev) {
              byId.set(campaign.id, campaign);
            }
            return Array.from(byId.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
          if (hadImages) {
            localStorage.setItem(CAMPAIGNS_STORAGE_KEY, serializeCampaigns(stripped));
          }
        }
        if (!cancelled) setCampaignsPersistReady(true);
      } catch {
        /* corrupt campaign storage — do not overwrite saved data with an empty array */
      }
      if (!cancelled) setCampaignsLoaded(true);
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(loadCampaigns, { timeout: 500 });
    } else {
      setTimeout(loadCampaigns, 0);
    }

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
    if (!campaignsLoaded || !campaignsPersistReady) return;
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, serializeCampaigns(campaignsRef.current));
  }, [campaigns, campaignsLoaded, campaignsPersistReady], PERSIST_DEBOUNCE_MS);

  useDebouncedEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(socialConnectionsRef.current));
  }, [socialConnections, storageReady], PERSIST_DEBOUNCE_MS);

  const addReview = useCallback((review: ReviewSubmission) => {
    setReviews((prev) => [review, ...prev]);
  }, []);

  const updateReview = useCallback((id: string, patch: Partial<ReviewSubmission>) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const setResult = useCallback((submissionId: string, result: ReviewResult) => {
    setResults((prev) => ({ ...prev, [submissionId]: result }));
  }, []);

  const getReview = useCallback((id: string) => reviews.find((r) => r.id === id), [reviews]);
  const getResult = useCallback((id: string) => results[id], [results]);

  const addCampaign = useCallback((campaign: CampaignRun) => {
    setCampaignsPersistReady(true);
    setCampaigns((prev) => [campaign, ...prev]);
  }, []);

  const updateCampaign = useCallback((id: string, patch: Partial<CampaignRun>) => {
    setCampaignsPersistReady(true);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    let linkedReviewId: string | undefined;
    setCampaigns((prev) => {
      linkedReviewId = prev.find((c) => c.id === id)?.legalReviewId;
      return prev.filter((c) => c.id !== id);
    });
    if (linkedReviewId) {
      setReviews((reviews) => reviews.filter((r) => r.id !== linkedReviewId));
      setResults((results) => {
        const next = { ...results };
        delete next[linkedReviewId!];
        return next;
      });
    }
  }, []);

  const getCampaign = useCallback((id: string) => campaigns.find((c) => c.id === id), [campaigns]);

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
      setResult,
      getReview,
      getResult,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaign,
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
      setResult,
      getReview,
      getResult,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      getCampaign,
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
