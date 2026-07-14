"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  Send,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Card, Badge, RiskBadge, PipelineTimeline, InlineNotice } from "@/components/ui";
import { AdCardThumbnail } from "@/components/AdPreviewModal";
import { CreativeDirectorDashboard } from "@/components/CreativeDirectorDashboard";
import { ExpandableContent, StaggerChildren, StaggerItem, motion } from "@/components/motion";
import { isPipelineActive } from "@/lib/pipeline-state";
import {
  isPipelineLockedInSession,
  lockPipelineInSession,
  unlockPipelineInSession,
} from "@/lib/pipeline-lock";
import { PostTextPreview } from "@/components/PostTextPreview";
import { formatPostTextForApi } from "@/lib/ad/caption-generator";
import { getFullPostForPlatform } from "@/lib/post-package";
import { SOCIAL_PLATFORMS, type SocialPlatform, type Finding, type GeneratedAd, type CampaignRun } from "@/lib/types";
import {
  getPillarTitle,
  ADVISORPILOT_DEMO_URL,
  ADVISORPILOT_STANDARD_DISCLAIMER,
} from "@/lib/knowledge/constants";

const AdPreviewModal = dynamic(
  () => import("@/components/AdPreviewModal").then((mod) => ({ default: mod.AdPreviewModal })),
  { ssr: false }
);

const PIPELINE_RENDER_PHASES = ["generating", "legal_review", "fixing", "packaging", "approved"] as const;
const QR_AD_PHASES = ["packaging", "approved", "ready_to_post", "posted"] as const;

const PHASES = [
  { id: "generating", label: "Generate Ads" },
  { id: "legal_review", label: "Legal Review" },
  { id: "fixing", label: "Auto-Fix" },
  { id: "approved", label: "Approved" },
  { id: "packaging", label: "Package" },
  { id: "ready_to_post", label: "Ready to Post" },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const {
    getCampaign,
    updateCampaign,
    addReview,
    setResult,
    updateReview,
    getResult,
    campaignsLoaded,
  } = useApp();
  const campaign = getCampaign(id);
  const [progress, setProgress] = useState("");
  const [posting, setPosting] = useState<SocialPlatform | null>(null);
  const [expandedFix, setExpandedFix] = useState<number | null>(null);
  const [previewAd, setPreviewAd] = useState<GeneratedAd | null>(null);
  const [renderingAds, setRenderingAds] = useState(false);
  const imagesRegenerating = useRef(false);
  const pipelineInitiated = useRef(false);

  useEffect(() => {
    if (campaign?.progressMessage) setProgress(campaign.progressMessage);
  }, [campaign?.progressMessage]);

  useEffect(() => {
    if (!campaignsLoaded) return;
    if (!campaign) {
      const t = setTimeout(() => router.push("/"), 500);
      return () => clearTimeout(t);
    }
  }, [campaign, campaignsLoaded, router]);

  useEffect(() => {
    if (!campaign) return;

    let cancelled = false;

    const pipelineCallbacks = {
      onProgress: (message: string, phase: CampaignRun["phase"]) => {
        updateCampaign(campaign.id, { phase, progressMessage: message });
        if (!cancelled) setProgress(message);
      },
      onCampaignUpdate: (patch: Partial<CampaignRun>) => {
        updateCampaign(campaign.id, patch);
      },
      addReview,
      setResult,
      updateReview,
      getResult,
    };

    const resumablePhases = ["generating", "legal_review", "fixing", "packaging", "approved"] as const;
    const hasCreativeCheckpoint =
      campaign.creativePipelineStep &&
      campaign.creativePipelineStep !== "pending";
    const shouldResume =
      campaign.status === "running" &&
      resumablePhases.includes(campaign.phase as (typeof resumablePhases)[number]) &&
      (campaign.phase !== "generating" ||
        (campaign.ads?.length ?? 0) > 0 ||
        Boolean(hasCreativeCheckpoint));

    void import("@/lib/pipeline").then(({ runCampaignPipeline, resumeCampaignPipeline }) => {
      if (cancelled) return;

      const startFresh =
        campaign.status === "running" &&
        campaign.phase === "generating" &&
        (campaign.ads?.length ?? 0) === 0 &&
        (!hasCreativeCheckpoint || campaign.creativePipelineStep === "pending");

      if (startFresh) {
        if (
          isPipelineActive(campaign.id) ||
          pipelineInitiated.current ||
          isPipelineLockedInSession(campaign.id)
        ) {
          return;
        }
        pipelineInitiated.current = true;
        lockPipelineInSession(campaign.id);
        runCampaignPipeline(
          campaign.id,
          {
            contentPillarId: campaign.contentPillar,
            platforms: campaign.platforms,
            generateConceptImages: campaign.generateConceptImages,
          },
          pipelineCallbacks
        );
        return;
      }

      if (shouldResume) {
        if (
          isPipelineActive(campaign.id) ||
          pipelineInitiated.current ||
          isPipelineLockedInSession(campaign.id)
        ) {
          return;
        }
        pipelineInitiated.current = true;
        lockPipelineInSession(campaign.id);
        resumeCampaignPipeline(campaign, pipelineCallbacks);
      }
    });

    return () => {
      cancelled = true;
      if (campaign.status !== "running") {
        unlockPipelineInSession(campaign.id);
      }
    };
  }, [campaign, addReview, setResult, updateReview, updateCampaign, getResult]);

  // Restore cached PNGs first; only render ads that were never packaged (new pipeline ads).
  useEffect(() => {
    if (!campaign || imagesRegenerating.current) return;
    if (campaign.ads.length === 0) return;
    if (campaign.ads.every((ad) => ad.imageDataUrl)) return;
    if (isPipelineActive(campaign.id)) return;
    if (
      campaign.status === "running" &&
      PIPELINE_RENDER_PHASES.includes(campaign.phase as (typeof PIPELINE_RENDER_PHASES)[number])
    ) {
      return;
    }

    imagesRegenerating.current = true;
    setRenderingAds(true);
    const includeQR =
      Boolean(campaign.qrUrl) &&
      QR_AD_PHASES.includes(campaign.phase as (typeof QR_AD_PHASES)[number]);
    const qrUrl = campaign.qrUrl || ADVISORPILOT_DEMO_URL;

    void (async () => {
      const { hydrateCampaignAdImages } = await import("@/lib/ad/ad-image-cache");
      const { renderAllAds } = await import("@/lib/ad/image-renderer");

      let ads = await hydrateCampaignAdImages(campaign.id, campaign.ads);
      if (ads.some((ad) => !ad.imageDataUrl)) {
        ads = await renderAllAds(ads, includeQR, qrUrl, { campaignId: campaign.id });
      }
      updateCampaign(campaign.id, { ads });
    })().finally(() => {
      imagesRegenerating.current = false;
      setRenderingAds(false);
    });
  }, [campaign, updateCampaign]);

  if (!campaign) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const isRunning = ["generating", "legal_review", "fixing", "packaging"].includes(campaign.phase);
  const isReady = campaign.phase === "ready_to_post";
  const isFailed = campaign.phase === "failed";
  const legalResult = campaign.legalReviewId ? getResult(campaign.legalReviewId) : undefined;
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === campaign.phase);
  const fixHistory = campaign.fixHistory ?? [];

  const handlePost = async (platform: SocialPlatform) => {
    setPosting(platform);
    const ad = campaign.ads.find((a) => a.platform === platform);
    const text = formatPostTextForApi(getFullPostForPlatform(campaign, platform), platform);

    const { postToPlatform } = await import("@/lib/social/client");
    const result = await postToPlatform({
      platform,
      text,
      imageDataUrl: ad?.imageDataUrl,
      hashtags: campaign.hashtagsByPlatform?.[platform] ?? campaign.hashtags,
    });

    updateCampaign(campaign.id, {
      postResults: {
        ...campaign.postResults,
        [platform]: { success: result.success, message: result.message },
      },
      ...(result.success ? { postedAt: new Date().toISOString(), phase: "posted", status: "posted" } : {}),
    });
    setPosting(null);
  };

  const handleExport = (platform: SocialPlatform) => {
    const ad = campaign.ads.find((a) => a.platform === platform);
    if (!ad?.imageDataUrl) return;

    const link = document.createElement("a");
    link.href = ad.imageDataUrl;
    link.download = `advisorpilot-${campaign.contentPillar}-${platform}.png`;
    link.click();

    const text = getFullPostForPlatform(campaign, platform);
    const blob = new Blob([text], { type: "text/plain" });
    const textLink = document.createElement("a");
    textLink.href = URL.createObjectURL(blob);
    textLink.download = `advisorpilot-${campaign.contentPillar}-${platform}-caption.txt`;
    textLink.click();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/"
          className="mb-4 flex items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Command Center
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {getPillarTitle(campaign.contentPillar)}
            </h1>
            <p className="mt-1 font-mono text-sm text-secondary">
              AdvisorPilot™ · {campaign.platforms.length} platform
              {campaign.platforms.length === 1 ? "" : "s"} ·{" "}
              {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="blue">{campaign.phase.replace(/_/g, " ")}</Badge>
        </div>
      </div>

      <Card className={isRunning ? "ring-2 ring-accent/20" : ""}>
        <div className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-primary">Pipeline Progress</h2>
          <PipelineTimeline
            phases={PHASES}
            currentIndex={Math.max(0, currentPhaseIndex)}
            running={isRunning}
          />
          {isRunning && (
            <div className="mt-6 flex items-center gap-3 rounded-lg bg-accent/5 px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <p className="text-sm text-secondary">
                {progress || campaign.progressMessage || "Running pipeline…"}
              </p>
            </div>
          )}
        </div>
      </Card>

      <CreativeDirectorDashboard campaign={campaign} />

      {isFailed && (
        <Card className="border-danger/30 bg-danger/5 p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div>
              <p className="font-medium text-primary">Pipeline requires human review</p>
              <p className="mt-1 text-sm text-secondary">
                {campaign.progressMessage ?? "Legal review did not pass after maximum fix attempts."}
              </p>
              {legalResult && <div className="mt-2"><RiskBadge risk={legalResult.overallRisk} /></div>}
            </div>
          </div>
        </Card>
      )}

      {fixHistory.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Creative Fix History ({fixHistory.length})
          </h2>
          <div className="space-y-3">
            {fixHistory.map((fix, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  onClick={() => setExpandedFix(expandedFix === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-primary">Iteration {fix.iteration}</p>
                    <p className="text-sm text-secondary">
                      &ldquo;{fix.headlineBefore}&rdquo; → &ldquo;{fix.headlineAfter}&rdquo;
                    </p>
                  </div>
                  <motion.span animate={{ rotate: expandedFix === i ? 180 : 0 }}>
                    <ChevronDown className="h-5 w-5 text-secondary" />
                  </motion.span>
                </button>
                <ExpandableContent open={expandedFix === i}>
                  <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm">
                    <p className="text-primary">
                      <span className="font-medium">Subhead:</span> {fix.subheadBefore} → {fix.subheadAfter}
                    </p>
                    <p className="mt-2 font-mono text-xs text-secondary">
                      {fix.findings.length} finding{fix.findings.length === 1 ? "" : "s"} addressed
                    </p>
                  </div>
                </ExpandableContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {legalResult && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-primary">Legal Review</h2>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <RiskBadge risk={legalResult.overallRisk} />
              <p className="text-sm text-secondary">{legalResult.plainLanguageSummary}</p>
            </div>
            {legalResult.findings.length > 0 && campaign.phase !== "ready_to_post" && (
              <div className="mt-4 space-y-2">
                {legalResult.findings.slice(0, 3).map((f: Finding) => (
                  <p key={f.id} className="text-xs text-secondary">• {f.title}</p>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {campaign.ads.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary">Generated Ads ({campaign.ads.length})</h2>
            <p className="text-sm text-secondary">
              {renderingAds ? "Rendering previews…" : "Click any ad to preview"}
            </p>
          </div>
          <StaggerChildren className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaign.ads.map((ad) => (
              <StaggerItem key={ad.id}>
                <AdCardThumbnail
                  ad={ad}
                  onClick={() => ad.imageDataUrl && setPreviewAd(ad)}
                />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>
      )}

      {previewAd && (
        <AdPreviewModal
          ad={previewAd}
          ads={campaign.ads.filter((a) => a.imageDataUrl)}
          onClose={() => setPreviewAd(null)}
          onNavigate={setPreviewAd}
        />
      )}

      {isReady && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-primary">Post Package</h2>
          <StaggerChildren className="space-y-4">
            {campaign.platforms.map((platform) => {
              const platformLabel =
                SOCIAL_PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
              const postText = getFullPostForPlatform(campaign, platform);
              const hashtags = campaign.hashtagsByPlatform?.[platform] ?? [];
              const postResult = campaign.postResults?.[platform];

              return (
                <StaggerItem key={platform}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-primary">{platformLabel}</h3>
                      {postResult && (
                        <Badge variant={postResult.success ? "clear" : "danger"}>
                          {postResult.success ? "Posted" : "Failed"}
                        </Badge>
                      )}
                    </div>
                    <PostTextPreview text={postText} />
                    <p className="mt-2 font-mono text-xs text-secondary">
                      Hashtags: {hashtags.join(" ")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="gold" onClick={() => handlePost(platform)} disabled={posting !== null}>
                        {posting === platform ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Approve & Post
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleExport(platform)}>
                        <Download className="h-4 w-4" />
                        Export Package
                      </Button>
                    </div>
                    {postResult && (
                      <p className="mt-2 text-xs text-secondary">{postResult.message}</p>
                    )}
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        </section>
      )}

      {campaign.qrUrl && isReady && (
        <Card className="p-5">
          <p className="text-sm font-medium text-primary">Demo QR Link</p>
          <p className="mt-1 text-sm text-accent">{campaign.qrUrl}</p>
          <p className="mt-2 text-xs text-secondary">
            QR codes on ad cards link to the AdvisorPilot™ demo with UTM tracking.
          </p>
        </Card>
      )}

      <InlineNotice>{ADVISORPILOT_STANDARD_DISCLAIMER}</InlineNotice>
    </div>
  );
}
