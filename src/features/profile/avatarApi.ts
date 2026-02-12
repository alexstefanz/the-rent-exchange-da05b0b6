import { supabase } from "@/integrations/supabase/client";

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/avatar.${fileExt}`;

  // Remove old avatar if exists
  await supabase.storage.from("avatars").remove([filePath]);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Add cache-busting param
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) throw updateError;

  return publicUrl;
};
