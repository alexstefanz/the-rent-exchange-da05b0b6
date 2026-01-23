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
