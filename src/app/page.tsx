"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  FileSearch,
  Megaphone,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronDown,
  Share2,
  Video,
  Layout,
  Users,
  Mail,
  Package,
  FileText,
  Folder,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Button,
  Card,
  Badge,
  RiskBadge,
  KpiStat,
  EmptyState,
  InlineNotice,
} from "@/components/ui";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion";
import { ASSET_TYPES } from "@/lib/types";
import { getPillarTitle } from "@/lib/knowledge/constants";

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  layout: Layout,
  share: Share2,
  users: Users,
  mail: Mail,
  package: Package,
  file: FileText,
  folder: Folder,
};

export default function HomePage() {
  const { reviews, results, campaigns, socialConnections, deleteCampaign, deleteReview } = useApp();
  const [quickStartOpen, setQuickStartOpen] = useState(false);

  const { completed, inProgress, activeCampaigns, connectedPlatforms } = useMemo(() => {
    let completedCount = 0;
    let inProgressCount = 0;
    let activeCampaignCount = 0;

    for (const review of reviews) {
      if (review.status === "complete") completedCount += 1;
      else if (review.status === "analyzing") inProgressCount += 1;
    }

    for (const campaign of campaigns) {
      if (campaign.status === "running") activeCampaignCount += 1;
    }

    let connectedCount = 0;
    for (const connection of socialConnections) {
      if (connection.connected) connectedCount += 1;
    }

    return {
      completed: completedCount,
      inProgress: inProgressCount,
      activeCampaigns: activeCampaignCount,
      connectedPlatforms: connectedCount,
    };
  }, [reviews, campaigns, socialConnections]);

  return (
    <div className="space-y-8">
      {/* Hero strip */}
      <FadeIn>
        <Card elevated className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary via-primary to-accent/80 p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,169,110,0.15),transparent_50%)]" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Marketing Team
                </p>
                <h1 className="text-balance text-2xl font-bold leading-tight text-inverse sm:text-3xl">
                  Your AI marketing team — campaigns, content, compliance, and publishing in one workspace.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-inverse/70">
                  Launch campaigns, run legal reviews, and ship to social — all from one command center.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href="/campaign/new">
                  <Button variant="gold" size="lg">
                    New Campaign
                    <Megaphone className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/review/new">
                  <Button variant="inverse" size="lg">
                    New Review
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* KPI row */}
      <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <KpiStat label="Active Campaigns" value={activeCampaigns} icon={Megaphone} accent="gold" />
        </StaggerItem>
        <StaggerItem>
          <KpiStat label="Reviews In Progress" value={inProgress} icon={Zap} accent="blue" />
        </StaggerItem>
        <StaggerItem>
          <KpiStat label="Completed Reviews" value={completed} icon={TrendingUp} accent="success" />
        </StaggerItem>
        <StaggerItem>
          <KpiStat label="Platforms Connected" value={connectedPlatforms} icon={Share2} accent="warning" />
        </StaggerItem>
      </StaggerChildren>

      {/* Quick start accordion */}
      <FadeIn delay={0.1}>
        <Card className="overflow-hidden">
          <button
            onClick={() => setQuickStartOpen(!quickStartOpen)}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
          >
            <span className="font-semibold text-primary">Quick start guide</span>
            <ChevronDown
              className={`h-5 w-5 text-secondary transition-transform duration-normal ${quickStartOpen ? "rotate-180" : ""}`}
            />
          </button>
          {quickStartOpen && (
            <div className="border-t border-border px-4 pb-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { step: "1", title: "Launch a campaign", desc: "Generate ads, run legal review, package posts." },
                  { step: "2", title: "Submit for review", desc: "Upload materials and get plain-language compliance reports." },
                  { step: "3", title: "Approve & publish", desc: "Connect social accounts and ship approved content." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="rounded-lg bg-muted/50 p-4">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                      {step}
                    </span>
                    <p className="mt-2 font-medium text-primary">{title}</p>
                    <p className="mt-1 text-xs text-secondary">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* Asset type chips */}
      <FadeIn delay={0.15}>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">Supported assets</p>
          <div className="flex flex-wrap gap-2">
            {ASSET_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type.icon] ?? Folder;
              return (
                <span
                  key={type.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-primary"
                >
                  <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                  {type.label}
                </span>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Dual column lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaigns */}
        <FadeIn delay={0.2}>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Campaigns</h2>
              <Link href="/campaign/new">
                <Button variant="ghost" size="sm">
                  New
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No campaigns yet"
                description="Launch a 3-phase pipeline: generate social ads, run legal review, and prepare posts."
                action={
                  <Link href="/campaign/new">
                    <Button variant="gold">Launch Your First Campaign</Button>
                  </Link>
                }
              />
            ) : (
              <StaggerChildren className="space-y-2">
                {campaigns.map((campaign) => (
                  <StaggerItem key={campaign.id}>
                    <Card hover className="flex items-center gap-2 p-4">
                      <Link href={`/campaign/${campaign.id}`} prefetch={false} className="min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-medium text-primary">
                              {getPillarTitle(campaign.contentPillar)}
                            </h3>
                            <Badge variant="blue">{campaign.phase.replace(/_/g, " ")}</Badge>
                            {campaign.status === "running" && (
                              <Badge variant="caution">
                                <Clock className="mr-1 inline h-3 w-3" />
                                Running
                              </Badge>
                            )}
                            {campaign.status === "approved" && <Badge variant="clear">Ready</Badge>}
                            {campaign.status === "posted" && <Badge variant="clear">Posted</Badge>}
                          </div>
                          <p className="mt-1 font-mono text-xs text-secondary">
                            {campaign.status === "running" && campaign.progressMessage
                              ? campaign.progressMessage
                              : `${campaign.platforms.length} platform${campaign.platforms.length === 1 ? "" : "s"} · ${new Date(campaign.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const title = getPillarTitle(campaign.contentPillar);
                            if (window.confirm(`Delete campaign "${title}"? This cannot be undone.`)) {
                              deleteCampaign(campaign.id);
                            }
                          }}
                          className="rounded-lg p-2 text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`Delete campaign ${getPillarTitle(campaign.contentPillar)}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/campaign/${campaign.id}`}
                          prefetch={false}
                          className="rounded-lg p-2 text-secondary transition-colors hover:bg-muted hover:text-primary"
                          aria-label={`Open campaign ${getPillarTitle(campaign.contentPillar)}`}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerChildren>
            )}
          </section>
        </FadeIn>

        {/* Reviews */}
        <FadeIn delay={0.25}>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Reviews</h2>
              <Link href="/review/new">
                <Button variant="ghost" size="sm">
                  New
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {reviews.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="No reviews yet"
                description="Submit marketing materials for AI-assisted compliance review."
                action={
                  <Link href="/review/new">
                    <Button>Submit Your First Review</Button>
                  </Link>
                }
              />
            ) : (
              <StaggerChildren className="space-y-2">
                {reviews.map((review) => {
                  const result = results[review.id];
                  const assetLabel =
                    ASSET_TYPES.find((t) => t.id === review.assetType)?.label ?? review.assetType;

                  return (
                    <StaggerItem key={review.id}>
                      <Card hover className="flex items-center gap-2 p-4">
                        <Link href={`/review/${review.id}`} prefetch={false} className="min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-medium text-primary">{review.title}</h3>
                              <Badge variant="blue">{assetLabel}</Badge>
                              {review.status === "analyzing" && (
                                <Badge variant="caution">
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  Analyzing
                                </Badge>
                              )}
                              {result && <RiskBadge risk={result.overallRisk} />}
                            </div>
                            <p className="mt-1 font-mono text-xs text-secondary">
                              {review.brand} · {review.market} ·{" "}
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete review "${review.title}"? This cannot be undone.`)) {
                                deleteReview(review.id);
                              }
                            }}
                            className="rounded-lg p-2 text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                            aria-label={`Delete review ${review.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/review/${review.id}`}
                            prefetch={false}
                            className="rounded-lg p-2 text-secondary transition-colors hover:bg-muted hover:text-primary"
                            aria-label={`Open review ${review.title}`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </StaggerChildren>
            )}
          </section>
        </FadeIn>
      </div>

      <InlineNotice>
        <strong className="text-primary">Compliance note:</strong> This tool provides an AI-assisted first-pass review.
        It does not replace review by qualified legal counsel. All materials should receive final approval before publication.
      </InlineNotice>
    </div>
  );
}
