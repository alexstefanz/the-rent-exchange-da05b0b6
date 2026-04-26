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
  
  // Phone: 7+ digits with optional separators
  if (/(\+?\d[\d\s\-().]{6,}\d)/.test(text)) return 'phone';
  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return 'email';
  // URLs: protocols, www, or common TLDs followed by path
  if (/(https?:\/\/|www\.)|(\.[a-z]{2,4}\/)/i.test(text)) return 'url';
  
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
