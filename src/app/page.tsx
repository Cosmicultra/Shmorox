"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSearch,
  Shield,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Card, Badge, RiskBadge } from "@/components/ui";
import { ASSET_TYPES } from "@/lib/types";

export default function HomePage() {
  const { reviews, results } = useApp();

  const completed = reviews.filter((r) => r.status === "complete");
  const inProgress = reviews.filter((r) => r.status === "analyzing");

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl bg-mckinsey-navy px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-mckinsey-blue/20 to-transparent" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
            Enterprise Legal Marketing Review
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Submit marketing materials. Get a clear legal review in minutes.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-blue-100/90 sm:text-lg">
            Upload your ads, videos, social posts, or influencer content. Our AI
            scans for claims, disclosures, and compliance issues — then explains
            everything in plain language anyone can understand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/review/new">
              <Button size="lg" variant="inverse">
                Start a New Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline-light">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple 3-step explainer */}
      <section>
        <h2 className="mb-2 text-2xl font-semibold text-mckinsey-navy">
          Three steps. No AI experience needed.
        </h2>
        <p className="mb-8 max-w-2xl text-mckinsey-slate">
          If you can attach a file to an email, you can use this tool.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              icon: FileSearch,
              title: "Upload your materials",
              desc: "Drop in videos, ad cards, social posts, scripts — any format.",
            },
            {
              step: "2",
              icon: Sparkles,
              title: "AI reviews your content",
              desc: "We scan for product claims, disclosures, green claims, and more.",
            },
            {
              step: "3",
              icon: Shield,
              title: "Get a plain-language report",
              desc: "See what's fine, what needs attention, and what to do next.",
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <Card key={step} className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mckinsey-navy text-sm font-semibold text-white">
                  {step}
                </span>
                <Icon className="h-5 w-5 text-mckinsey-blue" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-mckinsey-slate">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Supported types */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold">What you can submit</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ASSET_TYPES.map((type) => (
            <div
              key={type.id}
              className="rounded-lg border border-mckinsey-border bg-white px-4 py-3"
            >
              <p className="text-sm font-medium text-mckinsey-navy">{type.label}</p>
              <p className="mt-0.5 text-xs text-mckinsey-slate">{type.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent reviews */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Reviews</h2>
          {reviews.length > 0 && (
            <Link href="/review/new">
              <Button variant="secondary" size="sm">
                New Review
              </Button>
            </Link>
          )}
        </div>

        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mckinsey-mist">
              <FileSearch className="h-6 w-6 text-mckinsey-slate" />
            </div>
            <h3 className="text-lg font-semibold">No reviews yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-mckinsey-slate">
              When you submit marketing materials for review, they will appear here
              with their status and results.
            </p>
            <Link href="/review/new" className="mt-6 inline-block">
              <Button>Submit Your First Review</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const result = results[review.id];
              const assetLabel =
                ASSET_TYPES.find((t) => t.id === review.assetType)?.label ?? review.assetType;

              return (
                <Link key={review.id} href={`/review/${review.id}`}>
                  <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-elevated">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-medium text-mckinsey-navy">
                          {review.title}
                        </h3>
                        <Badge variant="blue">{assetLabel}</Badge>
                        {review.status === "analyzing" && (
                          <Badge variant="caution">
                            <Clock className="mr-1 inline h-3 w-3" />
                            Analyzing
                          </Badge>
                        )}
                        {result && <RiskBadge risk={result.overallRisk} />}
                      </div>
                      <p className="mt-1 text-sm text-mckinsey-slate">
                        {review.brand} · {review.market} ·{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="ml-4 h-5 w-5 shrink-0 text-mckinsey-slate" />
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {(completed.length > 0 || inProgress.length > 0) && (
          <p className="mt-4 text-center text-xs text-mckinsey-slate">
            {completed.length} completed · {inProgress.length} in progress
          </p>
        )}
      </section>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/40 p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mckinsey-warning" />
          <div>
            <p className="text-sm font-medium text-mckinsey-navy">Important</p>
            <p className="mt-1 text-sm text-mckinsey-slate">
              This tool provides an AI-assisted first-pass review to help your team
              work faster. It does not replace review by qualified legal counsel.
              All materials should receive final approval from your legal department
              before publication.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
