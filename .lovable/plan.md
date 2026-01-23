
# Security Hardening Plan for RentNow Marketplace

## Executive Summary

This security audit identified several areas requiring attention to prepare the application for production scale (1000+ concurrent users). The current implementation has a solid foundation with Row-Level Security (RLS) enabled on all tables, but requires hardening in several areas.

---

## 1. Supabase Keys and Execution Context

### Current Status: PASS with Notes

**Findings:**
- Client code correctly uses only the **anon public key** (`VITE_SUPABASE_PUBLISHABLE_KEY`)
- No service role key is exposed in client-side code
- The `.env` file contains only publishable keys (safe to expose)

**Key Usage Map:**
| Key | Location | Purpose |
|-----|----------|---------|
| `VITE_SUPABASE_URL` | `.env`, client | API endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env`, client | Anonymous authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend secrets only | Never exposed to client |

**Recommendations:**
- No edge functions exist currently. If admin operations are needed in the future, create edge functions that use the service role key server-side
- Consider removing the `/debug-supabase` route in production as it exposes environment variable status

---

## 2. Database Tables and RLS Analysis

### 2.1 All Tables in Public Schema (7 total)

| Table | RLS Enabled | Status |
|-------|-------------|--------|
| `profiles` | Yes | Needs enhancement |
| `products` | Yes | Needs minor fix |
| `conversations` | Yes | Good |
| `messages` | Yes | Good |
| `favorite_users` | Yes | Good |
| `user_reviews` | Yes | Good |
| `product_reviews` | Yes | Good |

---

### 2.2 Detailed Policy Analysis by Table

#### A) `profiles` Table

**Current Policies:**
- SELECT: `auth.uid() = id` (users see only own profile)
- INSERT: `auth.uid() = id`
- UPDATE: `auth.uid() = id`
- DELETE: Not allowed (good)

**Issue:** The app uses secure RPC functions (`get_product_owner_public_info`, `get_contact_info_if_in_conversation`) to safely expose limited profile data. This is the correct approach.

**Recommendation:** Keep current restrictive policies. The RPC functions handle public data exposure safely.

#### B) `products` Table (Listings)

**Current Policies:**
- SELECT: `is_active = true` (anyone can view active) + `auth.uid() = owner_id` (owners see all their products)
- INSERT: `auth.uid() = owner_id`
- UPDATE: `auth.uid() = owner_id`
- DELETE: `auth.uid() = owner_id`

**Issues Found:**
1. No WITH CHECK on UPDATE to prevent reassigning `owner_id` to another user
2. The INSERT policy correctly enforces `owner_id = auth.uid()`, preventing assignment to others

**Recommendation:** Add WITH CHECK constraint to UPDATE policy to prevent owner_id tampering

**SQL Fix:**
```sql
-- Drop and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Owners can update their own products" ON public.products;

CREATE POLICY "Owners can update their own products"
ON public.products
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
```

#### C) `conversations` Table

**Current Policies:**
- SELECT: `buyer_id = auth.uid() OR owner_id = auth.uid()` - Good
- INSERT: `buyer_id = auth.uid()` - Good (only buyer can create)
- UPDATE: Participants only with proper checks - Good
- DELETE: Not allowed - Good

**Status:** Secure. No changes needed.

#### D) `messages` Table

**Current Policies:**
- SELECT: Conversation participants only via subquery - Good
- INSERT: `sender_id = auth.uid()` AND must be conversation participant - Good
- UPDATE: Can only mark received messages as read (not own messages) - Good
- DELETE: Not allowed - This is a design choice (message history preserved)

**Status:** Secure. No changes needed.

#### E) `favorite_users` Table

**Current Policies:**
- SELECT: `user_id = auth.uid()` - Good
- INSERT: `user_id = auth.uid()` - Good
- DELETE: `user_id = auth.uid()` - Good
- UPDATE: Not allowed - Good

**Status:** Secure. No changes needed.

#### F) `user_reviews` and `product_reviews` Tables

**Current Policies:**
- SELECT: `true` (anyone can read) - Appropriate for reviews
- INSERT: `reviewer_id = auth.uid()` - Good
- UPDATE: `reviewer_id = auth.uid()` - Good
- DELETE: `reviewer_id = auth.uid()` - Good

**Issue:** Missing WITH CHECK on INSERT to prevent creating reviews as another user.

**SQL Fix:**
```sql
-- user_reviews: Add WITH CHECK to ensure reviewer_id matches
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.user_reviews;

CREATE POLICY "Authenticated users can create reviews"
ON public.user_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- product_reviews: Same fix
DROP POLICY IF EXISTS "Authenticated users can create product reviews" ON public.product_reviews;

CREATE POLICY "Authenticated users can create product reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);
```

---

### 2.3 Missing Functionality: Role-Based Access Control

**Finding:** The application has no admin/moderator role system.

**Recommendation:** If admin functionality is needed in the future, implement using this pattern:

```sql
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator');

-- Create separate roles table (NOT on profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Example admin policy
CREATE POLICY "Admins can view all users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

## 3. Supabase Storage Security

### Current Status: NEEDS ATTENTION

**Bucket Analysis:**
| Bucket | Public | Status |
|--------|--------|--------|
| `product-images` | Yes | By design - product images are public |

**Current Storage Policies:**
- INSERT: Users can upload to their own folder (`auth.uid() = folder[1]`) - Good
- UPDATE: Users can update their own files - Good
- DELETE: Users can delete their own files - Good
- SELECT: Users can view their own OR images from active products - Good

**Issue:** The bucket is public, which means anyone with the URL can access images. This is intentional for product images but has implications:
- Deleted/inactive product images remain accessible if URL is known
- Consider implementing signed URLs for sensitive content in the future

**Recommendation:** Current setup is appropriate for product images. If user avatars or sensitive documents are added later, create a separate private bucket.

---

## 4. Authentication Enforcement

### Current Status: NEEDS IMPROVEMENT

**Findings:**

1. **Auto-confirm is enabled** (inferred from lack of email verification errors) - This should be reviewed
2. **No email verification before posting** - Users can immediately post products

**Recommendations:**

```sql
-- Add email_confirmed check to product creation
-- Note: This requires storing email_confirmed status or checking via RPC

CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT email_confirmed_at IS NOT NULL 
     FROM auth.users 
     WHERE id = auth.uid()),
    false
  )
$$;

-- Update products INSERT policy (if email verification is required)
DROP POLICY IF EXISTS "Owners can insert their own products" ON public.products;

CREATE POLICY "Verified users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id 
  AND public.is_email_verified()
);
```

**Note:** If auto-confirm is intentionally enabled for UX reasons, skip this recommendation.

---

## 5. Abuse and Load Protection

### Current Status: NOT IMPLEMENTED

**Recommendations:**

1. **Enable Leaked Password Protection**
   - This is flagged by the security linter
   - Enable via backend settings to check passwords against known breaches

2. **Rate Limiting** (requires edge functions):
   - Create edge functions for sensitive operations
   - Implement rate limiting logic

3. **CAPTCHA for Sign-up/Reset**
   - Integrate hCaptcha or Cloudflare Turnstile
   - Requires frontend changes and edge function validation

4. **Input Validation** - Already partially implemented:
   - `sanitizeSearchInput` function exists
   - Zod validation on forms
   - Database CHECK constraints for lengths

**Priority Actions:**
- Enable leaked password protection (simple toggle)
- Add rate limiting to messaging (prevent spam)

---

## 6. Security Matrix and Testing

### 6.1 Table-by-Table Access Matrix

| Table | Anonymous | Authenticated (Own) | Authenticated (Other) | Admin |
|-------|-----------|--------------------|-----------------------|-------|
| `profiles` | No access | Full CRUD | Via RPC only (name/avatar) | N/A |
| `products` | Read active | Full CRUD own | Read active | N/A |
| `conversations` | No access | Read/Create/Update own | No access | N/A |
| `messages` | No access | Read/Send in own convos | No access | N/A |
| `favorite_users` | No access | Full CRUD own | No access | N/A |
| `user_reviews` | Read all | Create/Update/Delete own | Read all | N/A |
| `product_reviews` | Read all | Create/Update/Delete own | Read all | N/A |

### 6.2 Manual Test Instructions

**Test 1: Anonymous User Access**
```javascript
// From browser console (not logged in)
const { data, error } = await supabase.from('profiles').select('*');
// Expected: Empty array or error (RLS blocks)

const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
// Expected: Returns active products only
```

**Test 2: User A vs User B Access**
```javascript
// As User A, try to read User B's favorites
const { data } = await supabase.from('favorite_users').select('*').eq('user_id', 'USER_B_ID');
// Expected: Empty array (RLS blocks)

// As User A, try to update User B's product
const { error } = await supabase.from('products').update({ title: 'Hacked' }).eq('owner_id', 'USER_B_ID');
// Expected: Error or no rows affected
```

**Test 3: Message Privacy**
```javascript
// As User A (not in conversation), try to read messages
const { data } = await supabase.from('messages').select('*').eq('conversation_id', 'CONVERSATION_ID');
// Expected: Empty array (RLS blocks non-participants)
```

---

## 7. Implementation Priority

### Critical (Do Now)
1. Enable leaked password protection
2. Add WITH CHECK to products UPDATE policy
3. Remove or protect `/debug-supabase` route

### High (Before Production)
1. Add WITH CHECK to review INSERT policies
2. Implement rate limiting for messaging
3. Add CAPTCHA to authentication

### Medium (After Launch)
1. Implement role-based access if needed
2. Add email verification requirement for listings
3. Create private storage bucket for sensitive files

---

## 8. Summary of SQL Changes Required

```sql
-- 1. Fix products UPDATE policy
DROP POLICY IF EXISTS "Owners can update their own products" ON public.products;
CREATE POLICY "Owners can update their own products"
ON public.products FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 2. Fix user_reviews INSERT policy  
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.user_reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.user_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- 3. Fix product_reviews INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create product reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create product reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);
```

---

## 9. Code Changes Required

1. **Remove or protect DebugSupabase route** - This page reveals environment configuration and should not be in production

2. **Add email verification flow** (optional) - If requiring verified emails before posting

---

## Conclusion

The application has a solid security foundation with RLS enabled on all tables and proper use of SECURITY DEFINER functions for cross-table data access. The main improvements needed are:

1. Policy refinements to prevent edge-case tampering
2. Enabling built-in security features (leaked password protection)
3. Removing debug tooling from production
4. Adding rate limiting for abuse prevention

After implementing these changes, the application will be well-prepared for production scale.
