import { NextResponse } from "next/server";
import { isEmailAllowed, getAllowedEmails } from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (getAllowedEmails().length === 0) {
    return NextResponse.redirect(`${origin}/login?error=no-allowlist`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (!isEmailAllowed(data.user.email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not-allowed`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
