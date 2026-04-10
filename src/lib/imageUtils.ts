/**
 * Supabase Storage image optimization via render/image transforms.
 *
 * Supabase exposes a `/render/image` endpoint that accepts `width`, `height`,
 * `quality`, and `resize` query params. We rewrite the standard `/object/public/`
 * URL to the render endpoint so the CDN serves a resized copy.
 *
 * Non-Supabase URLs are returned unchanged.
 */

const STORAGE_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export type ImageSize = "thumb" | "cardMobile" | "card" | "gallery" | "full";

const SIZE_PRESETS: Record<ImageSize, { width: number; quality: number } | null> = {
  /** Tiny previews (SeeAllCard, avatars in lists) */
  thumb: { width: 200, quality: 60 },
  /** Product cards on mobile screens */
  cardMobile: { width: 320, quality: 70 },
  /** Product cards, featured listings */
  card: { width: 480, quality: 75 },
  /** Gallery carousel (mobile + desktop) */
  gallery: { width: 960, quality: 80 },
  /** Full-size / lightbox — no transform */
  full: null,
};

/**
 * Returns an optimised image URL for Supabase-hosted images.
 *
 * @param url      Original public URL from Supabase Storage
 * @param size     Preset size name
 * @returns        Transformed URL (or original if not a Supabase URL / full size)
 */
export function getOptimizedImageUrl(url: string, size: ImageSize = "card"): string {
  if (!url) return url;

  const preset = SIZE_PRESETS[size];
  if (!preset) return url; // "full" → no transform

  // Only transform Supabase Storage URLs
  if (!url.includes(STORAGE_PATH)) return url;

  // Replace /object/public/ with /render/image/public/
  const renderUrl = url.replace(STORAGE_PATH, RENDER_PATH);

  // Strip any existing query string, then append transform params
  const base = renderUrl.split("?")[0];
  return `${base}?width=${preset.width}&quality=${preset.quality}&resize=contain`;
}
