import { useQuery } from "@tanstack/react-query";
import { getPublicProfile } from "@/features/profile/profileApi";
import { getUserStatistics } from "@/features/profile/statisticsApi";
import { getUserReviews } from "@/features/profile/reviewsApi";
import { isUserFavorite } from "@/features/profile/favoritesApi";

export const usePublicProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getPublicProfile(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUserStatistics = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-statistics", userId],
    queryFn: () => getUserStatistics(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUserReviews = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-reviews", userId],
    queryFn: () => getUserReviews(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIsUserFavorite = (userId: string | undefined, currentUserId: string | undefined) => {
  return useQuery({
    queryKey: ["is-favorite", userId, currentUserId],
    queryFn: () => isUserFavorite(userId!),
    enabled: !!userId && !!currentUserId && userId !== currentUserId,
    staleTime: 60 * 1000, // 1 minute
  });
};
