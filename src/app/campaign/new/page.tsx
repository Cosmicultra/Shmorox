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
  Dialog,
  Field,
  StepIndicator,
  HelpTip,
  SelectionTile,
  Textarea,
} from "@/components/ui";
import { SlidePanel } from "@/components/motion";
import { generateId } from "@/lib/utils";
import { ADVISORPILOT_KNOWLEDGE } from "@/lib/knowledge/advisorpilot";
import { SOCIAL_PLATFORMS, type SocialPlatform, type CampaignRun } from "@/lib/types";
import type { AdLayoutStyle, CanvasStyle } from "@/lib/ad/ad-template-registry";
import { buildDemoUrl } from "@/lib/knowledge/advisorpilot";

const STEPS = ["Content Pillar", "Platforms", "Confirm", "Launch"];
const CUSTOM_REQUEST_PILLAR_ID = "custom-request";

const PLATFORM_ICONS: Record<SocialPlatform, React.ElementType> = {
  linkedin: Linkedin,
  instagram: Instagram,
  x: Twitter,
  tiktok: Music2,
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign, launchCampaignPipeline } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [contentPillar, setContentPillar] = useState<string | null>(null);
  const [customRequest, setCustomRequest] = useState("");
  const [customRequestDraft, setCustomRequestDraft] = useState("");
  const [customRequestOpen, setCustomRequestOpen] = useState(false);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    "linkedin",
    "instagram",
    "x",
    "tiktok",
  ]);
  const [generateConceptImages, setGenerateConceptImages] = useState(false);
  const [layoutStyle, setLayoutStyle] = useState<AdLayoutStyle>("split-graphic");
  const [canvasStyle, setCanvasStyle] = useState<CanvasStyle>("gradient");

  const togglePlatform = (platform: SocialPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const selectPillar = (pillarId: string) => {
    if (pillarId === CUSTOM_REQUEST_PILLAR_ID) {
      setCustomRequestDraft(customRequest);
      setCustomRequestOpen(true);
      return;
    }
    setContentPillar(pillarId);
    setCustomRequest("");
  };

  const confirmCustomRequest = () => {
    const trimmed = customRequestDraft.trim();
    if (!trimmed) return;
    setCustomRequest(trimmed);
    setContentPillar(CUSTOM_REQUEST_PILLAR_ID);
    setCustomRequestOpen(false);
  };

  const canNext = () => {
    if (step === 0) {
      if (contentPillar === CUSTOM_REQUEST_PILLAR_ID) {
        return customRequest.trim().length > 0;
      }
      return contentPillar !== null;
    }
    if (step === 1) return platforms.length > 0;
    return true;
  };

  const handleLaunch = () => {
    if (!contentPillar) return;
    if (contentPillar === CUSTOM_REQUEST_PILLAR_ID && !customRequest.trim()) return;
    setSubmitting(true);

    const campaign: CampaignRun = {
      id: generateId(),
      brand: "AdvisorPilot",
      contentPillar: contentPillar,
      platforms,
      generateConceptImages,
      layoutStyle,
      canvasStyle,
      customRequest:
        contentPillar === CUSTOM_REQUEST_PILLAR_ID ? customRequest.trim() : undefined,
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
    launchCampaignPipeline(campaign.id);
    // Generation runs in the app shell — leave the detail page anytime.
    router.push("/");
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
                  const isCustom = pillar.id === CUSTOM_REQUEST_PILLAR_ID;
                  return (
                    <SelectionTile
                      key={pillar.id}
                      selected={selected}
                      onClick={() => selectPillar(pillar.id)}
                    >
                      <p className="font-medium">{pillar.title}</p>
                      <p className={`mt-1 text-sm ${selected ? "text-inverse/70" : "text-secondary"}`}>
                        {isCustom && selected && customRequest
                          ? customRequest
                          : pillar.headline}
                      </p>
                      <p className={`mt-2 text-xs ${selected ? "text-inverse/50" : "text-secondary/70"}`}>
                        {pillar.description}
                      </p>
                      {isCustom && selected && customRequest ? (
                        <p className={`mt-2 text-xs font-medium ${selected ? "text-gold" : "text-accent"}`}>
                          Edit topic
                        </p>
                      ) : null}
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
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Layout style</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: "split-graphic" as const,
                        title: "Split with product graphic",
                        description: "Copy on the left, lifestyle photo and UI on the right.",
                      },
                      {
                        id: "text-only" as const,
                        title: "Text-only",
                        description: "No graphic — full-width copy for LinkedIn A/B testing.",
                      },
                    ] as const
                  ).map((option) => (
                    <SelectionTile
                      key={option.id}
                      selected={layoutStyle === option.id}
                      onClick={() => {
                        setLayoutStyle(option.id);
                        if (option.id === "text-only") setCanvasStyle("clean");
                      }}
                    >
                      <p className="font-medium">{option.title}</p>
                      <p
                        className={`mt-1 text-xs ${layoutStyle === option.id ? "text-inverse/70" : "text-secondary"}`}
                      >
                        {option.description}
                      </p>
                    </SelectionTile>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">Background</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: "gradient" as const,
                        title: "Soft gradient",
                        description: "Current branded canvas with subtle texture.",
                      },
                      {
                        id: "clean" as const,
                        title: "Clean white",
                        description: "Flat white background — recommended for LinkedIn static.",
                      },
                    ] as const
                  ).map((option) => (
                    <SelectionTile
                      key={option.id}
                      selected={canvasStyle === option.id}
                      onClick={() => setCanvasStyle(option.id)}
                    >
                      <p className="font-medium">{option.title}</p>
                      <p
                        className={`mt-1 text-xs ${canvasStyle === option.id ? "text-inverse/70" : "text-secondary"}`}
                      >
                        {option.description}
                      </p>
                    </SelectionTile>
                  ))}
                </div>
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
                  ...(contentPillar === CUSTOM_REQUEST_PILLAR_ID && customRequest
                    ? [["Custom Topic", customRequest] as const]
                    : [["Headline Preview", selectedPillar?.headline] as const]),
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
                  [
                    "Layout",
                    layoutStyle === "text-only" ? "Text-only" : "Split with product graphic",
                  ],
                  [
                    "Background",
                    canvasStyle === "clean" ? "Clean white" : "Soft gradient",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-4 py-3 sm:px-5">
                    <dt className="w-36 shrink-0 text-sm font-medium text-secondary">{label}</dt>
                    <dd className="text-sm text-primary whitespace-pre-wrap">{value}</dd>
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
              <h2 className="text-xl font-semibold text-primary">Ready to launch</h2>
              <p className="text-sm text-secondary">
                Generation runs in the background — you can keep working while it finishes.
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

      <Dialog open={customRequestOpen} onClose={() => setCustomRequestOpen(false)}>
        <Card className="p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-primary">Custom request</h2>
              <p className="mt-1 text-sm text-secondary">
                Tell us what to talk about. We will research AdvisorPilot capabilities and write a
                grounded post around your topic.
              </p>
            </div>
            <Field
              label="What should this post cover?"
              hint="Example: How AdvisorPilot helps RIAs prep for prospect meetings without adding headcount."
              required
            >
              <Textarea
                value={customRequestDraft}
                onChange={(event) => setCustomRequestDraft(event.target.value)}
                placeholder="Describe the angle, audience pain, or announcement you want to post about…"
                rows={5}
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCustomRequestOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={confirmCustomRequest}
                disabled={!customRequestDraft.trim()}
              >
                Use this topic
              </Button>
            </div>
          </div>
        </Card>
      </Dialog>
    </div>
  );
}
