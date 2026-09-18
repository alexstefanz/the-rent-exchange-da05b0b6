import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminActivity,
  fetchAdminActivityActions,
  type AdminActivityParams,
} from "@/features/admin/activityFeedApi";

export const useAdminActivityFeed = (params: AdminActivityParams) =>
  useQuery({
    queryKey: [
      "adminActivityFeed",
      params.search ?? "",
      params.action ?? "all",
      params.dateFrom?.toISOString() ?? "",
      params.dateTo?.toISOString() ?? "",
      params.page ?? 0,
      params.pageSize ?? 50,
    ],
    queryFn: () => fetchAdminActivity(params),
    staleTime: 30_000,
  });

export const useAdminActivityActions = () =>
  useQuery({
    queryKey: ["adminActivityActions"],
    queryFn: fetchAdminActivityActions,
    staleTime: 5 * 60_000,
  });
