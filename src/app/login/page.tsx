"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input } from "@/components/ui";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-env":
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, save, and restart the dev server.",
  "not-allowed":
    "Access denied. This email is not on the team allowlist. Ask the app owner to add you to NEXT_PUBLIC_ALLOWED_EMAILS.",
  "no-allowlist":
    "No allowed emails configured. Add NEXT_PUBLIC_ALLOWED_EMAILS to .env.local and restart the dev server.",
  auth: "Sign-in failed. Check your email and password, or ask the app owner to create your account in Supabase.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const verify = await fetch("/api/auth/verify");
    const result = await verify.json();

    if (!result.ok) {
      if (result.reason === "not-allowed") {
        setError(
          `Access denied for "${result.email}". Add this exact email to NEXT_PUBLIC_ALLOWED_EMAILS in .env.local, save, and restart the dev server.`
        );
      } else if (result.reason === "no-allowlist") {
        setError("NEXT_PUBLIC_ALLOWED_EMAILS is not set in .env.local. Add your team emails and restart the dev server.");
      } else {
        setError("Sign-in could not be verified. Try again.");
      }
      return;
    }

    router.push("/");
    router.refresh();
  };

  const bannerMessage = setupError ? ERROR_MESSAGES[setupError] : null;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <Card className="w-full p-6">
        <h1 className="text-2xl font-bold text-primary">Sign in</h1>
        <p className="mt-2 text-sm text-secondary">
          Use the email and password your team admin created for you in Supabase.
        </p>

        {bannerMessage && (
          <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{bannerMessage}</p>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
          <Card className="w-full p-6">
            <p className="text-sm text-secondary">Loading…</p>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
