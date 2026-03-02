import { supabase } from "@/integrations/supabase/client";

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export const fetchUserActivityLogs = async (userId: string): Promise<UserActivityLog[]> => {
  const { data, error } = await supabase
    .from('user_activity_logs' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data || []) as unknown as UserActivityLog[];
};
