"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Linkedin,
  Instagram,
  Twitter,
  Music2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Button,
  Card,
  StepIndicator,
  HelpTip,
  SelectionTile,
} from "@/components/ui";
import { SlidePanel } from "@/components/motion";
import { generateId } from "@/lib/utils";
import { ADVISORPILOT_KNOWLEDGE } from "@/lib/knowledge/advisorpilot";
import { SOCIAL_PLATFORMS, type SocialPlatform, type CampaignRun } from "@/lib/types";
import { buildDemoUrl } from "@/lib/knowledge/advisorpilot";

const STEPS = ["Content Pillar", "Platforms", "Confirm", "Launch"];

const PLATFORM_ICONS: Record<SocialPlatform, React.ElementType> = {
  linkedin: Linkedin,
  instagram: Instagram,
  x: Twitter,
  tiktok: Music2,
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [contentPillar, setContentPillar] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    "linkedin",
    "instagram",
    "x",
    "tiktok",
  ]);
  const [generateConceptImages, setGenerateConceptImages] = useState(false);

  const togglePlatform = (platform: SocialPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const canNext = () => {
    if (step === 0) return contentPillar !== null;
    if (step === 1) return platforms.length > 0;
    return true;
  };

  const handleLaunch = () => {
    if (!contentPillar) return;
    setSubmitting(true);

    const campaign: CampaignRun = {
      id: generateId(),
      brand: "AdvisorPilot",
      contentPillar: contentPillar,
      platforms,
      generateConceptImages,
      phase: "generating",
      status: "running",
      ads: [],
      iteration: 0,
      fixHistory: [],
      hashtags: [],
      qrUrl: buildDemoUrl("social"),
      createdAt: new Date().toISOString(),
    };

    addCampaign(campaign);
    router.push(`/campaign/${campaign.id}`);
  };

  const selectedPillar = ADVISORPILOT_KNOWLEDGE.contentPillars.find(
    (p) => p.id === contentPillar
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.push("/"))}
          className="mb-4 flex items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "Back" : "Home"}
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          New AdvisorPilot Campaign
        </h1>
        <p className="mt-2 text-secondary">
          Generate organic social ads, run legal review, and prepare posts for all platforms.
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <Card className="p-6 sm:p-8">
        <SlidePanel stepKey={step}>
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Choose a content pillar</h2>
                <p className="mt-1 text-sm text-secondary">
                  Each pillar maps to a core AdvisorPilot value proposition.
                </p>
              </div>
              <div className="grid gap-3">
                {ADVISORPILOT_KNOWLEDGE.contentPillars.map((pillar) => {
                  const selected = contentPillar === pillar.id;
                  return (
                    <SelectionTile
                      key={pillar.id}
                      selected={selected}
                      onClick={() => setContentPillar(pillar.id)}
                    >
                      <p className="font-medium">{pillar.title}</p>
                      <p className={`mt-1 text-sm ${selected ? "text-inverse/70" : "text-secondary"}`}>
                        {pillar.headline}
                      </p>
                      <p className={`mt-2 text-xs ${selected ? "text-inverse/50" : "text-secondary/70"}`}>
                        {pillar.description}
                      </p>
                    </SelectionTile>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Select platforms</h2>
                <p className="mt-1 text-sm text-secondary">
                  We will generate platform-optimized 1:1 and 9:16 ad variants with tailored hashtags.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = PLATFORM_ICONS[platform.id];
                  const selected = platforms.includes(platform.id);
                  return (
                    <SelectionTile
                      key={platform.id}
                      selected={selected}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <Icon
                        className={`mb-2 h-5 w-5 ${selected ? "text-gold" : "text-accent"}`}
                      />
                      <p className="font-medium">{platform.label}</p>
                      <p className={`mt-1 text-xs ${selected ? "text-inverse/70" : "text-secondary"}`}>
                        {platform.description}
                      </p>
                      <p className={`mt-2 font-mono text-xs ${selected ? "text-inverse/50" : "text-secondary/60"}`}>
                        {platform.aspectRatios.join(" + ")} · up to {platform.hashtagLimit} hashtags
                      </p>
                    </SelectionTile>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Confirm campaign</h2>
                <p className="mt-1 text-sm text-secondary">
                  Review your selections before launching the pipeline.
                </p>
              </div>

              <dl className="divide-y divide-border rounded-xl border border-border">
                {[
                  ["Brand", ADVISORPILOT_KNOWLEDGE.brandMark],
                  ["Content Pillar", selectedPillar?.title],
                  ["Headline Preview", selectedPillar?.headline],
                  [
                    "Platforms",
                    platforms
                      .map((p) => SOCIAL_PLATFORMS.find((sp) => sp.id === p)?.label)
                      .join(", "),
                  ],
                  [
                    "Ad Variants",
                    `${platforms.reduce((sum, p) => {
                      const config = SOCIAL_PLATFORMS.find((sp) => sp.id === p);
                      return sum + (config?.aspectRatios.length ?? 0);
                    }, 0)} cards (1:1 + 9:16)`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-4 py-3 sm:px-5">
                    <dt className="w-36 shrink-0 text-sm font-medium text-secondary">{label}</dt>
                    <dd className="text-sm text-primary">{value}</dd>
                  </div>
                ))}
              </dl>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={generateConceptImages}
                  onChange={(event) => setGenerateConceptImages(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium text-primary">
                    Generate AI preview images for all 3 concepts
                  </span>
                  <span className="mt-1 block text-xs text-secondary">
                    Off by default. When enabled, the pipeline generates up to 3 AI images before
                    concept selection (significantly higher cost). Normally only the winning concept
                    gets one master image.
                  </span>
                </span>
              </label>

              <HelpTip>
                Expect ~3 API calls per campaign: 1 batched exploration (gpt-4o-mini), 1 master
                image, 1 caption pass. Layout variants use rendering, not extra AI images.
              </HelpTip>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
              <h2 className="text-xl font-semibold text-primary">Ready to launch pipeline</h2>
              <p className="text-sm text-secondary">
                Click Launch to start the 3-phase campaign pipeline for AdvisorPilot.
              </p>
            </div>
          )}
        </SlidePanel>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0 || submitting}>
          Back
        </Button>
        {step < 3 ? (
          <Button variant="gold" onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="gold" onClick={handleLaunch} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                Launch Pipeline
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
