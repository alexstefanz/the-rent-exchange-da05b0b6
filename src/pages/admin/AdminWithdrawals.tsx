import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Banknote,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  User,
  FileImage,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  fetchAdminWithdrawals,
  fetchWithdrawalContext,
  updateWithdrawalStatus,
  maskIban,
  type WithdrawalRow,
} from "@/features/admin/withdrawalsApi";
import { KYC_STATUS_COLORS } from "@/features/admin/kycApi";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "pending", label: "În așteptare" },
  { value: "approved", label: "Aprobate" },
  { value: "completed", label: "Finalizate" },
  { value: "rejected", label: "Respinse" },
  { value: "all", label: "Toate" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobată",
  completed: "Finalizată",
  rejected: "Respinsă",
};

const PROFILE_KYC_LABELS: Record<string, string> = {
  VERIFIED: "Verificat",
  PENDING: "În așteptare",
  REJECTED: "Respins",
  NOT_VERIFIED: "Neverificat",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", minimumFractionDigits: 0 }).format(v);

const initials = (name?: string | null) =>
  (name || "?")
    .split(" ")
    .map((s) => s.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const DOC_LABELS: Record<string, string> = {
  ID_FRONT: "CI / Pașaport (față)",
  ID_BACK: "CI (spate)",
  SELFIE: "Selfie",
  PROOF_OF_ADDRESS: "Dovadă adresă",
};

interface ActionDialogState {
  open: boolean;
  withdrawalId: string | null;
  action: "approved" | "rejected" | "completed" | null;
  note: string;
}

const AdminWithdrawals = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedIban, setRevealedIban] = useState<Record<string, boolean>>({});
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [actionState, setActionState] = useState<ActionDialogState>({
    open: false,
    withdrawalId: null,
    action: null,
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["adminWithdrawals", statusFilter, search],
    queryFn: () => fetchAdminWithdrawals({ status: statusFilter, search }),
    staleTime: 15_000,
  });

  const counts = useMemo(() => {
    const init = { pending: 0, approved: 0, completed: 0, rejected: 0 };
    return withdrawals.reduce((acc, w) => {
      acc[w.status as keyof typeof init] = (acc[w.status as keyof typeof init] || 0) + 1;
      return acc;
    }, init as Record<string, number>);
  }, [withdrawals]);

  // KPI: query "all" once for totals
  const { data: allRows = [] } = useQuery({
    queryKey: ["adminWithdrawalsAll"],
    queryFn: () => fetchAdminWithdrawals({ status: "all" }),
    staleTime: 60_000,
  });
  const kpi = useMemo(() => {
    const sum = (s: string) => allRows.filter((r) => r.status === s).reduce((t, r) => t + r.amount, 0);
    return {
      pendingCount: allRows.filter((r) => r.status === "pending").length,
      pendingSum: sum("pending"),
      approvedSum: sum("approved"),
      completedSum: sum("completed"),
      rejectedSum: sum("rejected"),
    };
  }, [allRows]);

  const openAction = (id: string, action: ActionDialogState["action"]) =>
    setActionState({ open: true, withdrawalId: id, action, note: "" });

  const handleConfirmAction = async () => {
    if (!actionState.withdrawalId || !actionState.action) return;
    if (actionState.action === "rejected" && !actionState.note.trim()) {
      toast.error("Adaugă un motiv pentru respingere.");
      return;
    }
    setSubmitting(true);
    try {
      await updateWithdrawalStatus(
        actionState.withdrawalId,
        actionState.action,
        actionState.note.trim() || undefined,
      );
      toast.success(
        actionState.action === "approved"
          ? "Cerere aprobată"
          : actionState.action === "rejected"
            ? "Cerere respinsă"
            : "Marcată ca transferată",
      );
      setActionState({ open: false, withdrawalId: null, action: null, note: "" });
      qc.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      qc.invalidateQueries({ queryKey: ["adminWithdrawalsAll"] });
      qc.invalidateQueries({ queryKey: ["withdrawalContext"] });
      qc.invalidateQueries({ queryKey: ["admin-notification-summary"] });
    } catch (e: any) {
      toast.error(e?.message || "Eroare la procesare");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label = "Copiat") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Retrageri</h1>
          <span className="hidden sm:inline text-sm text-muted-foreground">
            — Procesează cererile de retragere ale utilizatorilor
          </span>
        </div>

        {/* KPI */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="În așteptare"
            value={`${kpi.pendingCount} cereri`}
            description={formatCurrency(kpi.pendingSum)}
            icon={<Banknote className="h-4 w-4" />}
          />
          <StatsCard
            title="Aprobate (de transferat)"
            value={formatCurrency(kpi.approvedSum)}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatsCard
            title="Finalizate"
            value={formatCurrency(kpi.completedSum)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatsCard
            title="Respinse"
            value={formatCurrency(kpi.rejectedSum)}
            icon={<XCircle className="h-4 w-4" />}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="flex flex-wrap h-auto">
                {STATUS_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">
                    {t.label}
                    {t.value !== "all" && counts[t.value] > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px]">{counts[t.value]}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, email sau IBAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nu există cereri de retragere care să corespundă filtrelor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const expanded = expandedId === w.id;
              const revealed = !!revealedIban[w.id];
              const ibanDisplay = revealed ? w.iban : maskIban(w.iban);
              const kycLabel = PROFILE_KYC_LABELS[w.kyc_status || ""] || w.kyc_status || "—";
              const kycColor = w.kyc_status === "VERIFIED"
                ? "bg-green-100 text-green-800"
                : w.kyc_status === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800";
              const nameMismatch =
                w.account_holder &&
                w.user_name &&
                w.account_holder.trim().toLowerCase() !== w.user_name.trim().toLowerCase();
              return (
                <Card key={w.id} className="overflow-hidden">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={w.user_avatar || undefined} />
                        <AvatarFallback className="text-xs">{initials(w.user_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{w.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{w.user_email}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(w.created_at), "d MMM yyyy HH:mm", { locale: ro })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 sm:min-w-[220px]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>IBAN:</span>
                        <button
                          onClick={() => setRevealedIban((p) => ({ ...p, [w.id]: !p[w.id] }))}
                          className="font-mono text-foreground hover:text-primary inline-flex items-center gap-1"
                          title={revealed ? "Ascunde" : "Afișează complet"}
                        >
                          {ibanDisplay}
                          {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <button onClick={() => copyToClipboard(w.iban, "IBAN copiat")} title="Copiază IBAN">
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </button>
                      </div>
                      {nameMismatch && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Titular ≠ nume profil
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Sumă</p>
                        <p className="font-bold">{formatCurrency(w.amount)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={STATUS_COLORS[w.status]}>{STATUS_LABELS[w.status] || w.status}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${kycColor}`}>
                          KYC: {kycLabel}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {w.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => openAction(w.id, "approved")}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobă
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/40"
                            onClick={() => openAction(w.id, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Respinge
                          </Button>
                        </>
                      )}
                      {w.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => openAction(w.id, "completed")}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marchează transferat
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expanded ? null : w.id)}
                      >
                        Detalii
                        {expanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                      </Button>
                    </div>
                  </div>

                  {w.admin_note && (
                    <div className="px-4 pb-3 text-xs italic text-muted-foreground">
                      Notă admin: {w.admin_note}
                    </div>
                  )}

                  {expanded && (
                    <WithdrawalDetailPanel
                      withdrawal={w}
                      onPreview={(url, label) => setPreviewDoc({ url, label })}
                      onCopy={copyToClipboard}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Action confirm dialog */}
      <Dialog
        open={actionState.open}
        onOpenChange={(o) => !o && setActionState({ open: false, withdrawalId: null, action: null, note: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionState.action === "approved" && "Aprobă cererea de retragere?"}
              {actionState.action === "rejected" && "Respinge cererea de retragere?"}
              {actionState.action === "completed" && "Marchează ca transferată?"}
            </DialogTitle>
            <DialogDescription>
              {actionState.action === "approved" &&
                "Cererea va fi marcată ca aprobată. Va trebui să o marchezi ca transferată după ce trimiți efectiv banii."}
              {actionState.action === "rejected" && "Adaugă un motiv (obligatoriu)."}
              {actionState.action === "completed" &&
                "Vom înregistra automat o tranzacție de tip 'withdrawal' pentru utilizator."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={
              actionState.action === "rejected" ? "Motivul respingerii (obligatoriu)" : "Notă admin (opțional)"
            }
            value={actionState.note}
            onChange={(e) => setActionState((p) => ({ ...p, note: e.target.value }))}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionState({ open: false, withdrawalId: null, action: null, note: "" })}
            >
              Anulează
            </Button>
            <Button onClick={handleConfirmAction} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document preview */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.label}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center max-h-[70vh]">
              <img src={previewDoc.url} alt={previewDoc.label} className="max-h-[70vh] w-auto object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

interface DetailPanelProps {
  withdrawal: WithdrawalRow;
  onPreview: (url: string, label: string) => void;
  onCopy: (text: string, label?: string) => void;
}

const WithdrawalDetailPanel = ({ withdrawal, onPreview, onCopy }: DetailPanelProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["withdrawalContext", withdrawal.user_id, withdrawal.id],
    queryFn: () => fetchWithdrawalContext(withdrawal.user_id, withdrawal.id),
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="border-t bg-muted/30 p-4 space-y-3">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { profile, totalWithdrawn, productsCount, rentalsCount, previousRequests, kycCase, kycDocuments } = data;
  const isVerified = profile.kyc_status === "VERIFIED";

  return (
    <div className="border-t bg-muted/20 p-4 grid gap-4 lg:grid-cols-3">
      {/* Profile */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profil utilizator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{profile.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email || "—"}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Telefon</p>
              <p className="font-medium">{profile.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Membru din</p>
              <p className="font-medium">
                {profile.created_at ? format(new Date(profile.created_at), "d MMM yyyy", { locale: ro }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Anunțuri</p>
              <p className="font-medium">{productsCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rezervări</p>
              <p className="font-medium">{rentalsCount}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Total retras</p>
              <p className="font-medium text-green-700">{formatCurrency(totalWithdrawn)}</p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link to={`/admin/users/${profile.id}`}>
              Vezi profil complet <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Bank */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Cont bancar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">IBAN complet</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs bg-background border rounded px-2 py-1 flex-1 break-all">
                {withdrawal.iban}
              </code>
              <Button size="icon" variant="ghost" onClick={() => onCopy(withdrawal.iban, "IBAN copiat")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Titular cont</p>
            <p className="font-medium">{withdrawal.account_holder || "—"}</p>
            {withdrawal.account_holder &&
              withdrawal.account_holder.trim().toLowerCase() !==
                (profile.full_name || "").trim().toLowerCase() && (
                <p className="text-[11px] text-red-700 inline-flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" /> Diferă de numele din profil ({profile.full_name || "—"})
                </p>
              )}
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Retrageri anterioare ({previousRequests.length})</p>
            {previousRequests.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">Nicio cerere anterioară.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {previousRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs border-b py-1">
                    <span className="text-muted-foreground">
                      {format(new Date(r.created_at), "d MMM yyyy", { locale: ro })}
                    </span>
                    <span className="font-medium">{formatCurrency(r.amount)}</span>
                    <Badge className={`text-[10px] ${STATUS_COLORS[r.status] || "bg-gray-100"}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KYC */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isVerified ? (
              <ShieldCheck className="h-4 w-4 text-green-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            )}
            Identitate KYC
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2 text-sm">
          {!isVerified && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-800 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Utilizator <strong>NEVERIFICAT</strong>. Recomandăm respingerea cererii până la finalizarea KYC.
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge className={`${KYC_STATUS_COLORS[kycCase?.status || ""] || "bg-gray-100"} text-[10px]`}>
                {kycCase?.status || profile.kyc_status || "NOT_STARTED"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Nivel</p>
              <p className="font-medium">{kycCase?.level_required || profile.kyc_level || "—"}</p>
            </div>
            {kycCase && (
              <>
                <div>
                  <p className="text-muted-foreground">Cod caz</p>
                  <p className="font-mono text-[11px]">{kycCase.public_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Decis la</p>
                  <p className="font-medium">
                    {kycCase.decided_at
                      ? format(new Date(kycCase.decided_at), "d MMM yyyy", { locale: ro })
                      : "—"}
                  </p>
                </div>
              </>
            )}
          </div>

          {kycCase && (
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to={`/admin/kyc/${kycCase.id}`}>
                Deschide cazul KYC <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}

          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <FileImage className="h-3 w-3" /> Documente identitate ({kycDocuments.length})
            </p>
            {kycDocuments.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">Niciun document încărcat.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {kycDocuments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onPreview(d.file_url, DOC_LABELS[d.document_type] || d.document_type)}
                    className="group relative aspect-video bg-background border rounded overflow-hidden hover:border-primary transition-colors"
                  >
                    <img
                      src={d.file_url}
                      alt={d.document_type}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                      {DOC_LABELS[d.document_type] || d.document_type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWithdrawals;