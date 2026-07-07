"use client";

import Link from "next/link";
import {
  Upload,
  MessageSquare,
  FileCheck,
  Shield,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

const FAQ = [
  {
    q: "Do I need to know how to use AI?",
    a: "No. This tool is designed for marketing managers, brand teams, and legal coordinators — not technologists. You upload files, answer simple questions, and read a plain-language report. No prompts, no technical setup.",
  },
  {
    q: "What types of materials can I submit?",
    a: "Videos, TV commercials, display ads, social media posts, influencer content, email campaigns, packaging, print ads, and more. Upload the creative itself plus any scripts, storyboards, or reference documents.",
  },
  {
    q: "Does this replace our legal department?",
    a: "No. This is a first-pass AI review to help your team work faster and catch common issues early. All materials still need final approval from qualified legal counsel before publication.",
  },
  {
    q: "What does the AI actually check?",
    a: "It scans for product efficacy claims (germ-kill, disinfection), comparative advertising, environmental/green claims, natural/clean positioning, endorsement disclosures, and promotional language. It also runs asset-type-specific compliance checklists informed by Fortune 500 legal practices.",
  },
  {
    q: "What do the status labels mean?",
    a: "'Looks Good' means no major red flags were found — but legal should still sign off. 'Review Needed' means some items warrant a closer look. 'Action Required' means you should involve legal before publishing.",
  },
  {
    q: "Is my data secure?",
    a: "In this demo, reviews are stored locally in your browser. For enterprise deployment, materials would be processed through your company's secure infrastructure with role-based access, audit logs, and integration with your legal workflow tools.",
  },
  {
    q: "Can I re-submit after making changes?",
    a: "Yes. After addressing flagged items, use 'Submit Revised Version' to run a new review on your updated materials.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-semibold text-mckinsey-navy">How It Works</h1>
        <p className="mt-2 text-lg text-mckinsey-slate">
          A simple guide for anyone submitting marketing materials for legal review.
        </p>
      </div>

      <Card className="p-8">
        <h2 className="mb-6 text-xl font-semibold">The review process</h2>
        <div className="space-y-8">
          {[
            {
              icon: Upload,
              title: "1. Choose your material type and upload files",
              desc: "Select whether you're submitting a video, social post, influencer content, or other format. Then drag and drop your files — just like attaching to an email.",
            },
            {
              icon: MessageSquare,
              title: "2. Describe what the ad claims",
              desc: "Tell us in your own words what the material says or implies about the product. You don't need legal terminology — plain language works best.",
            },
            {
              icon: FileCheck,
              title: "3. Read your report",
              desc: "You'll get a clear summary: what's fine, what needs attention, and specific recommendations. Expand any finding for details and relevant regulations.",
            },
            {
              icon: Shield,
              title: "4. Share with legal for final approval",
              desc: "Forward the report to your legal team. They make the final call on whether the material is approved for use.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mckinsey-mist">
                <Icon className="h-5 w-5 text-mckinsey-navy" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-mckinsey-navy">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mckinsey-slate">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link href="/review/new" className="mt-8 inline-block">
          <Button size="lg">
            Start Your First Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Card>

      <section>
        <div className="mb-6 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-mckinsey-blue" />
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <Card key={q} className="p-5">
              <h3 className="font-medium text-mckinsey-navy">{q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mckinsey-slate">{a}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-mckinsey-navy/20 bg-mckinsey-navy p-8 text-white">
        <h2 className="text-xl font-semibold">Built for enterprise legal teams</h2>
        <p className="mt-3 text-sm leading-relaxed text-blue-100">
          Shmorox is designed around how Fortune 500 marketing and legal teams actually
          work — cross-functional claim review, FTC and EPA substantiation standards,
          NAD competitive monitoring, influencer disclosure requirements, and
          plain-language reporting that non-legal stakeholders can act on.
        </p>
      </Card>
    </div>
  );
}
