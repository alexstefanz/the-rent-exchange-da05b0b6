
-- =============================================
-- 1. PROFILES: Add ban columns
-- =============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS banned_by uuid,
  ADD COLUMN IF NOT EXISTS ban_reason text;

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any profile (for banning)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. PRODUCTS: Add flagging columns + admin policies
-- =============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS admin_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text;

-- Admin can view all products (including inactive)
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any product
CREATE POLICY "Admins can update all products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any product
CREATE POLICY "Admins can delete all products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. SUPPORT TICKETS
-- =============================================
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  related_rental_id uuid,
  related_product_id uuid,
  assigned_to uuid,
  admin_notes text,
  resolution text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can update any ticket
CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- =============================================
-- 4. PLATFORM CATEGORIES
-- =============================================
CREATE TABLE public.platform_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories" ON public.platform_categories
  FOR SELECT USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON public.platform_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.platform_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.platform_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_en text,
  description text,
  description_en text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_subcategories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active subcategories
CREATE POLICY "Anyone can view active subcategories" ON public.platform_subcategories
  FOR SELECT USING (is_active = true);

-- Admins can manage subcategories
CREATE POLICY "Admins can manage subcategories" ON public.platform_subcategories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at for categories
CREATE OR REPLACE FUNCTION public.update_platform_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_platform_categories_updated_at
  BEFORE UPDATE ON public.platform_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_categories_updated_at();

-- =============================================
-- 5. RPC: get_admin_products
-- =============================================
CREATE OR REPLACE FUNCTION public.get_admin_products(
  search_query text DEFAULT NULL,
  status_filter text DEFAULT NULL,
  category_filter text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  category text,
  subcategory text,
  daily_price_owner numeric,
  location_city text,
  images text[],
  is_active boolean,
  admin_flagged boolean,
  flag_reason text,
  owner_id uuid,
  owner_name text,
  slug text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.subcategory,
    p.daily_price_owner,
    p.location_city,
    p.images,
    p.is_active,
    p.admin_flagged,
    p.flag_reason,
    p.owner_id,
    COALESCE(pr.full_name, 'Utilizator') as owner_name,
    p.slug,
    p.created_at
  FROM products p
  LEFT JOIN profiles pr ON pr.id = p.owner_id
  WHERE 
    (search_query IS NULL OR p.title ILIKE '%' || search_query || '%')
    AND (
      status_filter IS NULL 
      OR (status_filter = 'active' AND p.is_active = true AND p.admin_flagged = false)
      OR (status_filter = 'inactive' AND p.is_active = false)
      OR (status_filter = 'flagged' AND p.admin_flagged = true)
    )
    AND (category_filter IS NULL OR p.category = category_filter)
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
