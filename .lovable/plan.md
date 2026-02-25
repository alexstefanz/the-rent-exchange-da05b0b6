

## Plan: Favorite Button — Styling + Functional Wiring

### Problem
1. Favorite button on homepage cards does nothing (empty `onClick` handler)
2. Favorite button styling needs to change: green background (`#46B95B`) with white heart icon (`#FFFFFF`)
3. Same styling update needed on `ProductCard` component

### Changes

#### 1. `src/components/home/FeaturedListings.tsx`
- Import `useAuth` from AuthContext, `addFavoriteProduct`, `removeFavoriteProduct` from favoriteProductsApi, `toast`, and `useState`
- Track favorite state per product using a `Set<string>` state in `ProductRow`
- On click: if not logged in, show toast prompting login; if logged in, toggle favorite via API
- Change button styling: `bg-[#46B95B]` instead of `bg-black/10`, heart icon always white, filled white when favorited
- Apply same green background styling to verified badge: `bg-[#46B95B]` with white `CheckCircle`

#### 2. `src/components/products/ProductCard.tsx`
- Import `useAuth`, `addFavoriteProduct`, `removeFavoriteProduct`, `isProductFavorite`, `toast`
- On mount (if logged in), check if product is favorited via `isProductFavorite`
- Wire `handleFavoriteClick` to call API (add/remove)
- Update button styling to match: green `bg-[#46B95B]`, white heart icon
- Update verified badge to green background with white icon

#### Styling (both files)
- Verified badge: `bg-[#46B95B]` with `text-white` CheckCircle
- Favorite button: `bg-[#46B95B] hover:bg-[#3da550]` with white Heart icon (filled white when active)

