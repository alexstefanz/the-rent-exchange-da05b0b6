import { z } from "zod";

/**
 * Strong password schema:
 * - min 8 chars
 * - at least one lowercase
 * - at least one uppercase
 * - at least one digit OR symbol
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Parola trebuie să aibă minim 8 caractere")
  .refine((v) => /[a-z]/.test(v), {
    message: "Trebuie să conțină cel puțin o literă mică",
  })
  .refine((v) => /[A-Z]/.test(v), {
    message: "Trebuie să conțină cel puțin o literă mare",
  })
  .refine((v) => /[0-9]/.test(v) || /[^A-Za-z0-9]/.test(v), {
    message: "Trebuie să conțină cel puțin o cifră sau un simbol",
  });

/** Returns the list of unmet requirements for live UX feedback. */
export const getPasswordStrengthHints = (value: string): string[] => {
  const hints: string[] = [];
  if (value.length < 8) hints.push("min. 8 caractere");
  if (!/[a-z]/.test(value)) hints.push("o literă mică");
  if (!/[A-Z]/.test(value)) hints.push("o literă mare");
  if (!/[0-9]/.test(value) && !/[^A-Za-z0-9]/.test(value))
    hints.push("o cifră sau un simbol");
  return hints;
};

/**
 * Detects whether an auth error message indicates a weak/compromised password
 * (e.g. Supabase HIBP rejection).
 */
export const isWeakPasswordError = (message: string | undefined): boolean => {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("weak") ||
    lower.includes("pwned") ||
    lower.includes("compromised") ||
    lower.includes("breach") ||
    lower.includes("easy to guess") ||
    lower.includes("known to be")
  );
};