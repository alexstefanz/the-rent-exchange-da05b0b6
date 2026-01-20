import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/features/profile/userSearchApi";

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: ["search-users", query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
