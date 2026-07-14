"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, Loader2 } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { PresenceModal } from "@/components/motion";
import type { GeneratedAd } from "@/lib/types";
import { SOCIAL_PLATFORMS } from "@/lib/types";

interface AdPreviewModalProps {
  ad: GeneratedAd | null;
  ads: GeneratedAd[];
  onClose: () => void;
  onNavigate: (ad: GeneratedAd) => void;
}

export function AdPreviewModal({ ad, ads, onClose, onNavigate }: AdPreviewModalProps) {
  const currentIndex = ad ? ads.findIndex((a) => a.id === ad.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < ads.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(ads[currentIndex - 1]);
  }, [hasPrev, ads, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(ads[currentIndex + 1]);
  }, [hasNext, ads, currentIndex, onNavigate]);

  useEffect(() => {
    if (!ad) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [ad, onClose, goPrev, goNext]);

  const platformLabel =
    ad ? SOCIAL_PLATFORMS.find((p) => p.id === ad.platform)?.label ?? ad.platform : "";

  const handleDownload = () => {
    if (!ad?.imageDataUrl) return;
    const link = document.createElement("a");
    link.href = ad.imageDataUrl;
    link.download = `advisorpilot-${ad.platform}-${ad.aspectRatio.replace(":", "x")}.png`;
    link.click();
  };

  const isPortrait = ad?.aspectRatio === "9:16";
  // Maximize ad area — keep chrome minimal so copy stays readable at scale.
  const previewMaxHeight = "calc(94vh - 4.25rem)";
  const previewWidth = isPortrait
    ? `min(calc(${previewMaxHeight} * 9 / 16), 96vw)`
    : `min(${previewMaxHeight}, 96vw, 1200px)`;
  const previewFrameStyle = isPortrait
    ? {
        aspectRatio: "9/16" as const,
        height: previewMaxHeight,
        width: previewWidth,
      }
    : {
        aspectRatio: "1/1" as const,
        width: previewWidth,
      };

  return (
    <PresenceModal
      open={!!ad && !!ad.imageDataUrl}
      onClose={onClose}
      overlayClassName="p-2 sm:p-3"
      className="w-auto max-w-[98vw]"
    >
      {ad?.imageDataUrl && (
        <Card elevated className="mx-auto flex w-fit max-w-full flex-col overflow-hidden">
          <div
            className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2 sm:px-4"
            style={{ width: previewWidth }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">{platformLabel}</Badge>
              <Badge variant="default">{ad.aspectRatio}</Badge>
              <span className="font-mono text-sm text-secondary">
                {currentIndex + 1} of {ads.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-secondary transition-colors hover:bg-muted hover:text-primary"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden bg-primary" style={previewFrameStyle}>
            {hasPrev && (
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/95 p-2 shadow-elevated transition-colors hover:bg-muted"
                aria-label="Previous ad"
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageDataUrl}
              alt={`${platformLabel} ${ad.aspectRatio} ad preview`}
              className="block h-full w-full object-contain"
            />

            {hasNext && (
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/95 p-2 shadow-elevated transition-colors hover:bg-muted"
                aria-label="Next ad"
              >
                <ChevronRight className="h-6 w-6 text-primary" />
              </button>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2 sm:px-4" style={{ width: previewWidth }}>
            <p className="font-medium text-primary">{ad.headline}</p>
            <p className="mt-0.5 text-sm text-secondary">{ad.subhead}</p>
            <p className="mt-1 font-mono text-xs text-secondary/70">
              {ad.width}×{ad.height}px · Esc · ← →
            </p>
          </div>
        </Card>
      )}
    </PresenceModal>
  );
}

export function AdCardThumbnail({
  ad,
  onClick,
}: {
  ad: GeneratedAd;
  onClick: () => void;
}) {
  const platformLabel =
    SOCIAL_PLATFORMS.find((p) => p.id === ad.platform)?.label ?? ad.platform;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all duration-normal hover:-translate-y-1 hover:shadow-glow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative overflow-hidden">
        {ad.imageDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageDataUrl}
              alt={`${platformLabel} ${ad.aspectRatio} ad`}
              className="w-full object-cover transition-transform duration-normal group-hover:scale-[1.03]"
              style={{
                aspectRatio: ad.aspectRatio === "9:16" ? "9/16" : "1/1",
                maxHeight: 400,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-primary/0 transition-colors duration-normal group-hover:bg-primary/40">
              <span className="flex items-center gap-2 rounded-full bg-surface/95 px-4 py-2 text-sm font-medium text-primary opacity-0 shadow-elevated transition-opacity duration-normal group-hover:opacity-100">
                <ZoomIn className="h-4 w-4" />
                View larger
              </span>
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center bg-primary text-inverse"
            style={{ aspectRatio: ad.aspectRatio === "9:16" ? "9/16" : "1/1" }}
          >
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="blue">{platformLabel}</Badge>
          <Badge variant="default">{ad.aspectRatio}</Badge>
        </div>
        <p className="mt-2 text-sm font-medium text-primary">{ad.headline}</p>
        <p className="mt-1 text-xs text-secondary">{ad.subhead}</p>
      </div>
    </div>
  );
}
