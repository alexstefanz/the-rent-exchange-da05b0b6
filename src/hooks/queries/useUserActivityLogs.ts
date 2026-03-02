import { useQuery } from "@tanstack/react-query";
import { fetchUserActivityLogs } from "@/features/admin/userActivityLogsApi";

export const useUserActivityLogs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['userActivityLogs', userId],
    queryFn: () => fetchUserActivityLogs(userId!),
    enabled: !!userId,
    staleTime: 30000,
  });
};
