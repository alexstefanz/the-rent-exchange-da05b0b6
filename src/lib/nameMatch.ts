/**
 * Compare the user-declared name (profile.full_name) with the OCR-extracted
 * name from the ID card. Names are normalized (uppercased, diacritics removed,
 * non-letters stripped, words sorted) so that "ION POPESCU" matches
 * "POPESCU ION" or "Ion-Popescu".
 */
export function normalizeName(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .sort()
    .join(" ")
    .trim();
}

export type NameMatchStatus = "match" | "mismatch" | "missing";

export function compareNames(
  declared: string | null | undefined,
  extracted: string | null | undefined,
): NameMatchStatus {
  const a = normalizeName(declared);
  const b = normalizeName(extracted);
  if (!a || !b) return "missing";
  return a === b ? "match" : "mismatch";
}