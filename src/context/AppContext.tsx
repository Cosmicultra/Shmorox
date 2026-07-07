"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ReviewResult, ReviewSubmission } from "@/lib/types";

const STORAGE_KEY = "shmorox-reviews";

interface AppState {
  reviews: ReviewSubmission[];
  results: Record<string, ReviewResult>;
  addReview: (review: ReviewSubmission) => void;
  updateReview: (id: string, patch: Partial<ReviewSubmission>) => void;
  setResult: (submissionId: string, result: ReviewResult) => void;
  getReview: (id: string) => ReviewSubmission | undefined;
  getResult: (id: string) => ReviewResult | undefined;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ReviewSubmission[]>([]);
  const [results, setResults] = useState<Record<string, ReviewResult>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setReviews(parsed.reviews ?? []);
        setResults(parsed.results ?? {});
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reviews, results }));
  }, [reviews, results, hydrated]);

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

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mckinsey-mist">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-mckinsey-navy border-t-transparent" />
          <p className="text-sm text-mckinsey-slate">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{ reviews, results, addReview, updateReview, setResult, getReview, getResult }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
