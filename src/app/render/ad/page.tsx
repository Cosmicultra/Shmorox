"use client";

import { useEffect, useMemo, useState } from "react";
import { AdCardTemplate } from "@/components/AdCardTemplate";
import { enrichGeneratedAd } from "@/lib/ad/ad-creative-content";
import { generateQRDataUrl } from "@/lib/ad/qr-compositor";
import { LAYOUT } from "@/lib/ad/ad-design-system";
import { buildDemoUrl } from "@/lib/knowledge/advisorpilot";
import type { GeneratedAd } from "@/lib/types";

interface RenderAdPageProps {
  searchParams: Promise<{ ad?: string; qrUrl?: string; includeQR?: string }>;
}

export default function RenderAdPage({ searchParams }: RenderAdPageProps) {
  const [params, setParams] = useState<{ ad?: string; qrUrl?: string; includeQR?: string }>({});
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    searchParams.then(setParams);
  }, [searchParams]);

  const ad = useMemo((): GeneratedAd | null => {
    if (!params.ad) return null;
    try {
      return enrichGeneratedAd(JSON.parse(decodeURIComponent(params.ad)) as GeneratedAd);
    } catch {
      return null;
    }
  }, [params.ad]);

  useEffect(() => {
    if (!ad) return;
    const includeQR = params.includeQR !== "false";
    if (!includeQR) {
      setReady(true);
      return;
    }

    const effectiveQrUrl = params.qrUrl || buildDemoUrl(ad.platform, undefined);
    generateQRDataUrl(effectiveQrUrl, LAYOUT.qrSize * 2).then((url) => {
      setQrDataUrl(url);
      setReady(true);
    });
  }, [ad, params.includeQR, params.qrUrl]);

  if (!ad) {
    return <div data-render-status="missing-ad">Missing ad payload</div>;
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
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
}
