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
  Copy,
  RefreshCw,
  Check,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Card, Badge, RiskBadge, PipelineTimeline, InlineNotice } from "@/components/ui";
import { AdCardThumbnail } from "@/components/AdPreviewModal";
import { CreativeDirectorDashboard } from "@/components/CreativeDirectorDashboard";
import { ExpandableContent, StaggerChildren, StaggerItem, motion } from "@/components/motion";
import { isCampaignPipelineControllerActive } from "@/lib/campaign-pipeline-controller";
import { isPipelineActive } from "@/lib/pipeline-state";
import { PostTextPreview } from "@/components/PostTextPreview";
import { formatPostTextForApi } from "@/lib/ad/caption-generator";
import { adsNeedLayoutRerender } from "@/lib/ad/ad-card-layout-version";
import { shouldSkipAdCardRerender } from "@/lib/pipeline-resume";
import { getFullPostForPlatform } from "@/lib/post-package";
import { isPersonalBrandCampaign } from "@/lib/knowledge/personal-brand";
import { fetchPersonalBrandPost } from "@/lib/personal-brand/client";
import { SOCIAL_PLATFORMS, type SocialPlatform, type Finding, type GeneratedAd } from "@/lib/types";
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

const AD_PHASES = [
  { id: "generating", label: "Generate Ads" },
  { id: "legal_review", label: "Legal Review" },
  { id: "fixing", label: "Auto-Fix" },
  { id: "approved", label: "Approved" },
  { id: "packaging", label: "Package" },
  { id: "ready_to_post", label: "Ready to Post" },
];

const PERSONAL_BRAND_PHASES = [
  { id: "generating", label: "Write Post" },
  { id: "ready_to_post", label: "Ready to Post" },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const {
    getCampaign,
    updateCampaign,
    hydrateCampaign,
    getResult,
    campaignsLoaded,
    campaigns,
    getSaveError,
    retrySave,
  } = useApp();
  const campaign = getCampaign(id);
  const saveError = getSaveError(id);
  const [progress, setProgress] = useState("");
  const [posting, setPosting] = useState<SocialPlatform | null>(null);
  const [expandedFix, setExpandedFix] = useState<number | null>(null);
  const [previewAd, setPreviewAd] = useState<GeneratedAd | null>(null);
  const [renderingAds, setRenderingAds] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const imagesRegenerating = useRef(false);

  const isPersonalBrand = campaign
    ? isPersonalBrandCampaign(campaign.contentPillar, campaign.contentMode)
    : false;

  useEffect(() => {
    if (campaign?.progressMessage) setProgress(campaign.progressMessage);
  }, [campaign?.progressMessage]);

  useEffect(() => {
    if (!campaignsLoaded || !id) return;
    if (isCampaignPipelineControllerActive(id)) return;
    void hydrateCampaign(id);
  }, [campaignsLoaded, id, hydrateCampaign]);

  useEffect(() => {
    if (!campaignsLoaded) return;
    if (!campaign) {
      const t = setTimeout(() => router.push("/"), 500);
      return () => clearTimeout(t);
    }
  }, [campaign, campaignsLoaded, router]);

  useEffect(() => {
    if (!campaign || imagesRegenerating.current) return;
    if (isPersonalBrandCampaign(campaign.contentPillar, campaign.contentMode)) return;
    if (campaign.ads.length === 0) return;
    if (!adsNeedLayoutRerender(campaign.ads)) return;
    if (isPipelineActive(campaign.id) || isCampaignPipelineControllerActive(campaign.id)) return;
    if (
      campaign.status === "running" &&
      PIPELINE_RENDER_PHASES.includes(campaign.phase as (typeof PIPELINE_RENDER_PHASES)[number]) &&
      !shouldSkipAdCardRerender(campaign, getResult)
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
      if (adsNeedLayoutRerender(ads)) {
        ads = await renderAllAds(ads, includeQR, qrUrl, { campaignId: campaign.id });
      }
      updateCampaign(campaign.id, { ads });
    })().finally(() => {
      imagesRegenerating.current = false;
      setRenderingAds(false);
    });
  }, [campaign, getResult, updateCampaign]);

  if (!campaign) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const phases = isPersonalBrand ? PERSONAL_BRAND_PHASES : AD_PHASES;
  const isRunning = isPersonalBrand
    ? campaign.phase === "generating"
    : ["generating", "legal_review", "fixing", "packaging"].includes(campaign.phase);
  const isReady = campaign.phase === "ready_to_post";
  const isFailed = campaign.phase === "failed";
  const legalResult = campaign.legalReviewId ? getResult(campaign.legalReviewId) : undefined;
  const currentPhaseIndex =
    campaign.phase === "posted"
      ? phases.length - 1
      : Math.max(
          0,
          phases.findIndex((p) => p.id === campaign.phase)
        );
  const fixHistory = campaign.fixHistory ?? [];

  const handlePost = async (platform: SocialPlatform) => {
    setPosting(platform);
    const ad = campaign.ads.find((a) => a.platform === platform);
    const text = formatPostTextForApi(getFullPostForPlatform(campaign, platform), platform);
    const personalBrand = isPersonalBrandCampaign(
      campaign.contentPillar,
      campaign.contentMode
    );

    const { postToPlatform } = await import("@/lib/social/client");
    const result = await postToPlatform({
      platform,
      text,
      // Text-only LinkedIn for personal brand — omit image even if somehow present
      imageDataUrl: personalBrand ? undefined : ad?.imageDataUrl,
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
    const personalBrand = isPersonalBrandCampaign(
      campaign.contentPillar,
      campaign.contentMode
    );
    const ad = campaign.ads.find((a) => a.platform === platform);
    if (!personalBrand && ad?.imageDataUrl) {
      const link = document.createElement("a");
      link.href = ad.imageDataUrl;
      link.download = `advisorpilot-${campaign.contentPillar}-${platform}.png`;
      link.click();
    }

    const text = getFullPostForPlatform(campaign, platform);
    const blob = new Blob([text], { type: "text/plain" });
    const textLink = document.createElement("a");
    textLink.href = URL.createObjectURL(blob);
    textLink.download = personalBrand
      ? `personal-brand-linkedin-${campaign.id.slice(0, 8)}.txt`
      : `advisorpilot-${campaign.contentPillar}-${platform}-caption.txt`;
    textLink.click();
  };

  const handleCopy = async (platform: SocialPlatform) => {
    const text = getFullPostForPlatform(campaign, platform);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleRegenerate = async () => {
    if (!isPersonalBrand) return;
    setRegenerating(true);
    try {
      const recentCategories = campaigns
        .filter(
          (c) =>
            c.id !== campaign.id &&
            isPersonalBrandCampaign(c.contentPillar, c.contentMode) &&
            c.personalBrandCategory
        )
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
        .map((c) => c.personalBrandCategory!)
        .slice(0, 8);

      const avoidedTopics = campaigns
        .filter(
          (c) =>
            c.id !== campaign.id &&
            isPersonalBrandCampaign(c.contentPillar, c.contentMode) &&
            (c.personalBrandTopic || c.customRequest)
        )
        .map((c) => c.personalBrandTopic || c.customRequest || "")
        .filter(Boolean)
        .slice(0, 10);

      const result = await fetchPersonalBrandPost({
        topic: campaign.customRequest,
        storyAnswers: campaign.storyAnswers,
        recentCategories,
        avoidedTopics,
      });

      const hashtags = result.post.match(/#[\w]+/g) ?? [];
      updateCampaign(campaign.id, {
        captionsByPlatform: { linkedin: result.post },
        caption: result.post,
        hashtags,
        hashtagsByPlatform: { linkedin: hashtags },
        personalBrandCategory: result.category,
        personalBrandTopic: result.topic,
        phase: "ready_to_post",
        status: "approved",
        progressMessage: "Personal brand post ready to publish!",
        pipelineFallbackReason:
          result.source === "template"
            ? result.message ?? "Personal brand used template fallback."
            : undefined,
      });
    } catch (error) {
      updateCampaign(campaign.id, {
        progressMessage:
          error instanceof Error ? error.message : "Regeneration failed. Try again.",
      });
    } finally {
      setRegenerating(false);
    }
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
              {isPersonalBrand
                ? `Personal Brand · LinkedIn${
                    campaign.personalBrandCategory
                      ? ` · ${campaign.personalBrandCategory.replace(/-/g, " ")}`
                      : ""
                  }`
                : `AdvisorPilot™ · ${campaign.platforms.length} platform${
                    campaign.platforms.length === 1 ? "" : "s"
                  }`}{" "}
              · {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
            {isPersonalBrand && campaign.personalBrandTopic && (
              <p className="mt-1 text-sm text-secondary">Angle: {campaign.personalBrandTopic}</p>
            )}
          </div>
          <Badge variant="blue">{campaign.phase.replace(/_/g, " ")}</Badge>
        </div>
      </div>

      {saveError && (
        <Card className="border-danger/30 bg-danger/5 p-6">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-primary">Changes are not saved</p>
              <p className="mt-1 text-sm text-secondary">
                This campaign could not be written to your account, so anything generated since the
                last successful save will be lost if you reload.
              </p>
              <p className="mt-2 break-words font-mono text-xs text-secondary">{saveError}</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => retrySave(id)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry save
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className={isRunning ? "ring-2 ring-accent/20" : ""}>
        <div className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-primary">Pipeline Progress</h2>
          <PipelineTimeline
            phases={phases}
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

      {!isPersonalBrand && <CreativeDirectorDashboard campaign={campaign} />}

      {campaign.pipelineFallbackReason && (
        <Card className="border-caution/40 bg-caution/5 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-caution" />
            <div>
              <p className="font-medium text-primary">
                {isPersonalBrand
                  ? "AI generation skipped — template fallback"
                  : "Creative Director skipped — template fallback"}
              </p>
              <p className="mt-1 text-sm text-secondary">
                {isPersonalBrand
                  ? `A template post was used instead of a full AI draft. Reason: ${campaign.pipelineFallbackReason}`
                  : `The AI exploration step did not run, so there is no generation cost breakdown and ads were built instantly from pillar seed copy. Reason: ${campaign.pipelineFallbackReason}`}
              </p>
              {!isPersonalBrand && (
                <p className="mt-2 text-xs text-secondary">
                  Restore the full pipeline by fixing your OpenAI API key / billing quota, then start
                  a new campaign.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {isFailed && (
        <Card className="border-danger/30 bg-danger/5 p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div>
              <p className="font-medium text-primary">Pipeline requires human review</p>
              <p className="mt-1 text-sm text-secondary">
                {campaign.progressMessage ?? "Legal review did not pass after maximum fix attempts."}
              </p>
              {legalResult && (
                <div className="mt-2">
                  <RiskBadge risk={legalResult.overallRisk} />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {!isPersonalBrand && fixHistory.length > 0 && (
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
                      <span className="font-medium">Subhead:</span> {fix.subheadBefore} →{" "}
                      {fix.subheadAfter}
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

      {!isPersonalBrand && legalResult && (
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
                  <p key={f.id} className="text-xs text-secondary">
                    • {f.title}
                  </p>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {!isPersonalBrand && campaign.ads.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary">
              Generated Ads ({campaign.ads.length})
            </h2>
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
          <h2 className="mb-4 text-xl font-semibold text-primary">
            {isPersonalBrand ? "LinkedIn Post" : "Post Package"}
          </h2>
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
                    {!isPersonalBrand && hashtags.length > 0 && (
                      <p className="mt-2 font-mono text-xs text-secondary">
                        Hashtags: {hashtags.join(" ")}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handlePost(platform)}
                        disabled={posting !== null || regenerating}
                      >
                        {posting === platform ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Approve & Post
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(platform)}
                        disabled={regenerating}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy Post"}
                      </Button>
                      {isPersonalBrand && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleRegenerate()}
                          disabled={regenerating || posting !== null}
                        >
                          {regenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Regenerate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleExport(platform)}
                        disabled={regenerating}
                      >
                        <Download className="h-4 w-4" />
                        {isPersonalBrand ? "Export Text" : "Export Package"}
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

      {!isPersonalBrand && campaign.qrUrl && isReady && (
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
