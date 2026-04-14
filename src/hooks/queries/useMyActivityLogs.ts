import { useQuery } from "@tanstack/react-query";
import { fetchMyActivityLogs } from "@/features/profile/activityLogApi";
import { useAuth } from "@/contexts/AuthContext";

export const useMyActivityLogs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myActivityLogs', user?.id],
    queryFn: () => fetchMyActivityLogs(100),
    enabled: !!user?.id,
    staleTime: 30000,
  });
};
