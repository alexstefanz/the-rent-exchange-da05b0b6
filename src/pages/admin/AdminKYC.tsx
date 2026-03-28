import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Search, Filter, Eye, ChevronDown, ChevronUp, ExternalLink, User, Calendar, Hash, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { useAdminKycCases } from "@/hooks/queries/useKyc";
import {
  KYC_STATUSES,
  KYC_STATUS_COLORS,
  USER_ROLES,
  LEVEL_OPTIONS,
} from "@/features/admin/kycApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const KycExpandedPanel = ({ kycCase, onViewDetails }: { kycCase: any; onViewDetails: () => void }) => (
  <div className="p-4 space-y-3 bg-muted/30 border-t">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Email:</span>
        <span className="font-medium text-xs">{kycCase.user_email}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Rol:</span>{" "}
        <Badge variant="outline" className="text-[10px]">
          {kycCase.user_role === 'OWNER' ? 'Proprietar' : 'Chiriaș'}
        </Badge>
      </div>
      <div>
        <span className="text-muted-foreground">Nivel:</span>{" "}
        <span className="font-medium">{kycCase.level_required}</span>
      </div>
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Încercări:</span>
        <span className="font-medium">{kycCase.attempts_count}</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Creat:</span>
        <span className="font-medium">{format(new Date(kycCase.created_at), 'd MMM yyyy', { locale: ro })}</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Risk:</span>
        <span className={`font-medium ${kycCase.risk_score > 70 ? 'text-destructive' : kycCase.risk_score > 40 ? 'text-orange-600' : ''}`}>
          {kycCase.risk_score}
        </span>
      </div>
    </div>
    <Separator />
    <Button size="sm" variant="outline" onClick={onViewDetails}>
      <ExternalLink className="h-4 w-4 mr-1" /> Vezi detalii
    </Button>
  </div>
);

const AdminKYC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = {
    status: statusFilter || undefined,
    role: roleFilter || undefined,
    level: levelFilter || undefined,
    search: search || undefined,
  };

  const { data: cases, isLoading } = useAdminKycCases(filters);

  const submitted = cases?.filter(c => c.status === 'SUBMITTED').length || 0;
  const needsReview = cases?.filter(c => c.status === 'NEEDS_MANUAL_REVIEW').length || 0;
  const approved = cases?.filter(c => c.status === 'APPROVED').length || 0;
  const rejected = cases?.filter(c => c.status === 'REJECTED').length || 0;

  const getStatusLabel = (status: string) => KYC_STATUSES.find(s => s.value === status)?.label || status;
  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Verificări KYC</h1>
          <span className="text-sm text-muted-foreground">— Gestionează verificările de identitate</span>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatsCard title="Trimise" value={submitted} icon={<ShieldCheck className="h-4 w-4" />} />
          <StatsCard title="Revizuire manuală" value={needsReview} icon={<Eye className="h-4 w-4" />} />
          <StatsCard title="Aprobate" value={approved} icon={<ShieldCheck className="h-4 w-4" />} />
          <StatsCard title="Respinse" value={rejected} icon={<ShieldCheck className="h-4 w-4" />} />
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Caută după ID, nume, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {KYC_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate rolurile</SelectItem>
                  {USER_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={levelFilter || "all"} onValueChange={(v) => setLevelFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate nivelurile</SelectItem>
                  {LEVEL_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista verificărilor</CardTitle>
            <CardDescription>{cases?.length || 0} verificări găsite</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : cases && cases.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Utilizator</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Încercări</TableHead>
                        <TableHead>Creat la</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((kycCase) => (
                        <>
                          <TableRow key={kycCase.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(kycCase.id)}>
                            <TableCell className="font-mono text-xs">{kycCase.public_id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{kycCase.user_name}</p>
                                <p className="text-xs text-muted-foreground">{kycCase.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {kycCase.user_role === 'OWNER' ? 'Proprietar' : 'Chiriaș'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{kycCase.level_required}</TableCell>
                            <TableCell>
                              <Badge className={KYC_STATUS_COLORS[kycCase.status] || 'bg-muted'}>
                                {getStatusLabel(kycCase.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm font-medium ${kycCase.risk_score > 70 ? 'text-destructive' : kycCase.risk_score > 40 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                {kycCase.risk_score}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{kycCase.attempts_count}</TableCell>
                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                              {format(new Date(kycCase.created_at), 'd MMM yyyy', { locale: ro })}
                            </TableCell>
                          </TableRow>
                          {expandedId === kycCase.id && (
                            <TableRow key={`${kycCase.id}-expand`}>
                              <TableCell colSpan={8} className="p-0">
                                <KycExpandedPanel kycCase={kycCase} onViewDetails={() => navigate(`/admin/kyc/${kycCase.id}`)} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {cases.map((kycCase) => (
                    <Card key={kycCase.id} className="overflow-hidden">
                      <div className="p-3 cursor-pointer flex items-center justify-between" onClick={() => toggleExpand(kycCase.id)}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{kycCase.public_id}</span>
                            <Badge className={`${KYC_STATUS_COLORS[kycCase.status] || 'bg-muted'} text-[10px]`}>
                              {getStatusLabel(kycCase.status)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate">{kycCase.user_name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-sm font-bold ${kycCase.risk_score > 70 ? 'text-destructive' : kycCase.risk_score > 40 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                            {kycCase.risk_score}
                          </span>
                          {expandedId === kycCase.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                      {expandedId === kycCase.id && (
                        <KycExpandedPanel kycCase={kycCase} onViewDetails={() => navigate(`/admin/kyc/${kycCase.id}`)} />
                      )}
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există verificări KYC cu filtrele selectate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminKYC;
