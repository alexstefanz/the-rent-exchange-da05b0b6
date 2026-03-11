

## Plan: Fix browser back navigation on Auth page

### Problem
When navigating to `/auth` (e.g., from protected pages or directly), pressing the browser back button doesn't work because:
1. Most redirects to `/auth` use `navigate("/auth")` without `replace: true`, pushing multiple `/auth` entries into history
2. On login success, `navigate("/")` pushes instead of replacing, creating back-button loops

### Changes

**1. `src/pages/Auth.tsx`**
- Line 117: Change `navigate("/")` to `navigate("/", { replace: true })` so the auth page is replaced in history on auto-redirect
- Line 132: Change `navigate("/")` to `navigate("/", { replace: true })` on login success
- Add a visible back button or ensure the browser back works by not replacing the entry when the user navigated there intentionally

**2. All files that redirect to `/auth`** -- Add `replace: true` to prevent stacking auth entries:
- `src/pages/Owner.tsx` (line 34)
- `src/pages/ProductDetail.tsx` (lines 92, 139)
- `src/pages/ListItem.tsx` (line 38)
- `src/pages/UserTickets.tsx` (line 53)
- `src/pages/EditProduct.tsx` (line 64)
- `src/pages/NewProduct.tsx` (line 59)
- `src/pages/Messages.tsx` (line 35)
- `src/pages/Profile.tsx` (line 97)

All these will change from `navigate("/auth")` to `navigate("/auth", { replace: true })` so pressing back from `/auth` goes to the page before the protected page, not back into a redirect loop.

### Files affected
- `src/pages/Auth.tsx`
- `src/pages/Owner.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/ListItem.tsx`
- `src/pages/UserTickets.tsx`
- `src/pages/EditProduct.tsx`
- `src/pages/NewProduct.tsx`
- `src/pages/Messages.tsx`
- `src/pages/Profile.tsx`

