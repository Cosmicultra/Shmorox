"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { ExpandableContent, motion } from "@/components/motion";
import type { CampaignRun } from "@/lib/types";
import { formatTokenCount } from "@/lib/openai/cost-tracker";
import type { CreativePipelineStage, PipelineStageStatus } from "@/lib/creative/types";

const STAGE_STATUS_ICON: Record<PipelineStageStatus, React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-secondary/50" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-accent" />,
  complete: <CheckCircle2 className="h-4 w-4 text-clear" />,
  failed: <XCircle className="h-4 w-4 text-danger" />,
  skipped: <AlertCircle className="h-4 w-4 text-secondary" />,
};

function StageRow({ stage }: { stage: CreativePipelineStage }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5">{STAGE_STATUS_ICON[stage.status]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary">{stage.label}</p>
        {stage.message && (
          <p className="mt-0.5 text-xs text-secondary">{stage.message}</p>
        )}
      </div>
      <Badge
        variant={
          stage.status === "complete"
            ? "clear"
            : stage.status === "failed"
              ? "danger"
              : stage.status === "running"
                ? "blue"
                : "default"
        }
      >
        {stage.status}
      </Badge>
    </div>
  );
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  const [open, setOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span className="text-sm font-medium text-primary">{title}</span>
        <motion.span animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight className="h-4 w-4 text-secondary" />
        </motion.span>
      </button>
      <ExpandableContent open={open}>
        <pre className="max-h-80 overflow-auto border-t border-border bg-muted/30 p-4 font-mono text-xs text-secondary">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ExpandableContent>
    </div>
  );
}

interface CreativeDirectorDashboardProps {
  campaign: CampaignRun;
}

export function CreativeDirectorDashboard({ campaign }: CreativeDirectorDashboardProps) {
  const job = campaign.creativeJob;
  const review = campaign.creativeReview;
  const brief = campaign.creativeBrief;
  const concepts = campaign.conceptVariations;
  const selected = campaign.selectedConcept;
  const strategyHistory = campaign.strategyReviewHistory ?? job?.strategyReviewHistory;
  const variationGateHistory = campaign.variationGateHistory ?? job?.variationGateHistory;

  if (!brief && !job && !review && !strategyHistory?.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Creative Director</h2>
        {job && (
          <Badge
            variant={
              job.status === "complete"
                ? campaign.imagesBlocked
                  ? "caution"
                  : "clear"
                : job.status === "failed"
                  ? "danger"
                  : "blue"
            }
          >
            {campaign.imagesBlocked && job.status === "complete"
              ? "complete — images blocked"
              : job.status.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {job?.stages && job.stages.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
              Pipeline Stages
            </h3>
            <div className="divide-y divide-border">
              {job.stages.map((stage) => (
                <StageRow key={stage.id} stage={stage} />
              ))}
            </div>
          </Card>
        )}

        {campaign.generationCost && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
              Generation Cost
            </h3>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-secondary">AI text calls</dt>
                <dd className="font-mono text-lg text-primary">
                  {campaign.generationCost.textCalls}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Exploration calls (gpt-4o-mini)</dt>
                <dd className="font-mono text-lg text-primary">
                  {campaign.generationCost.explorationCalls ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Premium calls</dt>
                <dd className="font-mono text-lg text-primary">
                  {campaign.generationCost.premiumCalls ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Total tokens</dt>
                <dd className="font-mono text-lg text-primary">
                  {formatTokenCount(campaign.generationCost.totalTokens ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Image generations</dt>
                <dd className="font-mono text-lg text-primary">
                  {campaign.generationCost.imageGenerations}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Estimated campaign cost</dt>
                <dd className="font-mono text-lg text-accent">
                  ${campaign.generationCost.estimatedTotalCostUsd.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Text cost (token-based)</dt>
                <dd className="font-mono text-lg text-accent">
                  ${campaign.generationCost.estimatedTextCostUsd.toFixed(3)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Cost per approved asset</dt>
                <dd className="font-mono text-lg text-accent">
                  {campaign.generationCost.costPerApprovedAssetUsd != null
                    ? `$${campaign.generationCost.costPerApprovedAssetUsd.toFixed(2)}`
                    : "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-secondary">
              Phase 1 uses one batched exploration call on gpt-4o-mini. Image count should be 1
              unless concept preview images are explicitly enabled.
            </p>
          </Card>
        )}

        {campaign.imagesBlocked && (
          <Card className="border-caution/30 bg-caution/5 p-4">
            <p className="text-sm font-medium text-primary">Image production skipped</p>
            <p className="mt-1 text-xs text-secondary">
              {campaign.variationGateHistory?.at(-1)?.result.approved === false
                ? "The Creative Director did not approve the strategic direction for image generation. Copy and strategy reasoning are available below."
                : job?.stages?.find((s) => s.id === "images")?.message
                  ? `Image generation failed: ${job.stages.find((s) => s.id === "images")?.message}. Template-based ad cards were used instead. Start a new campaign or reload this page to retry image generation.`
                  : "Image generation was unavailable. Template-based ad cards were used instead."}
            </p>
          </Card>
        )}

        {strategyHistory && strategyHistory.length > 0 && (
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-primary">Strategy Review</h3>
              <Badge variant={campaign.strategyApproved ? "clear" : "danger"}>
                {campaign.strategyApproved ? "Approved" : "Rejected"}
              </Badge>
            </div>

            {campaign.finalStrategyRationale && campaign.strategyApproved && (
              <blockquote className="mt-4 border-l-2 border-clear pl-4 text-sm text-primary">
                {campaign.finalStrategyRationale}
              </blockquote>
            )}

            <div className="mt-4 space-y-4">
              {strategyHistory.map((attempt) => (
                <div key={attempt.iteration} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary">
                      Attempt {attempt.iteration}
                    </p>
                    <span className="font-mono text-sm text-accent">
                      {attempt.result.overallScore}/100
                    </span>
                  </div>

                  <p className="mt-2 text-sm italic text-primary">
                    &ldquo;{attempt.result.directorVerdict}&rdquo;
                  </p>

                  {!attempt.result.approved && (
                    <>
                      {attempt.result.rejectionReasons.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase text-secondary">
                            Rejection Reasons
                          </p>
                          <ul className="mt-1 space-y-1">
                            {attempt.result.rejectionReasons.map((r) => (
                              <li key={r} className="text-sm text-primary">− {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {attempt.result.strategicGap && (
                        <p className="mt-2 text-xs text-secondary">
                          <span className="font-medium text-primary">Strategic gap:</span>{" "}
                          {attempt.result.strategicGap}
                        </p>
                      )}
                      {attempt.improvedDirections.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase text-secondary">
                            Stronger Directions Proposed
                          </p>
                          <div className="mt-2 space-y-2">
                            {attempt.improvedDirections.map((d) => (
                              <div key={d.name} className="rounded bg-muted/30 p-3 text-xs">
                                <p className="font-medium text-primary">{d.name}</p>
                                <p className="mt-1 text-accent">&ldquo;{d.headline}&rdquo;</p>
                                <p className="mt-1 text-secondary">{d.positioningAngle}</p>
                                <p className="mt-1 text-secondary">{d.whyStronger}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(attempt.result.evaluation).map(([key, pass]) => (
                      <Badge key={key} variant={pass ? "clear" : "default"}>
                        {key.replace(/([A-Z])/g, " $1").trim()}: {pass ? "yes" : "no"}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {variationGateHistory && variationGateHistory.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-primary">Production Gate</h3>
            {variationGateHistory.map((attempt) => (
              <div key={attempt.iteration} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <Badge variant={attempt.result.approved ? "clear" : "danger"}>
                    {attempt.result.approved ? "Production Approved" : "Production Blocked"}
                  </Badge>
                  <span className="font-mono text-sm text-accent">
                    Top score: {attempt.result.topScore}/100
                  </span>
                </div>
                <p className="mt-2 text-sm italic text-primary">
                  {attempt.result.directorVerdict}
                </p>
                {!attempt.result.approved && attempt.result.rejectionReasons.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {attempt.result.rejectionReasons.map((r) => (
                      <li key={r} className="text-xs text-secondary">− {r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Card>
        )}

        {review && (
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-primary">Creative Review</h3>
              <Badge variant={review.publishReady ? "clear" : "caution"}>
                {review.publishReady ? "Publish Ready" : "Revisions Required"}
              </Badge>
              <span className="font-mono text-sm text-accent">{review.overallScore}/100</span>
            </div>

            {review.directorNotes && (
              <blockquote className="mt-4 border-l-2 border-accent pl-4 text-sm italic text-primary">
                &ldquo;{review.directorNotes}&rdquo;
              </blockquote>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {review.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-secondary">Strengths</p>
                  <ul className="mt-2 space-y-1">
                    {review.strengths.map((s) => (
                      <li key={s} className="text-sm text-primary">+ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {review.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-secondary">Weaknesses</p>
                  <ul className="mt-2 space-y-1">
                    {review.weaknesses.map((w) => (
                      <li key={w} className="text-sm text-primary">− {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {review.requiredChanges.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-secondary">Required Changes</p>
                <ul className="mt-2 space-y-1">
                  {review.requiredChanges.map((c) => (
                    <li key={c} className="text-sm text-primary">→ {c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(review.scores).map(([brand, pass]) => (
                <Badge key={brand} variant={pass ? "clear" : "default"}>
                  {brand}: {pass ? "yes" : "no"}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {concepts && concepts.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary">
              Concept Strategies
            </h3>
            {campaign.visualDiversityReport && (
              <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-primary">Visual Diversity</span>
                  <span className="font-mono text-sm text-accent">
                    {campaign.visualDiversityReport.visualDiversityScore}/100
                  </span>
                  <Badge variant={campaign.visualDiversityReport.approved ? "clear" : "caution"}>
                    {campaign.visualDiversityReport.approved ? "Distinct layouts" : "Similar layouts detected"}
                  </Badge>
                </div>
                {campaign.visualDiversityReport.pairwise.length > 0 && (
                  <div className="space-y-1 font-mono text-xs text-secondary">
                    {campaign.visualDiversityReport.pairwise.map((pair) => (
                      <p key={`${pair.conceptA}-${pair.conceptB}`}>
                        {pair.conceptA} vs {pair.conceptB}: {pair.overallSimilarity}% similar
                        {pair.tooSimilar ? " — too similar" : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {concepts.map((concept) => {
                const isSelected = selected?.style === concept.style;
                const archetype =
                  concept.layoutArchetype ?? concept.brief.layoutArchetype ?? "custom";
                return (
                  <div
                    key={concept.style}
                    className={`rounded-lg border p-4 ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-primary">{concept.strategy.name}</p>
                      {isSelected && <Badge variant="gold">Selected</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-accent">
                      Layout: {archetype.replace(/-/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-secondary">{concept.strategy.inspiration}</p>
                    <p className="mt-2 text-xs text-primary">Goal: {concept.strategy.goal}</p>
                    {concept.brief.visualComposition?.heroElement && (
                      <p className="mt-2 text-xs text-secondary">
                        Hero: {concept.brief.visualComposition.heroElement}
                      </p>
                    )}
                    <p className="mt-2 font-mono text-sm text-accent">{concept.score}/100</p>
                    {concept.rationale && (
                      <p className="mt-2 text-xs text-secondary">{concept.rationale}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {job?.selectionRationale && (
              <p className="mt-4 text-sm text-primary">
                <span className="font-medium">Selection rationale:</span> {job.selectionRationale}
              </p>
            )}
          </Card>
        )}

        {job?.imagePrompts && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
              Image Generation Prompts
            </h3>
            <div className="space-y-3">
              {job.imagePrompts.master && (
                <div>
                  <p className="text-xs font-medium text-secondary">Master Concept</p>
                  <p className="mt-1 rounded bg-muted/50 p-3 font-mono text-xs text-primary">
                    {job.imagePrompts.master}
                  </p>
                </div>
              )}
              {job.imagePrompts.adaptations &&
                Object.entries(job.imagePrompts.adaptations).map(([ratio, prompt]) => (
                  <div key={ratio}>
                    <p className="text-xs font-medium text-secondary">{ratio} Adaptation</p>
                    <p className="mt-1 rounded bg-muted/50 p-3 font-mono text-xs text-primary">
                      {prompt}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        )}

        <JsonBlock title="Creative Brief JSON" data={brief} />
        {campaign.originalBrief && campaign.originalBrief.id !== brief?.id && (
          <JsonBlock title="Original Brief (before strategy revisions)" data={campaign.originalBrief} />
        )}
        {job?.brandDna && <JsonBlock title="Brand DNA" data={job.brandDna} />}

        {campaign.ads.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
              Asset Metadata
            </h3>
            <div className="space-y-2 font-mono text-xs text-secondary">
              {campaign.ads.map((ad) => (
                <div key={ad.id} className="rounded bg-muted/30 p-3">
                  <p className="text-primary">
                    {ad.platform} · {ad.aspectRatio} · {ad.width}×{ad.height}
                  </p>
                  <p className="mt-1">
                    Creative asset: {ad.creativeAssetUrl ? "AI generated" : "Template"}
                  </p>
                  <p>Marketing asset: {ad.imageDataUrl ? "Packaged" : "Pending"}</p>
                  <p className="mt-1 truncate">Headline: {ad.headline}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
