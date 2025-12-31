import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }

  return data;
};

export const createProfile = async (
  userId: string,
  data: { full_name?: string; phone?: string }
): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: data.full_name || null,
      phone: data.phone || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    throw error;
  }

  return profile;
};

export const updateProfile = async (
  userId: string,
  data: { full_name?: string; phone?: string; avatar_url?: string }
): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return profile;
};
