"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { checkConnection } from "@/lib/social/client";
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

export default function SocialSettingsPage() {
  const { setSocialConnection, getSocialConnection } = useApp();
  const [checking, setChecking] = useState<SocialPlatform | null>(null);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [demoMode, setDemoMode] = useState<Record<SocialPlatform, boolean>>({
    linkedin: true,
    instagram: true,
    x: true,
    tiktok: true,
  });

  useEffect(() => {
    for (const platform of PLATFORMS) {
      checkConnection(platform.id === "instagram" ? "meta" : platform.id).then((status) => {
        if (status.connected) {
          setSocialConnection({
            platform: platform.id,
            connected: true,
            accountName: status.accountName,
            connectedAt: new Date().toISOString(),
          });
        }
        if ("demoMode" in status && status.demoMode) {
          setDemoMode((prev) => ({ ...prev, [platform.id]: true }));
        }
      });
    }
  }, [setSocialConnection]);

  const handleConnect = async (platform: SocialPlatform) => {
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

  const handleDisconnect = (platform: SocialPlatform) => {
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
            Add environment variables for live posting.
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
                  <div className="flex items-center gap-2">
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
                {!isConnected && (
                  <div className="mt-3 rounded-lg bg-muted px-3 py-2">
                    <p className="font-mono text-xs text-secondary">
                      Required env vars: {platform.envVars.join(", ")}
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
