Make Discovery Rails react to the gallery/list view toggle on CategoryDetail.

**1. `src/components/category/DiscoveryRails.tsx`**
- Add optional `viewMode?: "gallery" | "list"` prop to `Rail`, `DiscoveryRailsTop`, `DiscoveryRailsBottom`, and the default `DiscoveryRails` export.
- When `viewMode === "list"`: render the section as a vertical stack instead of an Embla carousel:
  - Replace the carousel block with `<div className="flex flex-col gap-4">` mapping `<ProductCard product={p} viewMode="list" />`.
  - Hide the prev/next buttons in the header for list mode.
- When `viewMode === "gallery"` (default): keep the existing Embla carousel behavior unchanged.

**2. `src/pages/CategoryDetail.tsx`**
- Pass `viewMode={viewMode}` to both `<DiscoveryRailsTop … />` and `<DiscoveryRailsBottom … />`.

No data, API, or other UI changes.