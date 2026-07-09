"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  MessageSquare,
  FileCheck,
  Shield,
  HelpCircle,
  ArrowRight,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { Button, Card, AccordionItem } from "@/components/ui";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion";

const FAQ = [
  {
    q: "Do I need to know how to use AI?",
    a: "No. This tool is designed for marketing managers, brand teams, and legal coordinators — not technologists. You upload files, answer simple questions, and read a plain-language report.",
  },
  {
    q: "What types of materials can I submit?",
    a: "Videos, TV commercials, display ads, social media posts, influencer content, email campaigns, packaging, print ads, and more.",
  },
  {
    q: "Does this replace our legal department?",
    a: "No. This is a first-pass AI review to help your team work faster. All materials still need final approval from qualified legal counsel.",
  },
  {
    q: "What does the AI actually check?",
    a: "Product efficacy claims, comparative advertising, environmental/green claims, endorsement disclosures, and promotional language — plus asset-type-specific compliance checklists.",
  },
  {
    q: "What do the status labels mean?",
    a: "'Looks Good' means no major red flags — but legal should still sign off. 'Review Needed' means closer look warranted. 'Action Required' means involve legal before publishing.",
  },
  {
    q: "Is my data secure?",
    a: "In this demo, reviews are stored locally in your browser. Enterprise deployment would use secure infrastructure with role-based access and audit logs.",
  },
  {
    q: "Can I re-submit after making changes?",
    a: "Yes. Use 'Submit Revised Version' to run a new review on updated materials.",
  },
];

const PROCESS_STEPS = [
  { icon: Megaphone, title: "Launch campaigns", desc: "Generate ads, run legal review, package posts with QR codes." },
  { icon: Upload, title: "Submit for review", desc: "Upload materials and describe claims for AI compliance analysis." },
  { icon: FileCheck, title: "Review reports", desc: "Get plain-language findings, checklists, and next steps." },
  { icon: Shield, title: "Approve & publish", desc: "Connect social accounts and ship approved content." },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">How It Works</h1>
          <p className="mt-2 text-lg text-secondary">
            Your AI marketing team — campaigns, compliance, and publishing in one workspace.
          </p>
        </div>
      </FadeIn>

      {/* Horizontal timeline */}
      <FadeIn delay={0.1}>
        <Card className="p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-primary">The workflow</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative">
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+20px)] top-5 hidden h-px w-[calc(100%-40px)] bg-border lg:block" />
                )}
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-3 font-semibold text-primary">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/campaign/new">
              <Button variant="gold">
                Start a Campaign
                <Megaphone className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/review/new">
              <Button variant="secondary">
                Submit a Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </FadeIn>

      <section>
        <FadeIn delay={0.15}>
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-primary">Frequently Asked Questions</h2>
          </div>
        </FadeIn>
        <StaggerChildren className="space-y-2">
          {FAQ.map(({ q, a }, i) => (
            <StaggerItem key={q}>
              <AccordionItem
                title={q}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {a}
              </AccordionItem>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      <FadeIn delay={0.2}>
        <Card elevated className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary to-accent/80 p-8 text-inverse">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,110,0.15),transparent_50%)]" />
            <div className="relative">
              <Sparkles className="mb-3 h-6 w-6 text-gold" />
              <h2 className="text-xl font-semibold">Built for enterprise marketing teams</h2>
              <p className="mt-3 text-sm leading-relaxed text-inverse/70">
                Creative Studio brings campaign generation, compliance review, and social publishing together —
                so marketing and legal teams move faster without cutting corners.
              </p>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
