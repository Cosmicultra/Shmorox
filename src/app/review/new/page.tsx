"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Layout,
  Share2,
  Users,
  Mail,
  Package,
  FileText,
  Folder,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FileUploader } from "@/components/FileUploader";
import {
  Button,
  Card,
  StepIndicator,
  HelpTip,
  Input,
  Select,
  Textarea,
  Field,
  SelectionTile,
} from "@/components/ui";
import { SlidePanel } from "@/components/motion";
import { generateId } from "@/lib/utils";
import { ASSET_TYPES, MARKETS, type AssetType, type UploadedFile } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  video: Video,
  layout: Layout,
  share: Share2,
  users: Users,
  mail: Mail,
  package: Package,
  file: FileText,
  folder: Folder,
};

const STEPS = ["Type", "Upload", "Details", "Review"];

export default function NewReviewPage() {
  const router = useRouter();
  const { addReview } = useApp();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [assetType, setAssetType] = useState<AssetType | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [market, setMarket] = useState("United States");
  const [claimsDescription, setClaimsDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [notes, setNotes] = useState("");

  const canNext = () => {
    if (step === 0) return assetType !== null;
    if (step === 1) return files.length > 0;
    if (step === 2) return title.trim() && brand.trim();
    return true;
  };

  const handleSubmit = () => {
    if (!assetType) return;
    setSubmitting(true);

    const submission = {
      id: generateId(),
      title: title.trim(),
      brand: brand.trim(),
      market,
      assetType,
      files,
      claimsDescription: claimsDescription.trim(),
      targetAudience: targetAudience.trim(),
      launchDate,
      notes: notes.trim(),
      status: "analyzing" as const,
      createdAt: new Date().toISOString(),
    };

    addReview(submission);
    router.push(`/review/${submission.id}`);
  };

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
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">New Marketing Review</h1>
        <p className="mt-2 text-secondary">
          Answer a few simple questions and upload your materials. We will handle the rest.
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <Card className="p-6 sm:p-8">
        <SlidePanel stepKey={step}>
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">What are you submitting?</h2>
                <p className="mt-1 text-sm text-secondary">
                  Choose the type that best matches your material.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ASSET_TYPES.map((type) => {
                  const Icon = ICONS[type.icon] ?? Folder;
                  const selected = assetType === type.id;
                  return (
                    <SelectionTile
                      key={type.id}
                      selected={selected}
                      onClick={() => setAssetType(type.id)}
                    >
                      <Icon
                        className={`mb-2 h-5 w-5 ${selected ? "text-gold" : "text-accent"}`}
                        strokeWidth={1.5}
                      />
                      <p className="font-medium">{type.label}</p>
                      <p className={`mt-1 text-xs ${selected ? "text-inverse/70" : "text-secondary"}`}>
                        {type.description}
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
                <h2 className="text-xl font-semibold text-primary">Upload your files</h2>
                <p className="mt-1 text-sm text-secondary">
                  Add everything related to this campaign — ads, scripts, storyboards, or reference docs.
                </p>
              </div>
              <FileUploader files={files} onChange={setFiles} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Tell us about this material</h2>
                <p className="mt-1 text-sm text-secondary">
                  The more context you provide, the better our review.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Campaign or project name" required>
                  <Input
                    placeholder="e.g. Spring Cleaning TV Spot"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Field>
                <Field label="Brand" required>
                  <Input
                    placeholder="e.g. Clorox, Glad, Burt's Bees"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </Field>
                <Field label="Target market">
                  <Select value={market} onChange={(e) => setMarket(e.target.value)}>
                    {MARKETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Planned launch date">
                  <Input
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                  />
                </Field>
              </div>

              <Field
                label="What claims does this material make?"
                hint="Describe any product benefits, comparisons, or promises shown or stated."
              >
                <Textarea
                  className="min-h-[100px]"
                  placeholder="e.g. Claims the product kills 99.9% of germs…"
                  value={claimsDescription}
                  onChange={(e) => setClaimsDescription(e.target.value)}
                />
              </Field>

              <Field label="Who is the audience?">
                <Input
                  placeholder="e.g. Parents, professional cleaners, Gen Z consumers"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </Field>

              <Field label="Anything else we should know?">
                <Textarea
                  placeholder="e.g. This is a paid influencer post…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Ready to submit</h2>
                <p className="mt-1 text-sm text-secondary">
                  Review your information below, then submit for AI legal review.
                </p>
              </div>

              <dl className="divide-y divide-border rounded-xl border border-border">
                {[
                  ["Type", ASSET_TYPES.find((t) => t.id === assetType)?.label],
                  ["Campaign", title],
                  ["Brand", brand],
                  ["Market", market],
                  ["Files", `${files.length} file${files.length === 1 ? "" : "s"} uploaded`],
                  ["Claims", claimsDescription || "—"],
                  ["Audience", targetAudience || "—"],
                  ["Launch", launchDate || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-4 py-3 sm:px-5">
                    <dt className="w-28 shrink-0 text-sm font-medium text-secondary">{label}</dt>
                    <dd className="text-sm text-primary">{value}</dd>
                  </div>
                ))}
              </dl>

              <HelpTip>
                After you submit, we will analyze your materials and show you a plain-language report.
                This usually takes less than a minute.
              </HelpTip>
            </div>
          )}
        </SlidePanel>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0 || submitting}>
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                Submit for Review
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
