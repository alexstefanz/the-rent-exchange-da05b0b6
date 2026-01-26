-- =============================================
-- ERP System - Phase 1: Database Schema
-- =============================================

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Create rentals table
CREATE TABLE public.rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    renter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Rental dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_days INTEGER NOT NULL,
    
    -- Pricing
    daily_price NUMERIC NOT NULL,
    platform_fee_percent NUMERIC NOT NULL DEFAULT 20,
    subtotal NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL,
    owner_payout NUMERIC NOT NULL,
    
    -- Status: pending, confirmed, active, completed, cancelled, overdue
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- Payment: pending, paid, refunded, failed
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

-- 5. Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Type: rental_payment, platform_fee, owner_payout, refund, late_fee
    type TEXT NOT NULL,
    
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'RON',
    
    -- Status: pending, completed, failed
    status TEXT NOT NULL DEFAULT 'pending',
    
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- 6. Create KYC verifications table
CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Status: not_started, pending, approved, rejected
    status TEXT NOT NULL DEFAULT 'not_started',
    
    -- Document type: id_card, passport, driving_license
    document_type TEXT,
    
    document_url TEXT,
    selfie_url TEXT,
    
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS Policies
-- =============================================

-- User Roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Rentals RLS
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals"
ON public.rentals FOR SELECT
TO authenticated
USING (
    renter_id = auth.uid() OR 
    owner_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create rentals as renter"
ON public.rentals FOR INSERT
TO authenticated
WITH CHECK (renter_id = auth.uid());

CREATE POLICY "Admins can manage all rentals"
ON public.rentals FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rentals"
ON public.rentals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage transactions"
ON public.transactions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- KYC Verifications RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
ON public.kyc_verifications FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit own KYC"
ON public.kyc_verifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending KYC"
ON public.kyc_verifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status IN ('not_started', 'pending', 'rejected'));

CREATE POLICY "Admins can manage all KYC"
ON public.kyc_verifications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Database Functions for Admin Stats
-- =============================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(
    total_users BIGINT,
    total_products BIGINT,
    total_rentals BIGINT,
    active_rentals BIGINT,
    revenue_this_month NUMERIC,
    pending_kyc BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
    (SELECT COUNT(*) FROM rentals) as total_rentals,
    (SELECT COUNT(*) FROM rentals WHERE status = 'active') as active_rentals,
    (SELECT COALESCE(SUM(platform_fee), 0) FROM rentals 
     WHERE created_at >= date_trunc('month', now()) AND payment_status = 'paid') as revenue_this_month,
    (SELECT COUNT(*) FROM kyc_verifications WHERE status = 'pending') as pending_kyc
$$;

-- Function to get rentals with related data for admin
CREATE OR REPLACE FUNCTION public.get_admin_rentals(
    status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    product_id UUID,
    product_title TEXT,
    renter_id UUID,
    renter_name TEXT,
    owner_id UUID,
    owner_name TEXT,
    start_date DATE,
    end_date DATE,
    rental_days INTEGER,
    daily_price NUMERIC,
    subtotal NUMERIC,
    platform_fee NUMERIC,
    owner_payout NUMERIC,
    status TEXT,
    payment_status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.product_id,
    COALESCE(p.title, 'Produs șters') as product_title,
    r.renter_id,
    COALESCE(renter.full_name, 'Utilizator') as renter_name,
    r.owner_id,
    COALESCE(owner.full_name, 'Utilizator') as owner_name,
    r.start_date,
    r.end_date,
    r.rental_days,
    r.daily_price,
    r.subtotal,
    r.platform_fee,
    r.owner_payout,
    r.status,
    r.payment_status,
    r.created_at
  FROM rentals r
  LEFT JOIN products p ON p.id = r.product_id
  LEFT JOIN profiles renter ON renter.id = r.renter_id
  LEFT JOIN profiles owner ON owner.id = r.owner_id
  WHERE (status_filter IS NULL OR r.status = status_filter)
  ORDER BY r.created_at DESC
  LIMIT limit_count
  OFFSET offset_count
$$;

-- Function to get all users for admin
CREATE OR REPLACE FUNCTION public.get_admin_users(
    search_query TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ,
    products_count BIGINT,
    rentals_count BIGINT,
    kyc_status TEXT,
    user_role TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.phone,
    p.created_at,
    (SELECT COUNT(*) FROM products WHERE owner_id = p.id) as products_count,
    (SELECT COUNT(*) FROM rentals WHERE renter_id = p.id OR owner_id = p.id) as rentals_count,
    COALESCE((SELECT status FROM kyc_verifications WHERE user_id = p.id), 'not_started') as kyc_status,
    COALESCE((SELECT role::text FROM user_roles WHERE user_id = p.id LIMIT 1), 'user') as user_role
  FROM profiles p
  WHERE (search_query IS NULL OR p.full_name ILIKE '%' || search_query || '%' OR p.email ILIKE '%' || search_query || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count
$$;

-- Function to get financial summary
CREATE OR REPLACE FUNCTION public.get_admin_financial_summary(
    start_date TIMESTAMPTZ DEFAULT date_trunc('month', now()),
    end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
    total_revenue NUMERIC,
    platform_fees NUMERIC,
    owner_payouts NUMERIC,
    pending_payments NUMERIC,
    completed_rentals BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(subtotal), 0) as total_revenue,
    COALESCE(SUM(platform_fee), 0) as platform_fees,
    COALESCE(SUM(owner_payout), 0) as owner_payouts,
    COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN subtotal ELSE 0 END), 0) as pending_payments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rentals
  FROM rentals
  WHERE created_at BETWEEN start_date AND end_date
$$;

-- Update timestamp trigger for rentals
CREATE OR REPLACE FUNCTION public.update_rentals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rentals_timestamp
BEFORE UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.update_rentals_updated_at();

-- Update timestamp trigger for kyc_verifications
CREATE OR REPLACE FUNCTION public.update_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kyc_timestamp
BEFORE UPDATE ON public.kyc_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_kyc_updated_at();