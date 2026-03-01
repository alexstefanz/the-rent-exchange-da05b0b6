

## Plan: Active Reviews Section with Tabs and Multi-Criteria Ratings

### Database Changes

Alter `product_reviews` table to support multi-criteria ratings and review types:

- Add `rating_product_condition` (integer, 1-5, nullable) -- Stare produs
- Add `rating_communication` (integer, 1-5, nullable) -- Comunicare
- Add `rating_punctuality` (integer, 1-5, nullable) -- Punctualitate
- Add `review_type` (text, default 'owner') -- 'owner' for owner reviews, 'renter' for renter reviews
- Keep existing `rating` as the overall average
- Keep existing `comment` as the "alte detalii" text field

### New Component: `src/components/product/ProductReviewsSection.tsx`

A self-contained reviews component with:

- **Tabs** using the existing Tabs UI component: "Recenzii proprietar" and "Recenzii chiriaș"
- **Review list** per tab showing: avatar, name, date, 3 star-rating rows (Stare produs, Comunicare, Punctualitate), and comment text
- **Empty state** per tab: "Nu există recenzii momentan"
- **Add review form** (visible to authenticated users who are not the product owner): 3 star-rating selectors + textarea for "Alte detalii" + submit button
- Average rating display in the header

### New API: `src/features/products/productReviewsApi.ts`

- `getProductReviews(productId)` -- fetches reviews with reviewer profile info, returns separated by type
- `createProductReview(productId, reviewType, ratings, comment)` -- inserts review with all rating fields
- Computes `rating` as average of the 3 sub-ratings

### Changes to `src/pages/ProductDetail.tsx`

- Remove hardcoded `reviews` array at the top
- Remove the old static reviews section (lines 250-273)
- Replace with `<ProductReviewsSection productId={product.id} isOwnProduct={user?.id === product.owner_id} />`

### Review Form Behavior

- 3 rows of clickable stars for each criterion
- Textarea for optional comment ("Alte detalii")
- Submit button disabled until all 3 ratings are selected
- After submit: toast confirmation, form resets, list refreshes
- Only authenticated non-owner users see the form

