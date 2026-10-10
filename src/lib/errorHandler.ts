// Secure error handler to prevent information leakage

export interface SafeError {
  message: string;
  code?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This item already exists',
  '23503': 'Referenced item not found',
  '42501': 'Permission denied',
  'PGRST116': 'No data found',
  'invalid_credentials': 'Invalid email or password',
  'user_already_exists': 'An account with this email already exists',
  'email_not_confirmed': 'Please confirm your email address',
};

export const getSecureErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred';
  
  const err = error as { code?: string; message?: string };
  
  // Check for known error codes
  if (err.code && ERROR_MESSAGES[err.code]) {
    return ERROR_MESSAGES[err.code];
  }
  
  // Check for auth-specific error messages
  if (err.message) {
    if (err.message.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (err.message.includes('User already registered')) {
      return 'An account with this email already exists';
    }
    if (err.message.includes('Email not confirmed')) {
      return 'Please confirm your email address';
    }
  }
  
  return 'An error occurred. Please try again.';
};

export const logSecureError = (context: string, error: unknown): void => {
  // Only log detailed errors in development
  if (import.meta.env.DEV) {
    console.error(`[DEV] ${context}:`, error);
  }
  // In production, we would send to an error monitoring service
  // e.g., Sentry, LogRocket, etc.
};

export const handleApiError = (context: string, error: unknown): never => {
  logSecureError(context, error);
  throw new Error(getSecureErrorMessage(error));
};

/**
 * Patterns whose error messages should be silently swallowed in the UI.
 * They're non-actionable for the user (already-applied state, harmless
 * trigger races, etc.). We still log them in dev.
 */
const SUPPRESS_PATTERNS: RegExp[] = [
  /Owner signature is already captured/i,
  /Renter signature is already captured/i,
  /Owners can only set rental status to cancelled/i,
];

/**
 * Map technical/DB error fragments to friendly Romanian messages.
 */
const FRIENDLY_MAP: Array<{ test: RegExp; title: string; message: string }> = [
  {
    test: /has no field "?deposit_amount"?/i,
    title: "Nu am putut salva sumele",
    message:
      "A apărut o problemă temporară la salvarea datelor. Te rugăm să încerci din nou peste câteva secunde.",
  },
  {
    test: /duplicate key value|already exists/i,
    title: "Există deja",
    message: "Această înregistrare există deja.",
  },
  {
    test: /permission denied|not authorized/i,
    title: "Acces restricționat",
    message: "Nu ai permisiunea necesară pentru această acțiune.",
  },
];

export interface FriendlyError {
  suppress: boolean;
  title: string;
  message: string;
}

export function toFriendlyError(error: unknown, fallbackTitle = "Ceva nu a mers"): FriendlyError {
  const raw = ((error as any)?.message ?? String(error ?? "")).toString();
  if (!raw) return { suppress: false, title: fallbackTitle, message: "A apărut o eroare." };
  if (SUPPRESS_PATTERNS.some((re) => re.test(raw))) {
    return { suppress: true, title: fallbackTitle, message: raw };
  }
  for (const m of FRIENDLY_MAP) {
    if (m.test.test(raw)) return { suppress: false, title: m.title, message: m.message };
  }
  return { suppress: false, title: fallbackTitle, message: getSecureErrorMessage(error) };
}
