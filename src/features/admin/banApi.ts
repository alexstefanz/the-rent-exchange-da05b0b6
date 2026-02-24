import { supabase } from "@/integrations/supabase/client";

export const banUser = async (userId: string, reason: string, bannedBy: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_by: bannedBy,
      ban_reason: reason
    } as Record<string, unknown>)
    .eq('id', userId);
  if (error) throw new Error(error.message);
};

export const unbanUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: false,
      banned_at: null,
      banned_by: null,
      ban_reason: null
    } as Record<string, unknown>)
    .eq('id', userId);
  if (error) throw new Error(error.message);
};
