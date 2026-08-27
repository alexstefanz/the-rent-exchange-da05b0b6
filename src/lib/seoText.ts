/**
 * Helpers for building clean <head> metadata strings.
 * Titles should stay <= 60 chars, descriptions <= 155 chars.
 */

export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

/** Collapse whitespace and strip control characters. */
export const normalizeMetaText = (raw: string | null | undefined): string =>
  (raw || "").replace(/\s+/g, " ").trim();

/**
 * Truncate without cutting a word in half. Adds an ellipsis only when it
 * actually had to cut something.
 */
export const truncateForMeta = (raw: string | null | undefined, max: number): string => {
  const text = normalizeMetaText(raw);
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
  return `${base.replace(/[\s,;:.–—-]+$/, "")}…`;
};

const GREETING_PREFIX =
  /^(bun[ăa]\s*ziua|bun[ăa]|salut(are)?|hei|hey|hello|hi|ceau|servus|noroc)[\s,!.:-]+/i;

const FILLER_PREFIX =
  /^(ofer\s+spre\s+[îi]nchiriere|[îi]nchiriez|dau\s+spre\s+[îi]nchiriere|de\s+[îi]nchiriat|for\s+rent|renting\s+out|i\s+rent\s+out)[\s,!.:-]*/i;

/**
 * Clean a user-written listing description so it reads well in a SERP snippet:
 * strips greetings/filler openers, contact-ish noise and collapses whitespace.
 */
export const cleanUserDescription = (raw: string | null | undefined): string => {
  let text = normalizeMetaText(raw);
  if (!text) return "";
  // Strip markdown/bullet artifacts and repeated punctuation
  text = text.replace(/[*_#>`]+/g, " ").replace(/\s+/g, " ").trim();
  let previous = "";
  while (previous !== text) {
    previous = text;
    text = text.replace(GREETING_PREFIX, "").replace(FILLER_PREFIX, "").trim();
  }
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Join non-empty parts with a separator, then truncate. */
export const buildMeta = (parts: (string | null | undefined)[], max: number, separator = " "): string =>
  truncateForMeta(parts.filter(Boolean).join(separator), max);
