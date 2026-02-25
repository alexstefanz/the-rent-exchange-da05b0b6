import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  total_users: number;
  total_products: number;
  total_rentals: number;
  active_rentals: number;
  revenue_this_month: number;
  pending_kyc: number;
}

export interface AdminRental {
  id: string;
  product_id: string | null;
  product_title: string;
  renter_id: string | null;
  renter_name: string;
  owner_id: string | null;
  owner_name: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_price: number;
  subtotal: number;
  platform_fee: number;
  owner_payout: number;
  status: string;
  payment_status: string;
  created_at: string;
  category: string;
  location_city: string;
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  products_count: number;
  rentals_count: number;
  kyc_status: string;
  user_role: string;
}

export interface FinancialSummary {
  total_revenue: number;
  platform_fees: number;
  owner_payouts: number;
  pending_payments: number;
  completed_rentals: number;
}

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });
  
  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
  
  return data === true;
};

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const { data, error } = await supabase.rpc('get_admin_stats');
  
  if (error) {
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    return {
      total_users: 0,
      total_products: 0,
      total_rentals: 0,
      active_rentals: 0,
      revenue_this_month: 0,
      pending_kyc: 0
    };
  }
  
  return data[0] as AdminStats;
};

export const fetchAdminRentals = async (
  statusFilter?: string,
  limit = 50,
  offset = 0
): Promise<AdminRental[]> => {
  const { data, error } = await supabase.rpc('get_admin_rentals', {
    status_filter: statusFilter || null,
    limit_count: limit,
    offset_count: offset
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return (data || []) as AdminRental[];
};

export const fetchAdminUsers = async (
  searchQuery?: string,
  limit = 50,
  offset = 0
): Promise<AdminUser[]> => {
  const { data, error } = await supabase.rpc('get_admin_users', {
    search_query: searchQuery || null,
    limit_count: limit,
    offset_count: offset
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return (data || []) as AdminUser[];
};

export const fetchFinancialSummary = async (
  startDate?: Date,
  endDate?: Date
): Promise<FinancialSummary> => {
  const { data, error } = await supabase.rpc('get_admin_financial_summary', {
    start_date: startDate?.toISOString() || undefined,
    end_date: endDate?.toISOString() || undefined
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    return {
      total_revenue: 0,
      platform_fees: 0,
      owner_payouts: 0,
      pending_payments: 0,
      completed_rentals: 0
    };
  }
  
  return data[0] as FinancialSummary;
};

export const updateRentalStatus = async (
  rentalId: string,
  status: string,
  cancellationReason?: string
): Promise<void> => {
  const updateData: Record<string, unknown> = { status };
  
  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    updateData.cancellation_reason = cancellationReason;
  }
  
  const { error } = await supabase
    .from('rentals')
    .update(updateData)
    .eq('id', rentalId);
  
  if (error) {
    throw new Error(error.message);
  }
};

// KYC functions have been moved to src/features/admin/kycApi.ts
// Legacy updateKycStatus kept for backward compatibility
export const updateKycStatus = async (
  kycId: string,
  status: 'approved' | 'rejected',
  reviewerId: string,
  rejectionReason?: string
): Promise<void> => {
  const { error } = await supabase
    .from('kyc_cases' as any)
    .update({
      status: status === 'approved' ? 'APPROVED' : 'REJECTED',
      decided_at: new Date().toISOString(),
      decided_by_admin_id: reviewerId,
      rejection_reason: rejectionReason || null,
    })
    .eq('id', kycId);
  
  if (error) {
    throw new Error(error.message);
  }
};

export const fetchKycVerifications = async (
  statusFilter?: string
): Promise<Array<{
  id: string;
  user_id: string;
  status: string;
  document_type: string | null;
  document_url: string | null;
  selfie_url: string | null;
  submitted_at: string | null;
  created_at: string;
}>> => {
  let query = supabase
    .from('kyc_cases' as any)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(error.message);
  }
  
  // Map kyc_cases to legacy format
  return ((data || []) as any[]).map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    status: c.status?.toLowerCase() || 'not_started',
    document_type: null,
    document_url: null,
    selfie_url: null,
    submitted_at: c.submitted_at,
    created_at: c.created_at,
  }));
};

export const updateUserRole = async (
  userId: string,
  role: 'admin' | 'moderator' | 'user'
): Promise<void> => {
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (existing) {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });
    if (error) throw new Error(error.message);
  }
};
