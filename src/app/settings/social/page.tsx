"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "@/components/motion";
import {
  Linkedin,
  Instagram,
  Twitter,
  Music2,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button, Card, Badge } from "@/components/ui";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion";
import { checkConnection, setLinkedInPostAs, type ConnectionStatus } from "@/lib/social/client";
import { linkedInOAuthUrl } from "@/lib/social/types";
import type { SocialPlatform } from "@/lib/types";

const PLATFORMS: {
  id: SocialPlatform;
  label: string;
  icon: React.ElementType;
  accent: string;
  envVars: string[];
}[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    accent: "bg-[#0A66C2]/10 text-[#0A66C2] ring-[#0A66C2]/20",
    envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_ID"],
  },
  {
    id: "instagram",
    label: "Instagram / Meta",
    icon: Instagram,
    accent: "bg-[#E4405F]/10 text-[#E4405F] ring-[#E4405F]/20",
    envVars: ["META_APP_ID", "META_ACCESS_TOKEN", "META_PAGE_ID"],
  },
  {
    id: "x",
    label: "X (Twitter)",
    icon: Twitter,
    accent: "bg-primary/10 text-primary ring-border",
    envVars: ["X_API_KEY", "X_ACCESS_TOKEN"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: Music2,
    accent: "bg-primary/10 text-primary ring-border",
    envVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_ACCESS_TOKEN"],
  },
];

function SocialSettingsPage() {
  const { setSocialConnection, getSocialConnection } = useApp();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState<SocialPlatform | null>(null);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [linkedinMessage, setLinkedinMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [linkedinDetails, setLinkedinDetails] = useState<ConnectionStatus | null>(null);
  const [switchingPostAs, setSwitchingPostAs] = useState(false);
  const [demoMode, setDemoMode] = useState<Record<SocialPlatform, boolean>>({
    linkedin: true,
    instagram: true,
    x: true,
    tiktok: true,
  });

  useEffect(() => {
    const linkedin = searchParams.get("linkedin");
    const linkedinError = searchParams.get("linkedin_error");
    const account = searchParams.get("account");

    if (linkedin === "connected" && linkedinError) {
      // Connected personally, but company page was not found
      setLinkedinMessage({ type: "error", text: linkedinError });
      setSocialConnection({
        platform: "linkedin",
        connected: true,
        accountName: account ?? "LinkedIn Account",
        connectedAt: new Date().toISOString(),
      });
      setDemoMode((prev) => ({ ...prev, linkedin: false }));
    } else if (linkedin === "connected") {
      setLinkedinMessage({
        type: "success",
        text: account
          ? `LinkedIn connected as ${account}. Campaign posts will publish to that page.`
          : "LinkedIn connected. You can post from campaigns now.",
      });
      setSocialConnection({
        platform: "linkedin",
        connected: true,
        accountName: account ?? "LinkedIn Account",
        connectedAt: new Date().toISOString(),
      });
      setDemoMode((prev) => ({ ...prev, linkedin: false }));
    } else if (linkedinError) {
      setLinkedinMessage({ type: "error", text: linkedinError });
    }
  }, [searchParams, setSocialConnection]);

  useEffect(() => {
    for (const platform of PLATFORMS) {
      checkConnection(platform.id === "instagram" ? "meta" : platform.id).then((status) => {
        if (platform.id === "linkedin") {
          setLinkedinDetails(status);
        }
        if (status.connected) {
          setSocialConnection({
            platform: platform.id,
            connected: true,
            accountName: status.accountName,
            connectedAt: new Date().toISOString(),
          });
          setDemoMode((prev) => ({ ...prev, [platform.id]: false }));
        }
        if (status.demoMode) {
          setDemoMode((prev) => ({ ...prev, [platform.id]: true }));
        }
      });
    }
  }, [setSocialConnection]);

  const handleConnect = async (platform: SocialPlatform, linkedInAs?: "person" | "organization") => {
    if (platform === "linkedin") {
      window.location.href = linkedInOAuthUrl(linkedInAs ?? "organization");
      return;
    }

    setChecking(platform);
    const route = platform === "instagram" ? "meta" : platform;
    const status = await checkConnection(route);

    if (status.connected) {
      setSocialConnection({
        platform,
        connected: true,
        accountName: status.accountName,
        connectedAt: new Date().toISOString(),
      });
      setDemoMode((prev) => ({ ...prev, [platform]: false }));
    } else {
      setSocialConnection({
        platform,
        connected: true,
        accountName: "Demo Mode (simulated posting)",
        connectedAt: new Date().toISOString(),
      });
    }
    setChecking(null);
  };

  const handleLinkedInPostAs = async (postAs: "person" | "organization") => {
    if (linkedinDetails?.postAs === postAs) return;
    setSwitchingPostAs(true);
    const result = await setLinkedInPostAs(postAs);
    setSwitchingPostAs(false);
    if (!result.success) {
      setLinkedinMessage({
        type: "error",
        text: result.message ?? "Could not switch LinkedIn posting target.",
      });
      return;
    }
    setLinkedinDetails(result);
    setSocialConnection({
      platform: "linkedin",
      connected: true,
      accountName: result.accountName,
      connectedAt: new Date().toISOString(),
    });
    setLinkedinMessage({
      type: "success",
      text:
        postAs === "organization"
          ? `Posts will go to ${result.organizationName ?? "your company page"}.`
          : `Posts will go to your personal profile (${result.personName ?? "you"}).`,
    });
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    if (platform === "linkedin") {
      await fetch("/api/social/linkedin", { method: "DELETE" });
      setLinkedinMessage(null);
      setLinkedinDetails({ connected: false });
    }
    setSocialConnection({ platform, connected: false });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <FadeIn>
        <div>
          <Link
            href="/"
            className="mb-4 flex items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Command Center
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">Social Connections</h1>
          <p className="mt-2 text-secondary">
            Connect social accounts for direct posting. Without API credentials, demo mode simulates posts.
          </p>
        </div>
      </FadeIn>

      {linkedinMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-xl border p-4 ${
            linkedinMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <button
            onClick={() => setLinkedinMessage(null)}
            className="absolute right-3 top-3 rounded-lg p-1 text-secondary hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="pr-8 text-sm font-medium text-primary">
            {linkedinMessage.type === "success" ? "LinkedIn connected" : "LinkedIn connection failed"}
          </p>
          <p className="mt-1 pr-8 text-sm text-secondary">{linkedinMessage.text}</p>
        </motion.div>
      )}

      {!demoBannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl border border-accent/20 bg-accent/5 p-4"
        >
          <button
            onClick={() => setDemoBannerDismissed(true)}
            className="absolute right-3 top-3 rounded-lg p-1 text-secondary hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="pr-8 text-sm font-medium text-primary">Demo Mode</p>
          <p className="mt-1 pr-8 text-sm text-secondary">
            When API credentials are not configured, Approve & Post simulates successful posting.
            For LinkedIn live posting: add Client ID + Secret in .env.local, then click Connect.
          </p>
        </motion.div>
      )}

      <StaggerChildren className="space-y-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const connection = getSocialConnection(platform.id);
          const isConnected = connection?.connected;
          const isDemo = demoMode[platform.id];

          return (
            <StaggerItem key={platform.id}>
              <Card hover className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${platform.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{platform.label}</p>
                      {isConnected ? (
                        <p className="text-sm text-secondary">
                          {connection.accountName}
                          {isDemo && " · Demo mode"}
                        </p>
                      ) : (
                        <p className="text-sm text-secondary">Not connected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isConnected ? (
                      <>
                        <Badge variant="clear">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleDisconnect(platform.id)}>
                          Disconnect
                        </Button>
                      </>
                    ) : platform.id === "linkedin" ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => handleConnect("linkedin", "person")}>
                          Connect Personal
                        </Button>
                        <Button size="sm" onClick={() => handleConnect("linkedin", "organization")}>
                          Connect Company Page
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        disabled={checking === platform.id}
                      >
                        {checking === platform.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
                {platform.id === "linkedin" && isConnected && !isDemo && (
                  <div className="mt-3 rounded-lg bg-muted px-3 py-3">
                    <p className="text-xs font-medium text-primary">Post as</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={linkedinDetails?.postAs === "organization" ? "primary" : "secondary"}
                        disabled={switchingPostAs || !linkedinDetails?.organizationId}
                        onClick={() => handleLinkedInPostAs("organization")}
                      >
                        {switchingPostAs && linkedinDetails?.postAs !== "organization" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {linkedinDetails?.organizationName ?? "Company Page"}
                      </Button>
                      <Button
                        size="sm"
                        variant={linkedinDetails?.postAs === "person" ? "primary" : "secondary"}
                        disabled={switchingPostAs}
                        onClick={() => handleLinkedInPostAs("person")}
                      >
                        {switchingPostAs && linkedinDetails?.postAs !== "person" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {linkedinDetails?.personName
                          ? `${linkedinDetails.personName} (Personal)`
                          : "Personal Profile"}
                      </Button>
                    </div>
                    {!linkedinDetails?.organizationId && (
                      <p className="mt-2 text-xs text-secondary">
                        No company page on this connection. Use Connect Company Page after granting page admin
                        access, or set LINKEDIN_ORGANIZATION_ID.
                      </p>
                    )}
                  </div>
                )}
                {!isConnected && (
                  <div className="mt-3 rounded-lg bg-muted px-3 py-2">
                    <p className="font-mono text-xs text-secondary">
                      {platform.id === "linkedin"
                        ? "Connect Personal uses your profile (Share on LinkedIn). Connect Company Page needs Community Management API approved on the LinkedIn app."
                        : `Required env vars: ${platform.envVars.join(", ")}`}
                    </p>
                  </div>
                )}
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerChildren>

      <Card className="p-5">
        <h2 className="font-semibold text-primary">Approval Gate</h2>
        <p className="mt-2 text-sm text-secondary">
          Nothing is posted automatically. Every campaign requires you to click{" "}
          <strong className="text-primary">Approve & Post</strong> on the campaign detail page for each platform.
        </p>
        <Link href="/campaign/new" className="mt-4 inline-block">
          <Button variant="gold">Start New Campaign</Button>
        </Link>
      </Card>
    </div>
  );
}

export default function SocialSettingsPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl p-8">
          <p className="text-sm text-secondary">Loading social settings…</p>
        </div>
      }
    >
      <SocialSettingsPage />
    </Suspense>
  );
}
