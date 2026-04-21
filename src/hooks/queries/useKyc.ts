import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminKycCases,
  fetchKycCase,
  fetchKycDocuments,
  fetchKycAuditLog,
  fetchKycUserContext,
  fetchKycDuplicates,
  type FetchKycFilters,
} from "@/features/admin/kycApi";

export const useAdminKycCases = (filters?: FetchKycFilters) => {
  return useQuery({
    queryKey: ['adminKycCases', filters],
    queryFn: () => fetchAdminKycCases(filters),
    staleTime: 30000,
  });
};

export const useKycCase = (id: string | undefined) => {
  return useQuery({
    queryKey: ['kycCase', id],
    queryFn: () => fetchKycCase(id!),
    enabled: !!id,
  });
};

export const useKycDocuments = (caseId: string | undefined) => {
  return useQuery({
    queryKey: ['kycDocuments', caseId],
    queryFn: () => fetchKycDocuments(caseId!),
    enabled: !!caseId,
  });
};

export const useKycAuditLog = (caseId: string | undefined) => {
  return useQuery({
    queryKey: ['kycAuditLog', caseId],
    queryFn: () => fetchKycAuditLog(caseId!),
    enabled: !!caseId,
  });
};

export const useKycUserContext = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['kycUserContext', userId],
    queryFn: () => fetchKycUserContext(userId!),
    enabled: !!userId,
  });
};

export const useKycDuplicates = (caseId: string | undefined) => {
  return useQuery({
    queryKey: ['kycDuplicates', caseId],
    queryFn: () => fetchKycDuplicates(caseId!),
    enabled: !!caseId,
  });
};
