

## Plan: Restrict Review Form to Completed Transactions

**Current behavior**: The review form shows for any logged-in user who isn't the product owner. Reviews are also hidden entirely when `isOwnProduct` is true (the section renders but the owner can't see reviews from others properly).

**Desired behavior**:
1. Reviews section is always visible (including for the owner)
2. The "Add a review" form only appears if the current user has a **completed rental** (`status = 'completed'`) for this product

### Changes

**File: `src/components/product/ProductReviewsSection.tsx`**

1. Add a `hasCompletedRental` state, initially `false`
2. On mount (when `user` exists and `!isOwnProduct`), query the `rentals` table to check if there's a completed rental where `renter_id = user.id` and `product_id = productId` and `status = 'completed'`
3. Change the form visibility condition from `user && !isOwnProduct` to `user && !isOwnProduct && hasCompletedRental`
4. Optionally show a small info message when user is logged in, not owner, but has no completed rental: "Poți lăsa o recenzie după finalizarea unei închirieri"

### Technical detail

```tsx
// New check inside useEffect
const checkEligibility = async () => {
  if (!user || isOwnProduct) return;
  const { count } = await supabase
    .from("rentals")
    .select("id", { count: "exact", head: true })
    .eq("renter_id", user.id)
    .eq("product_id", productId)
    .eq("status", "completed");
  setHasCompletedRental((count || 0) > 0);
};
```

### Files changed
- `src/components/product/ProductReviewsSection.tsx` (add eligibility check, update form condition)

