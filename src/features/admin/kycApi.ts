import { supabase } from "@/integrations/supabase/client";

// ============================================
// Types
// ============================================

export interface KycCase {
  id: string;
  public_id: string;
  user_id: string;
  user_role: string;
  level_required: string;
  status: string;
  rejection_reason: string | null;
  provider_name: string | null;
  provider_case_id: string | null;
  attempts_count: number;
  risk_score: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  decided_by_admin_id: string | null;
}

export interface KycCaseWithUser extends KycCase {
  user_name: string;
  user_email: string;
}

export interface KycDocument {
  id: string;
  kyc_case_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
}

export interface KycAuditEntry {
  id: string;
  kyc_case_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  actor_type: string;
  actor_id: string | null;
  created_at: string;
}

// ============================================
// Constants
// ============================================

export const KYC_STATUSES = [
  { value: 'NOT_STARTED', label: 'Neînceput' },
  { value: 'IN_PROGRESS', label: 'În progres' },
  { value: 'SUBMITTED', label: 'Trimis' },
  { value: 'AUTO_APPROVED', label: 'Auto-aprobat' },
  { value: 'NEEDS_MANUAL_REVIEW', label: 'Revizuire manuală' },
  { value: 'APPROVED', label: 'Aprobat' },
  { value: 'REJECTED', label: 'Respins' },
  { value: 'EXPIRED', label: 'Expirat' },
];

export const KYC_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-muted text-muted-foreground',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  AUTO_APPROVED: 'bg-green-100 text-green-800',
  NEEDS_MANUAL_REVIEW: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-muted text-muted-foreground',
};

export const REJECTION_REASONS = [
  { value: 'BLURRY_DOCUMENT', label: 'Document neclar' },
  { value: 'DOCUMENT_INVALID', label: 'Document invalid' },
  { value: 'NAME_MISMATCH', label: 'Nepotrivire nume' },
  { value: 'FACE_MISMATCH', label: 'Nepotrivire față' },
  { value: 'DOCUMENT_EXPIRED', label: 'Document expirat' },
  { value: 'INCOMPLETE', label: 'Incomplet' },
  { value: 'SUSPECTED_FRAUD', label: 'Suspiciune fraudă' },
  { value: 'DUPLICATE_IDENTITY', label: 'Identitate duplicată' },
  { value: 'OTHER', label: 'Altul' },
];

export const DOCUMENT_TYPES = [
  { value: 'ID_FRONT', label: 'Față CI/Pașaport' },
  { value: 'ID_BACK', label: 'Spate CI' },
  { value: 'SELFIE', label: 'Selfie' },
  { value: 'PROOF_OF_ADDRESS', label: 'Dovadă adresă' },
];

export const USER_ROLES = [
  { value: 'RENTER', label: 'Chiriaș' },
  { value: 'OWNER', label: 'Proprietar' },
];

export const LEVEL_OPTIONS = [
  { value: 'LEVEL_0', label: 'Nivel 0 (Email+Tel)' },
  { value: 'LEVEL_1', label: 'Nivel 1 (Document+Selfie)' },
  { value: 'LEVEL_2', label: 'Nivel 2 (Extins)' },
];

export const PROVIDER_OPTIONS = [
  { value: 'INTERNAL', label: 'Intern' },
  { value: 'SUMSUB', label: 'Sumsub' },
  { value: 'VERIFF', label: 'Veriff' },
  { value: 'ONFIDO', label: 'Onfido' },
];

// ============================================
// Helpers
// ============================================

const kycCases = () => supabase.from('kyc_cases' as any);
const kycDocuments = () => supabase.from('kyc_documents' as any);
const kycAuditLog = () => supabase.from('kyc_audit_log' as any);

// ============================================
// Admin API
// ============================================

export interface FetchKycFilters {
  status?: string;
  role?: string;
  level?: string;
  search?: string;
}

export const fetchAdminKycCases = async (filters?: FetchKycFilters): Promise<KycCaseWithUser[]> => {
  const { data, error } = await supabase.rpc('get_admin_kyc_cases' as any, {
    status_filter: filters?.status || null,
    role_filter: filters?.role || null,
    level_filter: filters?.level || null,
    search_query: filters?.search || null,
    limit_count: 100,
    offset_count: 0,
  });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as KycCaseWithUser[];
};

export const fetchKycCase = async (id: string): Promise<KycCase> => {
  const { data, error } = await kycCases().select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as unknown as KycCase;
};

export const fetchKycDocuments = async (caseId: string): Promise<KycDocument[]> => {
  const { data, error } = await kycDocuments()
    .select('*')
    .eq('kyc_case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as KycDocument[];
};

export const fetchKycAuditLog = async (caseId: string): Promise<KycAuditEntry[]> => {
  const { data, error } = await kycAuditLog()
    .select('*')
    .eq('kyc_case_id', caseId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as KycAuditEntry[];
};

// ============================================
// Admin Actions
// ============================================

const auditLog = async (caseId: string, action: string, oldVal: string | null, newVal: string | null) => {
  const { data: userData } = await supabase.auth.getUser();
  await kycAuditLog().insert({
    kyc_case_id: caseId,
    action,
    old_value: oldVal,
    new_value: newVal,
    actor_type: 'ADMIN',
    actor_id: userData.user?.id,
  });
};

export const approveKycCase = async (caseId: string): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  const kycCase = await fetchKycCase(caseId);

  const { error } = await kycCases().update({
    status: 'APPROVED',
    decided_at: new Date().toISOString(),
    decided_by_admin_id: userData.user?.id,
  }).eq('id', caseId);
  if (error) throw new Error(error.message);

  // Update profile
  await supabase.from('profiles').update({
    kyc_status: 'VERIFIED',
    kyc_level: kycCase.level_required,
    kyc_last_verified_at: new Date().toISOString(),
  }).eq('id', kycCase.user_id);

  await auditLog(caseId, 'APPROVED', kycCase.status, 'APPROVED');
};

export const rejectKycCase = async (caseId: string, reason: string): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  const kycCase = await fetchKycCase(caseId);

  const { error } = await kycCases().update({
    status: 'REJECTED',
    rejection_reason: reason,
    decided_at: new Date().toISOString(),
    decided_by_admin_id: userData.user?.id,
  }).eq('id', caseId);
  if (error) throw new Error(error.message);

  await supabase.from('profiles').update({
    kyc_status: 'REJECTED',
  }).eq('id', kycCase.user_id);

  await auditLog(caseId, 'REJECTED', kycCase.status, 'REJECTED: ' + reason);
};

export const requestReupload = async (caseId: string): Promise<void> => {
  const kycCase = await fetchKycCase(caseId);
  const { error } = await kycCases().update({
    status: 'IN_PROGRESS',
    rejection_reason: null,
  }).eq('id', caseId);
  if (error) throw new Error(error.message);

  await supabase.from('profiles').update({
    kyc_status: 'PENDING',
  }).eq('id', kycCase.user_id);

  await auditLog(caseId, 'REUPLOAD_REQUESTED', kycCase.status, 'IN_PROGRESS');
};

export const setNeedsManualReview = async (caseId: string): Promise<void> => {
  const kycCase = await fetchKycCase(caseId);
  const { error } = await kycCases().update({
    status: 'NEEDS_MANUAL_REVIEW',
  }).eq('id', caseId);
  if (error) throw new Error(error.message);

  await auditLog(caseId, 'STATUS_CHANGED', kycCase.status, 'NEEDS_MANUAL_REVIEW');
};

export const updateKycRiskScore = async (caseId: string, score: number): Promise<void> => {
  const { error } = await kycCases().update({ risk_score: score }).eq('id', caseId);
  if (error) throw new Error(error.message);
  await auditLog(caseId, 'STATUS_CHANGED', null, `risk_score: ${score}`);
};

// ============================================
// User Context (for detail page)
// ============================================

export interface KycUserContext {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  rentals_count: number;
  products_count: number;
}

export const fetchKycUserContext = async (userId: string): Promise<KycUserContext> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, created_at')
    .eq('id', userId)
    .single();

  const { count: rentalsCount } = await supabase
    .from('rentals')
    .select('id', { count: 'exact', head: true })
    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`);

  const { count: productsCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  return {
    full_name: profile?.full_name || null,
    email: profile?.email || null,
    phone: profile?.phone || null,
    created_at: profile?.created_at || null,
    rentals_count: rentalsCount || 0,
    products_count: productsCount || 0,
  };
};
