/** Comma-separated list — use NEXT_PUBLIC_ALLOWED_EMAILS so middleware (Edge) can read it. */
export function getAllowedEmails(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? process.env.ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}
