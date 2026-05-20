import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  kyc_status: string;
  kyc_level: string;
  account_type: string;
  company_name: string | null;
  cui: string | null;
  reg_com: string | null;
  company_address: string | null;
  sms_notifications_enabled?: boolean;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    handleApiError("Error fetching profile", error);
  }

  return data;
};

export const createProfile = async (
  userId: string,
  data: { full_name?: string; phone?: string; account_type?: string; company_name?: string; cui?: string; reg_com?: string; company_address?: string }
): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: data.full_name || null,
      phone: data.phone || null,
      account_type: data.account_type || 'individual',
      company_name: data.company_name || null,
      cui: data.cui || null,
      reg_com: data.reg_com || null,
      company_address: data.company_address || null,
    })
    .select()
    .single();

  if (error) {
    handleApiError("Error creating profile", error);
  }

  return profile;
};

export const updateProfile = async (
  userId: string,
  data: { full_name?: string; phone?: string; email?: string; avatar_url?: string; account_type?: string; company_name?: string; cui?: string; reg_com?: string; company_address?: string; sms_notifications_enabled?: boolean }
): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    handleApiError("Error updating profile", error);
  }

  return profile;
};

// Get public profile info for users with active products (for public profile page)
export const getPublicProfile = async (userId: string): Promise<{
  id: string;
  full_name: string | null;
  avatar_url: string | null;
} | null> => {
  const { data, error } = await supabase
    .rpc('get_product_owner_public_info', { owner_uuid: userId });
  
  if (error) {
    console.error("Error fetching public profile:", error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
};
