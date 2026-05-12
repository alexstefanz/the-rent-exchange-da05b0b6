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

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    if (profile?.email) {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'account-banned',
          recipientEmail: profile.email,
          idempotencyKey: `account-banned-${userId}-${Date.now()}`,
          templateData: { name: profile.full_name || undefined, reason },
        },
      });
    }
  } catch (e) {
    console.error('[banApi] Failed to send account-banned email:', e);
  }
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

export const adminDeleteUser = async (userId: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { user_id: userId },
  });
  if (error) throw new Error(error.message);
  if (data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
};
