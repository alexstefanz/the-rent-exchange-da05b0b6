import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Search, Loader2, Filter, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

const AdminKYC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const filters = {
    status: statusFilter || undefined,
    role: roleFilter || undefined,
    level: levelFilter || undefined,
    search: search || undefined,
  };

  const { data: cases, isLoading } = useAdminKycCases(filters);

  // Stats
  const submitted = cases?.filter(c => c.status === 'SUBMITTED').length || 0;
  const needsReview = cases?.filter(c => c.status === 'NEEDS_MANUAL_REVIEW').length || 0;
  const approved = cases?.filter(c => c.status === 'APPROVED').length || 0;
  const rejected = cases?.filter(c => c.status === 'REJECTED').length || 0;

  const getStatusLabel = (status: string) => KYC_STATUSES.find(s => s.value === status)?.label || status;

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
            Gestionează verificările de identitate ale utilizatorilor
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Trimise" value={submitted} icon={<ShieldCheck className="h-4 w-4" />} />
          <StatsCard title="Revizuire manuală" value={needsReview} icon={<Eye className="h-4 w-4" />} />
          <StatsCard title="Aprobate" value={approved} icon={<ShieldCheck className="h-4 w-4" />} />
          <StatsCard title="Respinse" value={rejected} icon={<ShieldCheck className="h-4 w-4" />} />
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
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută după ID, nume, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {KYC_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate rolurile</SelectItem>
                  {USER_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter || "all"} onValueChange={(v) => setLevelFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate nivelurile</SelectItem>
                  {LEVEL_OPTIONS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista verificărilor</CardTitle>
            <CardDescription>{cases?.length || 0} verificări găsite</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : cases && cases.length > 0 ? (
              <div className="overflow-x-auto">
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
                      <TableRow key={kycCase.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/kyc/${kycCase.id}`)}>
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
                          <span className={`text-sm font-medium ${
                            kycCase.risk_score > 70 ? 'text-destructive' :
                            kycCase.risk_score > 40 ? 'text-orange-600' : 'text-muted-foreground'
                          }`}>
                            {kycCase.risk_score}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{kycCase.attempts_count}</TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {format(new Date(kycCase.created_at), 'd MMM yyyy', { locale: ro })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
