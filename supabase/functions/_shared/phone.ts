/**
 * Normalize Romanian phone numbers to +40XXXXXXXXX (E.164).
 * Returns null if invalid. Single source of truth for all edge functions.
 */
export function normalizePhoneRO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const p = raw.trim().replace(/[\s()-]/g, "");
  if (!p) return null;
  if (/^\+40[0-9]{9}$/.test(p)) return p;
  if (/^0040[0-9]{9}$/.test(p)) return "+" + p.slice(2);
  if (/^40[0-9]{9}$/.test(p)) return "+" + p;
  if (/^0[0-9]{9}$/.test(p)) return "+40" + p.slice(1);
  return null;
}
