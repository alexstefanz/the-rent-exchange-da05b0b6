// Input validation utilities for security

/**
 * Sanitizes search input for safe use in SQL ILIKE queries
 * - Trims whitespace
 * - Limits length to prevent DoS
 * - Escapes SQL wildcards (%, _)
 */
export const sanitizeSearchInput = (input: string, maxLength: number = 100): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
};

/**
 * Validates that a string is within acceptable length bounds
 */
export const isValidLength = (input: string, minLength: number = 0, maxLength: number = 1000): boolean => {
  if (!input || typeof input !== 'string') {
    return minLength === 0;
  }
  const length = input.trim().length;
  return length >= minLength && length <= maxLength;
};

/**
 * Sanitizes text input for general use
 * - Trims whitespace
 * - Removes control characters
 * - Limits length
 */
export const sanitizeTextInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength);
};

/**
 * Normalizes Romanian diacritics to ASCII equivalents for search matching
 * ă/â → a, î → i, ș → s, ț → t
 */
/**
 * Checks if text contains contact information (phone, email, URLs)
 * Returns the type of contact info found, or null if clean
 */
export const containsContactInfo = (text: string): 'phone' | 'email' | 'url' | null => {
  if (!text || typeof text !== 'string') return null;

  // Email — specific, low false-positive
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return 'email';

  // URL — require a real domain with a known TLD (optional protocol / www)
  const tld = '(?:ro|com|net|org|eu|io|co|uk|de|fr|it|es|info|biz|shop|store|online|app|dev)';
  const urlRe = new RegExp(
    `(?:https?:\\/\\/|www\\.)[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.[a-z]{2,}|\\b[a-z0-9-]{2,}\\.${tld}\\b(?:\\/[\\w\\-./?=&%#]*)?`,
    'i'
  );
  if (urlRe.test(text)) return 'url';

  // Phone — candidate must be at least 9 real digits to be plausible.
  // Avoids matching dimensions like "125 x 63.5 x 40 mm" or "60 g".
  const phoneCandidate = /(?:\+?\d[\d\s\-().]{7,}\d)/g;
  let match: RegExpExecArray | null;
  while ((match = phoneCandidate.exec(text)) !== null) {
    const digitsOnly = match[0].replace(/\D/g, '');
    if (digitsOnly.length >= 9 && digitsOnly.length <= 15) return 'phone';
  }

  return null;
};

/**
 * Normalizes Romanian diacritics to ASCII equivalents for search matching
 * ă/â → a, î → i, ș → s, ț → t
 */
export const normalizeDiacritics = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/[ăâ]/gi, (match) => match.toLowerCase() === match ? 'a' : 'A')
    .replace(/[î]/gi, (match) => match.toLowerCase() === match ? 'i' : 'I')
    .replace(/[șş]/gi, (match) => match.toLowerCase() === match ? 's' : 'S')
    .replace(/[țţ]/gi, (match) => match.toLowerCase() === match ? 't' : 'T');
};

/**
 * Validates a Romanian phone number. Accepted formats (after stripping spaces, dashes, parens):
 *  - +40XXXXXXXXX
 *  - 0040XXXXXXXXX
 *  - 40XXXXXXXXX
 *  - 0XXXXXXXXX
 * Returns true only when the number can be normalized to a valid mobile/landline RO number.
 */
export const isValidRomanianPhone = (raw: string | null | undefined): boolean => {
  if (!raw || typeof raw !== 'string') return false;
  const p = raw.trim().replace(/[\s()\-]/g, '');
  if (!p) return false;
  return (
    /^\+40[0-9]{9}$/.test(p) ||
    /^0040[0-9]{9}$/.test(p) ||
    /^40[0-9]{9}$/.test(p) ||
    /^0[0-9]{9}$/.test(p)
  );
};
