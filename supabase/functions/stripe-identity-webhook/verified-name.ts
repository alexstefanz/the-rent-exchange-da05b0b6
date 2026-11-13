/** Build a display-ready legal name from Stripe Identity verified_outputs. */
export function verifiedFullName(out: { first_name?: string | null; last_name?: string | null } | null | undefined): string | null {
  if (!out) return null;
  const cap = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, " ")
      .replace(/(^|[\s-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
  const parts = [out.first_name, out.last_name].filter((x): x is string => !!x && !!x.trim()).map(cap);
  const name = parts.join(" ").trim();
  return name.length >= 2 ? name : null;
}
