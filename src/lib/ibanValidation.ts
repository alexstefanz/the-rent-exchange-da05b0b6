/**
 * Validates a Romanian IBAN using ISO 13616 mod-97 checksum.
 * Accepts spaces; returns true only for valid RO IBANs (24 chars).
 */
export function isValidRomanianIban(input: string | null | undefined): boolean {
  if (!input || typeof input !== "string") return false;
  const iban = input.replace(/\s+/g, "").toUpperCase();
  if (!/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  // Convert letters to numbers (A=10..Z=35)
  const numeric = rearranged.replace(/[A-Z]/g, (ch) =>
    String(ch.charCodeAt(0) - 55)
  );

  // Compute mod 97 piecewise (BigInt would also work)
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const block = String(remainder) + numeric.slice(i, i + 7);
    remainder = Number(block) % 97;
  }
  return remainder === 1;
}

export function formatIban(input: string): string {
  const clean = input.replace(/\s+/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}