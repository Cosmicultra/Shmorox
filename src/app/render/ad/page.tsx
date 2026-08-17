"use client";

import { useEffect, useMemo, useState } from "react";
import { AdCardTemplate } from "@/components/AdCardTemplate";
import { enrichGeneratedAd } from "@/lib/ad/ad-creative-content";
import { generateQRDataUrl } from "@/lib/ad/qr-compositor";
import { LAYOUT } from "@/lib/ad/ad-design-system";
import { buildDemoUrl } from "@/lib/knowledge/advisorpilot";
import type { GeneratedAd } from "@/lib/types";

interface RenderAdSearchParams {
  ad?: string;
  qrUrl?: string;
  includeQR?: string;
  payload?: string;
}

interface RenderAdPageProps {
  searchParams: Promise<RenderAdSearchParams>;
}

interface ResolvedPayload {
  ad: GeneratedAd;
  includeQR: boolean;
  qrUrl?: string;
}

export default function RenderAdPage({ searchParams }: RenderAdPageProps) {
  const [params, setParams] = useState<RenderAdSearchParams>({});
  const [fetchedPayload, setFetchedPayload] = useState<ResolvedPayload | null>(null);
  const [payloadFailed, setPayloadFailed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    searchParams.then(setParams);
  }, [searchParams]);

  useEffect(() => {
    if (!params.payload) return;

    let cancelled = false;
    fetch(`/api/render-ad?payload=${encodeURIComponent(params.payload)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Payload fetch failed (${response.status})`);
        return (await response.json()) as ResolvedPayload;
      })
      .then((payload) => {
        if (!cancelled) setFetchedPayload(payload);
      })
      .catch(() => {
        if (!cancelled) setPayloadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [params.payload]);

  const inlineAd = useMemo((): GeneratedAd | null => {
    if (!params.ad) return null;
    try {
      return JSON.parse(decodeURIComponent(params.ad)) as GeneratedAd;
    } catch {
      return null;
    }
  }, [params.ad]);

  const rawAd = fetchedPayload?.ad ?? inlineAd;
  const ad = useMemo(() => (rawAd ? enrichGeneratedAd(rawAd) : null), [rawAd]);

  const includeQR = fetchedPayload
    ? fetchedPayload.includeQR
    : params.includeQR !== "false";
  const requestedQrUrl = fetchedPayload?.qrUrl ?? params.qrUrl;

  useEffect(() => {
    if (!ad) return;
    if (!includeQR) {
      setReady(true);
      return;
    }

    const effectiveQrUrl = requestedQrUrl || buildDemoUrl(ad.platform, undefined);
    generateQRDataUrl(effectiveQrUrl, LAYOUT.qrSize * 2).then((url) => {
      setQrDataUrl(url);
      setReady(true);
    });
  }, [ad, includeQR, requestedQrUrl]);

  if (!ad) {
    const waitingOnPayload = Boolean(params.payload) && !payloadFailed;
    return (
      <div data-render-status={waitingOnPayload ? "loading" : "missing-ad"}>
        {waitingOnPayload ? "Loading ad payload" : "Missing ad payload"}
      </div>
    );
  }

  return (
    <div data-render-status={ready ? "ready" : "loading"} data-ad-id={ad.id}>
      <AdCardTemplate
        headline={ad.headline}
        subhead={ad.subhead}
        cta={ad.cta}
        disclaimer={ad.disclaimer}
        aspectRatio={ad.aspectRatio}
        contentPillarId={ad.contentPillarId}
        layoutVariant={ad.layoutVariant}
        layoutStyle={ad.layoutStyle}
        templateId={ad.templateId}
        platform={ad.platform}
        canvasStyle={ad.canvasStyle}
        panelImageUrl={ad.panelImageUrl}
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
}
