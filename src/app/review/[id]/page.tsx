"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Card, Badge, RiskBadge } from "@/components/ui";
import { runAIReview } from "@/lib/review-engine";
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mckinsey-blue" />
      </div>
    );
  }

  const assetLabel =
    ASSET_TYPES.find((t) => t.id === review.assetType)?.label ?? review.assetType;
  const analyzing = review.status === "analyzing" && !result;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/"
          className="mb-4 flex items-center gap-1 text-sm text-mckinsey-slate hover:text-mckinsey-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          All Reviews
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-mckinsey-navy">{review.title}</h1>
            <p className="mt-1 text-mckinsey-slate">
              {review.brand} · {assetLabel} · {review.market}
            </p>
          </div>
          {result && <RiskBadge risk={result.overallRisk} />}
        </div>
      </div>

      {analyzing && (
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-mckinsey-blue" />
          <h2 className="text-xl font-semibold">Analyzing your materials…</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-mckinsey-slate">
            {progress ||
              "We are reading your files and checking claims against FTC, EPA, and industry advertising standards."}
          </p>
          <div className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-mckinsey-slate">
            {[
              "Reading uploaded materials",
              "Identifying product claims",
              "Checking regulatory compliance",
              "Preparing your report",
            ].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-mckinsey-blue animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                {label}
              </div>
            ))}
          </div>
        </Card>
      )}

      {result && (
        <>
          {/* Plain language summary */}
          <Card className="overflow-hidden">
            <div
              className={`px-6 py-5 ${
                result.overallRisk === "clear"
                  ? "bg-emerald-50"
                  : result.overallRisk === "caution"
                    ? "bg-amber-50"
                    : "bg-red-50"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-mckinsey-slate">
                In plain language
              </p>
              <p className="mt-2 text-lg font-medium leading-relaxed text-mckinsey-navy">
                {result.plainLanguageSummary}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-mckinsey-slate">{result.summary}</p>
              <p className="mt-2 text-xs text-mckinsey-slate/70">
                AI confidence: {result.confidence}% · This is a first-pass review, not final legal approval
              </p>
            </div>
          </Card>

          {/* Findings */}
          {result.findings.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">
                Findings ({result.findings.length})
              </h2>
              <div className="space-y-3">
                {result.findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    expanded={expanded === finding.id}
                    onToggle={() =>
                      setExpanded(expanded === finding.id ? null : finding.id)
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {result.findings.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-mckinsey-success" />
              <h3 className="text-lg font-semibold">No issues flagged in text analysis</h3>
              <p className="mt-2 text-sm text-mckinsey-slate">
                We did not detect common claim patterns in your description. Review the
                compliance checklist below and confirm with legal before publishing.
              </p>
            </Card>
          )}

          {/* Checklist */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Compliance Checklist</h2>
            <Card className="divide-y divide-mckinsey-border">
              {result.checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  {item.passed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mckinsey-success" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mckinsey-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-mckinsey-navy">{item.label}</p>
                    {item.note && (
                      <p className="mt-1 text-xs text-mckinsey-slate">{item.note}</p>
                    )}
                  </div>
                  <Badge
                    variant={item.passed ? "clear" : "caution"}
                    className="ml-auto shrink-0"
                  >
                    {item.passed ? "Pass" : "Review"}
                  </Badge>
                </div>
              ))}
            </Card>
          </section>

          {/* Next steps */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Recommended Next Steps</h2>
            <Card className="p-6">
              <ol className="space-y-3">
                {result.nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mckinsey-navy text-xs font-medium text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-mckinsey-navy">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/review/new">
              <Button>
                <RefreshCw className="h-4 w-4" />
                Submit Revised Version
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </>
      )}

      {/* Submission details */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Submission Details</h2>
        <Card className="divide-y divide-mckinsey-border">
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
          <DetailRow
            label="Submitted"
            value={new Date(review.createdAt).toLocaleString()}
          />
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
    clear: <CheckCircle2 className="h-5 w-5 text-mckinsey-success" />,
    caution: <AlertTriangle className="h-5 w-5 text-mckinsey-warning" />,
    "action-required": <XCircle className="h-5 w-5 text-mckinsey-danger" />,
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-5 text-left hover:bg-mckinsey-mist/50"
      >
        {riskIcon[finding.risk]}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-mckinsey-navy">{finding.title}</p>
            <Badge variant="default">{finding.category}</Badge>
          </div>
          <p className="mt-1 text-sm text-mckinsey-slate">{finding.summary}</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-mckinsey-slate" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-mckinsey-slate" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-mckinsey-border bg-mckinsey-mist/30 px-5 py-4 text-sm">
          <p className="text-mckinsey-navy">{finding.detail}</p>
          {finding.regulation && (
            <p className="mt-3 text-xs font-medium text-mckinsey-slate">
              Relevant standards: {finding.regulation}
            </p>
          )}
          {finding.location && (
            <p className="mt-1 text-xs text-mckinsey-slate">{finding.location}</p>
          )}
          <div className="mt-4 rounded-md border border-blue-100 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-mckinsey-blue">
              Recommendation
            </p>
            <p className="mt-1 text-mckinsey-navy">{finding.recommendation}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-mckinsey-slate">
        {label}
      </p>
      <p className="mt-1 text-sm text-mckinsey-navy">{value}</p>
    </div>
  );
}
