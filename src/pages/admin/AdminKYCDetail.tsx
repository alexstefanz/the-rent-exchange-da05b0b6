import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, RefreshCw, AlertTriangle,
  User, Mail, Phone, Calendar, Package, FileText, Clock, Eye, Loader2, Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useKycCase, useKycDocuments, useKycAuditLog, useKycUserContext } from "@/hooks/queries/useKyc";
import { useKycDuplicates } from "@/hooks/queries/useKyc";
import { useUserActivityLogs } from "@/hooks/queries/useUserActivityLogs";
import {
  approveKycCase, rejectKycCase, requestReupload, setNeedsManualReview,
  KYC_STATUSES, KYC_STATUS_COLORS, REJECTION_REASONS, DOCUMENT_TYPES,
} from "@/features/admin/kycApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

const ACTION_LABELS: Record<string, string> = {
  PRODUCT_CREATED: 'Produs creat',
  PRODUCT_DELETED: 'Produs șters',
  PRODUCT_DEACTIVATED: 'Produs dezactivat',
  PRODUCT_REACTIVATED: 'Produs reactivat',
  PRICE_CHANGED: 'Preț modificat',
  PHONE_UPDATED: 'Telefon actualizat',
  KYC_STATUS_CHANGED: 'Status KYC modificat',
  KYC_CASE_CREATED: 'Caz KYC creat',
  KYC_SUBMITTED: 'KYC trimis',
  KYC_APPROVED: 'KYC aprobat',
  KYC_REJECTED: 'KYC respins',
  KYC_NEEDS_MANUAL_REVIEW: 'KYC - revizuire manuală',
  RENTAL_CREATED: 'Rezervare creată',
  RENTAL_CONFIRMED: 'Rezervare confirmată',
  RENTAL_CANCELLED: 'Rezervare anulată',
  RENTAL_COMPLETED: 'Rezervare finalizată',
};

const formatAction = (action: string) => ACTION_LABELS[action] || action;

const AdminKYCDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: kycCase, isLoading } = useKycCase(id);
  const { data: documents } = useKycDocuments(id);
  const { data: auditLog } = useKycAuditLog(id);
  const { data: userContext } = useKycUserContext(kycCase?.user_id);
  const { data: activityLogs } = useUserActivityLogs(kycCase?.user_id);
  const { data: duplicates } = useKycDuplicates(id);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['kycCase', id] });
    queryClient.invalidateQueries({ queryKey: ['kycAuditLog', id] });
    queryClient.invalidateQueries({ queryKey: ['adminKycCases'] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveKycCase(id!),
    onSuccess: () => { toast.success("KYC aprobat"); invalidateAll(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectKycCase(id!, reason),
    onSuccess: () => { toast.success("KYC respins"); invalidateAll(); setRejectDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reuploadMutation = useMutation({
    mutationFn: () => requestReupload(id!),
    onSuccess: () => { toast.success("Reupload solicitat"); invalidateAll(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const manualReviewMutation = useMutation({
    mutationFn: () => setNeedsManualReview(id!),
    onSuccess: () => { toast.success("Marcat pentru revizuire manuală"); invalidateAll(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const getStatusLabel = (s: string) => KYC_STATUSES.find(x => x.value === s)?.label || s;
  const getDocTypeLabel = (t: string) => DOCUMENT_TYPES.find(x => x.value === t)?.label || t;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!kycCase) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Verificarea KYC nu a fost găsită</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/admin/kyc">Înapoi la listă</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isPending = ['SUBMITTED', 'NEEDS_MANUAL_REVIEW', 'IN_PROGRESS'].includes(kycCase.status);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/kyc"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{kycCase.public_id}</h1>
              <Badge className={KYC_STATUS_COLORS[kycCase.status] || 'bg-muted'}>
                {getStatusLabel(kycCase.status)}
              </Badge>
              <Badge variant="outline">{kycCase.user_role === 'OWNER' ? 'Proprietar' : 'Chiriaș'}</Badge>
              <Badge variant="outline">{kycCase.level_required}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Creat {format(new Date(kycCase.created_at), "d MMMM yyyy, HH:mm", { locale: ro })}
              {kycCase.risk_score > 0 && (
                <span className={`ml-3 font-medium ${kycCase.risk_score > 70 ? 'text-destructive' : kycCase.risk_score > 40 ? 'text-orange-600' : ''}`}>
                  Risk score: {kycCase.risk_score}/100
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        {isPending && (
          <Card className="border-primary/20">
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprobă
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Respinge
              </Button>
              <Button variant="outline" onClick={() => reuploadMutation.mutate()} disabled={reuploadMutation.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Solicită reupload
              </Button>
              <Button variant="outline" onClick={() => manualReviewMutation.mutate()} disabled={manualReviewMutation.isPending || kycCase.status === 'NEEDS_MANUAL_REVIEW'}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Revizuire manuală
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Rejection info */}
        {kycCase.status === 'REJECTED' && kycCase.rejection_reason && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-destructive">Motiv respingere:</p>
              <p className="text-sm mt-1">
                {REJECTION_REASONS.find(r => r.value === kycCase.rejection_reason)?.label || kycCase.rejection_reason}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="documents">
              <TabsList>
                <TabsTrigger value="documents">Documente ({documents?.length || 0})</TabsTrigger>
                <TabsTrigger value="audit">Audit Log ({auditLog?.length || 0})</TabsTrigger>
                <TabsTrigger value="activity">Activitate ({activityLogs?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-4">
                {documents?.length ? (
                  <div className="grid gap-4 grid-cols-3">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setPreviewImage(doc.file_url)}>
                        <div className="aspect-[4/3] bg-muted relative">
                          {doc.mime_type?.startsWith('image/') ? (
                            <img src={doc.file_url} alt={doc.file_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            {getDocTypeLabel(doc.document_type)}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                            {' • '}
                            {format(new Date(doc.created_at), "d MMM yyyy", { locale: ro })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Niciun document încărcat</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {auditLog?.length ? (
                      <div className="space-y-3">
                        {auditLog.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{entry.action}</p>
                              {entry.old_value && <p className="text-xs text-muted-foreground">De la: {entry.old_value}</p>}
                              {entry.new_value && <p className="text-xs text-muted-foreground">La: {entry.new_value}</p>}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {entry.actor_type} • {format(new Date(entry.created_at), "d MMM yyyy HH:mm", { locale: ro })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Nicio intrare în audit log</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {activityLogs?.length ? (
                      <div className="space-y-3">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0">
                            <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{formatAction(log.action)}</p>
                              {log.metadata && (
                                <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                                  {log.metadata.title && <p>Produs: {log.metadata.title}</p>}
                                  {log.metadata.old_price !== undefined && (
                                    <p>Preț: {log.metadata.old_price} → {log.metadata.new_price} RON</p>
                                  )}
                                  {log.metadata.old_status && log.metadata.new_status && (
                                    <p>Status: {log.metadata.old_status} → {log.metadata.new_status}</p>
                                  )}
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {log.entity_type} • {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: ro })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Nicio activitate înregistrată</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - User Context */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Context utilizator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userContext ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userContext.full_name || 'Fără nume'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{userContext.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{userContext.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {userContext.created_at
                          ? format(new Date(userContext.created_at), "d MMM yyyy", { locale: ro })
                          : '-'}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rezervări:</span>
                        <span className="font-medium">{userContext.rentals_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Produse:</span>
                        <span className="font-medium">{userContext.products_count}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                      <Link to={`/utilizator/${kycCase.user_id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Vezi profil
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Skeleton className="h-32 w-full" />
                )}
              </CardContent>
            </Card>

            {/* Case Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalii caz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span>{kycCase.provider_name || 'INTERNAL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Încercări:</span>
                  <span>{kycCase.attempts_count}</span>
                </div>
                {kycCase.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trimis:</span>
                    <span>{format(new Date(kycCase.submitted_at), "d MMM yyyy", { locale: ro })}</span>
                  </div>
                )}
                {kycCase.decided_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decis:</span>
                    <span>{format(new Date(kycCase.decided_at), "d MMM yyyy", { locale: ro })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge verificarea KYC</DialogTitle>
            <DialogDescription>Selectează motivul respingerii.</DialogDescription>
          </DialogHeader>
          <Select value={rejectionReason} onValueChange={setRejectionReason}>
            <SelectTrigger><SelectValue placeholder="Selectează motivul" /></SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Anulează</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(rejectionReason)}
              disabled={!rejectionReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          {previewImage && (
            <img src={previewImage} alt="Document preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminKYCDetail;
