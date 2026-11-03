import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useIsInsurer = (userId: string | undefined) =>
  useQuery({
    queryKey: ["is-insurer", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: userId!, _role: "insurer" as never });
      return !!data;
    },
  });

export const INSURER_HOME = "/admin/asigurari";
