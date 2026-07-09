"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "@/components/motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Card, Badge, RiskBadge } from "@/components/ui";
import { ShimmerSkeleton, ExpandableContent, StaggerChildren, StaggerItem } from "@/components/motion";
import { ASSET_TYPES, type Finding } from "@/lib/types";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getReview, getResult, setResult, updateReview } = useApp();
  const review = getReview(id);
  const result = getResult(id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    if (!review) {
      const t = setTimeout(() => router.push("/"), 500);
      return () => clearTimeout(t);
    }
  }, [review, router]);

  useEffect(() => {
    if (!review || result || review.status !== "analyzing") return;
    let cancelled = false;

    (async () => {
      const { runAIReview } = await import("@/lib/review-engine");
      const analysis = await runAIReview(review, (step) => {
        if (!cancelled) setProgress(step);
      });
      if (cancelled) return;
      setResult(review.id, analysis);
      updateReview(review.id, {
        status: "complete",
        completedAt: new Date().toISOString(),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [review, result, setResult, updateReview]);

  if (!review) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <ShimmerSkeleton className="h-4 w-48" />
      </div>
    );
  }

  const assetLabel =
    ASSET_TYPES.find((t) => t.id === review.assetType)?.label ?? review.assetType;
  const analyzing = review.status === "analyzing" && !result;

  const riskBannerClass = {
    clear: "from-success/20 to-success/5 border-success/20",
    caution: "from-warning/20 to-warning/5 border-warning/20",
    "action-required": "from-danger/20 to-danger/5 border-danger/20",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
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
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{review.title}</h1>
            <p className="mt-1 font-mono text-sm text-secondary">
              {review.brand} · {assetLabel} · {review.market}
            </p>
          </div>
          {result && <RiskBadge risk={result.overallRisk} />}
        </div>
      </div>

      {analyzing && (
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-accent" />
          <h2 className="text-xl font-semibold text-primary">Analyzing your materials…</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-secondary">
            {progress ||
              "We are reading your files and checking claims against FTC, EPA, and industry advertising standards."}
          </p>
          <div className="mx-auto mt-6 max-w-sm space-y-3 text-left">
            {[
              "Reading uploaded materials",
              "Identifying product claims",
              "Checking regulatory compliance",
              "Preparing your report",
            ].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="h-2 w-2 rounded-full bg-accent"
                />
                <span className="text-sm text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {result && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`overflow-hidden border bg-gradient-to-br ${riskBannerClass[result.overallRisk]}`}>
              <div className="px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  In plain language
                </p>
                <p className="mt-2 text-lg font-semibold leading-relaxed text-primary">
                  {result.plainLanguageSummary}
                </p>
              </div>
              <div className="border-t border-border/50 px-6 py-4">
                <p className="text-sm text-secondary">{result.summary}</p>
                <p className="mt-2 font-mono text-xs text-secondary/70">
                  AI confidence: {result.confidence}% · First-pass review, not final legal approval
                </p>
              </div>
            </Card>
          </motion.div>

          {result.findings.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-primary">
                Findings ({result.findings.length})
              </h2>
              <StaggerChildren className="space-y-3">
                {result.findings.map((finding) => (
                  <StaggerItem key={finding.id}>
                    <FindingCard
                      finding={finding}
                      expanded={expanded === finding.id}
                      onToggle={() =>
                        setExpanded(expanded === finding.id ? null : finding.id)
                      }
                    />
                  </StaggerItem>
                ))}
              </StaggerChildren>
            </section>
          )}

          {result.findings.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
              <h3 className="text-lg font-semibold text-primary">No issues flagged in text analysis</h3>
              <p className="mt-2 text-sm text-secondary">
                We did not detect common claim patterns. Review the checklist below and confirm with legal.
              </p>
            </Card>
          )}

          <section>
            <h2 className="mb-4 text-xl font-semibold text-primary">Compliance Checklist</h2>
            <Card className="divide-y divide-border">
              {result.checklist.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 px-5 py-4"
                >
                  {item.passed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-primary">{item.label}</p>
                    {item.note && (
                      <p className="mt-1 text-xs text-secondary">{item.note}</p>
                    )}
                  </div>
                  <Badge variant={item.passed ? "clear" : "caution"} className="ml-auto shrink-0">
                    {item.passed ? "Pass" : "Review"}
                  </Badge>
                </motion.div>
              ))}
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-primary">Recommended Next Steps</h2>
            <Card className="p-6">
              <ol className="space-y-3">
                {result.nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-primary">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/review/new">
              <Button>
                <RefreshCw className="h-4 w-4" />
                Submit Revised Version
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Submission Details</h2>
        <Card className="divide-y divide-border">
          {review.claimsDescription && (
            <DetailRow label="Claims described" value={review.claimsDescription} />
          )}
          {review.targetAudience && (
            <DetailRow label="Audience" value={review.targetAudience} />
          )}
          {review.notes && <DetailRow label="Notes" value={review.notes} />}
          <DetailRow
            label="Files"
            value={review.files.map((f) => f.name).join(", ") || "—"}
          />
          <DetailRow label="Submitted" value={new Date(review.createdAt).toLocaleString()} />
        </Card>
      </section>
    </div>
  );
}

function FindingCard({
  finding,
  expanded,
  onToggle,
}: {
  finding: Finding;
  expanded: boolean;
  onToggle: () => void;
}) {
  const riskIcon = {
    clear: <CheckCircle2 className="h-5 w-5 text-success" />,
    caution: <AlertTriangle className="h-5 w-5 text-warning" />,
    "action-required": <XCircle className="h-5 w-5 text-danger" />,
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-muted/50"
      >
        {riskIcon[finding.risk]}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-primary">{finding.title}</p>
            <Badge variant="default">{finding.category}</Badge>
          </div>
          <p className="mt-1 text-sm text-secondary">{finding.summary}</p>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 shrink-0 text-secondary" />
        </motion.span>
      </button>
      <ExpandableContent open={expanded}>
        <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm">
          <p className="text-primary">{finding.detail}</p>
          {finding.regulation && (
            <p className="mt-3 text-xs font-medium text-secondary">
              Relevant standards: {finding.regulation}
            </p>
          )}
          {finding.location && (
            <p className="mt-1 text-xs text-secondary">{finding.location}</p>
          )}
          <div className="mt-4 rounded-lg border border-accent/20 bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Recommendation
            </p>
            <p className="mt-1 text-primary">{finding.recommendation}</p>
          </div>
        </div>
      </ExpandableContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{label}</p>
      <p className="mt-1 text-sm text-primary">{value}</p>
    </div>
  );
}
