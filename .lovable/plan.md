

## Plan: Add Database Indexes for Performance Optimization

### Analysis

After comparing query patterns in the codebase against existing indexes, several high-traffic tables are missing critical indexes. The **products** table is well-indexed, but **rentals**, **notifications**, **product_reviews**, **profiles**, **transactions**, and **support_tickets** have only primary key indexes despite being frequently queried with filters.

### Missing Indexes by Table

**rentals** (most critical -- used in dashboard, admin, booked dates):
- `renter_id` -- dashboard "my rentals"
- `owner_id` -- dashboard "my lendings" + requests
- `product_id` -- booked dates lookup
- `status` -- filtered by status everywhere
- `(product_id, status)` -- composite for `get_booked_dates` function
- `created_at DESC` -- ordering

**notifications**:
- `user_id` -- every user fetches their own
- `(user_id, is_read)` -- unread count query

**product_reviews**:
- `product_id` -- product detail page reviews
- `reviewer_id` -- user's own reviews

**profiles**:
- `full_name` using `gin_trgm_ops` -- user search (ILIKE queries)

**transactions**:
- `user_id` -- earnings page
- `rental_id` -- rental detail lookups

**support_tickets**:
- `user_id` -- user's own tickets
- `status` -- admin filtering

### Migration

A single migration will add ~15 indexes using `CREATE INDEX IF NOT EXISTS` and `CONCURRENTLY` where possible. All indexes are non-destructive (no schema changes, no data changes).

### Technical Details

```text
Tables affected:     6
Indexes to add:     ~15
Risk:               Zero (additive only, IF NOT EXISTS)
Downtime:           None
```

