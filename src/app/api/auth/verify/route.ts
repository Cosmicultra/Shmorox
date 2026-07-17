import { NextResponse } from "next/server";
import { getAllowedEmails, isEmailAllowed } from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

/** After password login — verify session email is on ALLOWED_EMAILS. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ ok: false, reason: "no-session" }, { status: 401 });
  }

  if (getAllowedEmails().length === 0) {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: false, reason: "no-allowlist", email: user.email }, { status: 403 });
  }

  if (!isEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: false, reason: "not-allowed", email: user.email }, { status: 403 });
  }

  return NextResponse.json({ ok: true, email: user.email });
}
