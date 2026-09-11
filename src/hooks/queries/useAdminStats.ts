import { useQuery } from "@tanstack/react-query";
import { 
  fetchAdminStats, 
  fetchAdminRentals, 
  fetchAdminUsers, 
  fetchFinancialSummary,
  checkIsAdmin,
  AdminStats,
  AdminRental,
  AdminUser,
  FinancialSummary
} from "@/features/admin/adminApi";

export const useIsAdmin = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['isAdmin', userId],
    queryFn: () => checkIsAdmin(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useAdminRentals = (statusFilter?: string, limit = 50, offset = 0, createdVia?: string) => {
  return useQuery<AdminRental[]>({
    queryKey: ['adminRentals', statusFilter, limit, offset, createdVia],
    queryFn: () => fetchAdminRentals(statusFilter, limit, offset, createdVia),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useAdminUsers = (searchQuery?: string, limit = 50, offset = 0, statusFilter?: string) => {
  return useQuery<AdminUser[]>({
    queryKey: ['adminUsers', searchQuery, limit, offset, statusFilter],
    queryFn: () => fetchAdminUsers(searchQuery, limit, offset, statusFilter),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useFinancialSummary = (startDate?: Date, endDate?: Date) => {
  return useQuery<FinancialSummary>({
    queryKey: ['financialSummary', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchFinancialSummary(startDate, endDate),
    staleTime: 60 * 1000, // 1 minute
  });
};

