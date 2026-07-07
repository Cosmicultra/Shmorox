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
import { Button, Card, StepIndicator, HelpTip } from "@/components/ui";
import { generateId } from "@/lib/review-engine";
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
          className="mb-4 flex items-center gap-1 text-sm text-mckinsey-slate hover:text-mckinsey-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "Back" : "Home"}
        </button>
        <h1 className="text-3xl font-semibold text-mckinsey-navy">New Marketing Review</h1>
        <p className="mt-2 text-mckinsey-slate">
          Answer a few simple questions and upload your materials. We will handle the rest.
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <Card className="p-6 sm:p-8">
        {/* Step 0: Asset Type */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">What are you submitting?</h2>
              <p className="mt-1 text-sm text-mckinsey-slate">
                Choose the type that best matches your material. This helps us apply the right checks.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ASSET_TYPES.map((type) => {
                const Icon = ICONS[type.icon] ?? Folder;
                const selected = assetType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setAssetType(type.id)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      selected
                        ? "border-mckinsey-navy bg-mckinsey-navy text-white ring-2 ring-mckinsey-navy ring-offset-2"
                        : "border-mckinsey-border bg-white hover:border-mckinsey-blue/40 hover:shadow-card"
                    }`}
                  >
                    <Icon
                      className={`mb-2 h-5 w-5 ${selected ? "text-white" : "text-mckinsey-blue"}`}
                      strokeWidth={1.5}
                    />
                    <p className="font-medium">{type.label}</p>
                    <p
                      className={`mt-1 text-xs ${selected ? "text-blue-100" : "text-mckinsey-slate"}`}
                    >
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Upload your files</h2>
              <p className="mt-1 text-sm text-mckinsey-slate">
                Add everything related to this campaign — the ad itself, scripts, storyboards, or reference docs.
              </p>
            </div>
            <FileUploader files={files} onChange={setFiles} />
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Tell us about this material</h2>
              <p className="mt-1 text-sm text-mckinsey-slate">
                The more context you provide, the better our review. Plain language is fine.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Campaign or project name" required>
                <input
                  className="input"
                  placeholder="e.g. Spring Cleaning TV Spot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label="Brand" required>
                <input
                  className="input"
                  placeholder="e.g. Clorox, Glad, Burt's Bees"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </Field>
              <Field label="Target market">
                <select
                  className="input"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Planned launch date">
                <input
                  type="date"
                  className="input"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                />
              </Field>
            </div>

            <Field
              label="What claims does this material make?"
              hint="Describe any product benefits, comparisons, or promises shown or stated."
            >
              <textarea
                className="input min-h-[100px]"
                placeholder="e.g. Claims the product kills 99.9% of germs, compares to store brands, says it's eco-friendly…"
                value={claimsDescription}
                onChange={(e) => setClaimsDescription(e.target.value)}
              />
            </Field>

            <Field label="Who is the audience?">
              <input
                className="input"
                placeholder="e.g. Parents, professional cleaners, Gen Z consumers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </Field>

            <Field label="Anything else we should know?">
              <textarea
                className="input min-h-[80px]"
                placeholder="e.g. This is a paid influencer post. Talent contract is on file. Competitor challenged a similar claim last year."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Ready to submit</h2>
              <p className="mt-1 text-sm text-mckinsey-slate">
                Review your information below, then submit for AI legal review.
              </p>
            </div>

            <dl className="divide-y divide-mckinsey-border rounded-lg border border-mckinsey-border">
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
                  <dt className="w-28 shrink-0 text-sm font-medium text-mckinsey-slate">
                    {label}
                  </dt>
                  <dd className="text-sm text-mckinsey-navy">{value}</dd>
                </div>
              ))}
            </dl>

            <HelpTip>
              After you submit, we will analyze your materials and show you a
              plain-language report. This usually takes less than a minute.
            </HelpTip>

          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || submitting}
        >
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

      <style jsx global>{`
        .input {
          @apply w-full rounded-md border border-mckinsey-border bg-white px-3 py-2.5 text-sm text-mckinsey-navy placeholder:text-mckinsey-slate/50 focus:border-mckinsey-blue focus:outline-none focus:ring-2 focus:ring-mckinsey-blue/20;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-mckinsey-navy">
        {label}
        {required && <span className="text-mckinsey-danger"> *</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs text-mckinsey-slate">{hint}</p>}
      {children}
    </div>
  );
}
