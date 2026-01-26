import { useState } from "react";
import { ShieldCheck, Filter, MoreHorizontal, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useKycVerifications } from "@/hooks/queries/useAdminStats";
import { updateKycStatus } from "@/features/admin/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const statusLabels: Record<string, { label: string; color: string }> = {
  not_started: { label: "Neînceput", color: "bg-gray-100 text-gray-800" },
  pending: { label: "În așteptare", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobat", color: "bg-green-100 text-green-800" },
  rejected: { label: "Respins", color: "bg-red-100 text-red-800" },
};

const documentTypeLabels: Record<string, string> = {
  id_card: "Carte de identitate",
  passport: "Pașaport",
  driving_license: "Permis de conducere",
};

const AdminKYC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedKycId, setSelectedKycId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: kycList, isLoading } = useKycVerifications(statusFilter || undefined);

  const handleApprove = async (kycId: string) => {
    if (!user?.id) return;
    
    setUpdatingId(kycId);
    try {
      await updateKycStatus(kycId, 'approved', user.id);
      toast.success("Verificarea KYC a fost aprobată");
      queryClient.invalidateQueries({ queryKey: ['kycVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (error) {
      toast.error("Eroare la aprobarea verificării");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async () => {
    if (!user?.id || !selectedKycId) return;
    
    setUpdatingId(selectedKycId);
    try {
      await updateKycStatus(selectedKycId, 'rejected', user.id, rejectionReason);
      toast.success("Verificarea KYC a fost respinsă");
      queryClient.invalidateQueries({ queryKey: ['kycVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedKycId(null);
    } catch (error) {
      toast.error("Eroare la respingerea verificării");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const openRejectDialog = (kycId: string) => {
    setSelectedKycId(kycId);
    setRejectDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Verificări KYC
          </h1>
          <p className="text-muted-foreground">
            Aprobă sau respinge verificările de identitate ale utilizatorilor
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toate statusurile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toate</SelectItem>
                  <SelectItem value="pending">În așteptare</SelectItem>
                  <SelectItem value="approved">Aprobate</SelectItem>
                  <SelectItem value="rejected">Respinse</SelectItem>
                  <SelectItem value="not_started">Neîncepute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KYC Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Verificărilor</CardTitle>
            <CardDescription>
              {kycList?.length || 0} verificări găsite
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : kycList && kycList.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Utilizator</TableHead>
                      <TableHead>Tip Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trimis la</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Selfie</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycList.map((kyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell className="font-mono text-xs">
                          {kyc.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {kyc.document_type 
                            ? documentTypeLabels[kyc.document_type] || kyc.document_type
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge className={statusLabels[kyc.status]?.color || "bg-gray-100"}>
                            {statusLabels[kyc.status]?.label || kyc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {kyc.submitted_at 
                            ? format(new Date(kyc.submitted_at), 'd MMM yyyy HH:mm', { locale: ro })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {kyc.document_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={kyc.document_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                Vezi
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {kyc.selfie_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={kyc.selfie_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                Vezi
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {updatingId === kyc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : kyc.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(kyc.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobă
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openRejectDialog(kyc.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Respinge
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleApprove(kyc.id)}
                                  disabled={kyc.status === 'approved'}
                                >
                                  Marchează aprobat
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openRejectDialog(kyc.id)}
                                  disabled={kyc.status === 'rejected'}
                                  className="text-destructive"
                                >
                                  Marchează respins
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există verificări KYC{statusFilter && ` cu status "${statusLabels[statusFilter]?.label}"`}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge Verificarea KYC</DialogTitle>
            <DialogDescription>
              Introdu motivul respingerii. Acesta va fi vizibil pentru utilizator.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivul respingerii..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || updatingId !== null}
            >
              {updatingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminKYC;
