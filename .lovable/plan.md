

## Plan: Add Location Above Product Title

Add the product location with a MapPin icon above the title in the booking sidebar, for both mobile and desktop views.

### File: `src/pages/ProductDetail.tsx`

**Before the mobile title (line 260)**, insert:
```tsx
<div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 lg:hidden">
  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
  <span>{location}</span>
</div>
```

**Before the desktop title (line 264)**, insert:
```tsx
<div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
  <span>{location}</span>
</div>
```

`MapPin` is already imported. `location` is already defined as `product.location_city || "România"`.

### Files changed
- `src/pages/ProductDetail.tsx` (2 small insertions)

