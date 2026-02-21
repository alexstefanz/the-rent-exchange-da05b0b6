/**
 * Generate a URL-friendly slug from a title string.
 * Used client-side to build product URLs from title text.
 */
export const generateSlug = (title: string): string => {
  let slug = title.toLowerCase();
  // Replace Romanian diacritics
  slug = slug.replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
    .replace(/ș/g, 's').replace(/ț/g, 't').replace(/ş/g, 's').replace(/ţ/g, 't');
  // Replace non-alphanumeric with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  // Limit length
  return slug.slice(0, 80);
};

/**
 * Build a product URL using slug if available, otherwise generate from title.
 */
export const getProductUrl = (product: { slug?: string | null; id: string; title: string }): string => {
  const slug = product.slug || generateSlug(product.title);
  return `/produs/${slug}`;
};

/**
 * Build a product URL from title and id when only those are available (e.g. from rental data).
 * Appends a short id suffix for uniqueness.
 */
export const getProductUrlFromTitle = (title: string, productId: string): string => {
  const slug = generateSlug(title);
  // Append first 8 chars of UUID for uniqueness
  return `/produs/${slug}-${productId.slice(0, 8)}`;
};
