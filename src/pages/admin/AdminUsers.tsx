import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Shield, ShieldCheck, Ban, ChevronDown, ChevronUp, Package, CalendarCheck, ExternalLink, Wallet, ShoppingBag, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminUsers } from "@/hooks/queries/useAdminStats";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" /> },
  moderator: { label: "Moderator", icon: <ShieldCheck className="h-3 w-3" /> },
  user: { label: "Utilizator", icon: null },
};

const KycBadge = ({ status }: { status?: string | null }) => {
  if (status === 'verified') return <Badge variant="outline" className="gap-1 text-green-700 border-green-600/40"><ShieldCheck className="h-3 w-3" /> KYC</Badge>;
  if (status === 'pending') return <Badge variant="outline" className="gap-1 text-orange-700 border-orange-500/40">KYC în așteptare</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Neverificat</Badge>;
};

const KycResetButton = ({ user }: { user: any }) => {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const status = user.identity_status ?? 'unverified';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={loading || status === 'unverified'} onClick={async (e) => {
        e.stopPropagation();
        if (!window.confirm("Dezactivezi verificarea KYC (Stripe Identity) pentru acest utilizator? Va trebui să reia verificarea.")) return;
        setLoading(true); setMsg(null);
        const { error } = await (supabase.rpc as any)('admin_reset_identity_verification', { _user_id: user.id });
        setLoading(false);
        setMsg(error ? `Eroare: ${error.message}` : "Verificarea KYC a fost dezactivată.");
        if (!error) qc.invalidateQueries({ queryKey: ['adminUsers'] });
      }}>
        {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
        Dezactivează KYC
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
};

const UserExpandedPanel = ({ user, onViewProfile }: { user: any; onViewProfile: () => void }) => (
  <div className="p-4 space-y-3 bg-muted/30 border-t">
    {(user.is_banned || (user.warnings_count ?? 0) > 0) && (
      <div className="space-y-2">
        {user.is_banned && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
            <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Cont banat{user.banned_at ? ` la ${format(new Date(user.banned_at), 'd MMM yyyy', { locale: ro })}` : ''}</p>
              {user.ban_reason && <p className="text-xs opacity-90">Motiv: {user.ban_reason}</p>}
            </div>
          </div>
        )}
        {(user.warnings_count ?? 0) > 0 && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-orange-100 text-orange-800 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{user.warnings_count} avertisment{user.warnings_count === 1 ? '' : 'e'}</p>
              {user.last_warning_at && <p className="text-xs opacity-90">Ultimul: {format(new Date(user.last_warning_at), 'd MMM yyyy', { locale: ro })}</p>}
            </div>
          </div>
        )}
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Produse:</span>
        <span className="font-medium">{user.products_count}</span>
      </div>
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Rezervări:</span>
        <span className="font-medium">{user.rentals_count}</span>
      </div>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Câștigat:</span>
        <span className="font-medium text-green-700">{Number(user.total_earned || 0).toLocaleString('ro-RO')} RON</span>
      </div>
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Cheltuit:</span>
        <span className="font-medium">{Number(user.total_spent || 0).toLocaleString('ro-RO')} RON</span>
      </div>
      <div>
        <span className="text-muted-foreground">Înregistrat:</span>{" "}
        <span className="font-medium">{user.created_at ? format(new Date(user.created_at), 'd MMM yyyy', { locale: ro }) : '-'}</span>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Status KYC:</span>
      <KycBadge status={user.identity_status} />
      {user.identity_verified_at && <span className="text-xs text-muted-foreground">din {format(new Date(user.identity_verified_at), 'd MMM yyyy HH:mm', { locale: ro })}</span>}
    </div>
    <Separator />
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={onViewProfile}>
        <ExternalLink className="h-4 w-4 mr-1" /> Vezi profil complet
      </Button>
      <KycResetButton user={user} />
    </div>
  </div>
);

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  const { data: users, isLoading } = useAdminUsers(
    debouncedSearch || undefined,
    50,
    0,
    statusFilter === "all" ? undefined : statusFilter
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const isUserBanned = (u: any) => u.is_banned === true;
  const hasWarnings = (u: any) => (u.warnings_count ?? 0) > 0;
  const toggleExpand = (id: string) => setExpandedUserId(prev => prev === id ? null : id);

  return (
    <AdminLayout>
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Gestionare Utilizatori</h1>
          <span className="text-sm text-muted-foreground">— Caută și administrează conturile</span>
        </div>

        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută după nume sau email..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
                <TabsTrigger value="all">Toți</TabsTrigger>
                <TabsTrigger value="active">Activi</TabsTrigger>
                <TabsTrigger value="warned" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Avertizați
                </TabsTrigger>
                <TabsTrigger value="banned" className="gap-1">
                  <Ban className="h-3 w-3" /> Banați
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista Utilizatorilor</CardTitle>
            <CardDescription>{users?.length || 0} utilizatori găsiți</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : users && users.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilizator</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Produse</TableHead>
                        <TableHead>Rezervări</TableHead>
                        <TableHead>Câștigat</TableHead>
                        <TableHead>Cheltuit</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Înregistrat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <>
                          <TableRow
                            key={u.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleExpand(u.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={u.avatar_url || undefined} />
                                  <AvatarFallback>{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {u.full_name || (
                                    <span className="text-muted-foreground italic">Fără nume</span>
                                  )}
                                </span>
                                {expandedUserId === u.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.email || '-'}</TableCell>
                            <TableCell>{u.products_count}</TableCell>
                            <TableCell>{u.rentals_count}</TableCell>
                            <TableCell className="font-medium text-green-700 whitespace-nowrap">{Number(u.total_earned || 0).toLocaleString('ro-RO')} RON</TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{Number(u.total_spent || 0).toLocaleString('ro-RO')} RON</TableCell>
                            <TableCell>
                              <Badge variant={u.user_role === 'admin' ? 'default' : 'outline'} className="gap-1">
                                {roleLabels[u.user_role]?.icon}
                                {roleLabels[u.user_role]?.label || u.user_role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                {isUserBanned(u) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="destructive" className="gap-1 cursor-help"><Ban className="h-3 w-3" /> BANAT</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="font-medium">Cont banat</p>
                                      {u.banned_at && <p className="text-xs opacity-80">{format(new Date(u.banned_at), 'd MMM yyyy', { locale: ro })}</p>}
                                      {u.ban_reason && <p className="text-xs mt-1">{u.ban_reason}</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {hasWarnings(u) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="gap-1 bg-orange-100 text-orange-800 hover:bg-orange-100 cursor-help">
                                        <AlertTriangle className="h-3 w-3" /> Avertizat ({u.warnings_count})
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{u.warnings_count} avertisment{u.warnings_count === 1 ? '' : 'e'}</p>
                                      {u.last_warning_at && <p className="text-xs opacity-80">Ultimul: {format(new Date(u.last_warning_at), 'd MMM yyyy', { locale: ro })}</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {!isUserBanned(u) && !hasWarnings(u) && (
                                  <Badge variant="outline" className="text-green-700">Activ</Badge>
                                )}
                                <KycBadge status={(u as any).identity_status} />
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {u.created_at ? format(new Date(u.created_at), 'd MMM yyyy', { locale: ro }) : '-'}
                            </TableCell>
                          </TableRow>
                          {expandedUserId === u.id && (
                            <TableRow key={`${u.id}-expand`}>
                              <TableCell colSpan={9} className="p-0">
                                <UserExpandedPanel user={u} onViewProfile={() => navigate(`/admin/users/${u.id}`)} />
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
                  {users.map((u) => (
                    <Card key={u.id} className="overflow-hidden">
                      <div
                        className="p-3 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleExpand(u.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback>{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {u.full_name || (
                                <span className="text-muted-foreground italic">Fără nume</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{u.email || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={u.user_role === 'admin' ? 'default' : 'outline'} className="gap-1 text-[10px]">
                            {roleLabels[u.user_role]?.icon}
                            {roleLabels[u.user_role]?.label || u.user_role}
                          </Badge>
                          {isUserBanned(u) && (
                            <Badge variant="destructive" className="gap-1 text-[10px]"><Ban className="h-3 w-3" /> BANAT</Badge>
                          )}
                          {hasWarnings(u) && (
                            <Badge className="gap-1 text-[10px] bg-orange-100 text-orange-800 hover:bg-orange-100">
                              <AlertTriangle className="h-3 w-3" /> {u.warnings_count}
                            </Badge>
                          )}
                          {!isUserBanned(u) && !hasWarnings(u) && (
                            <Badge variant="outline" className="text-green-700 text-[10px]">Activ</Badge>
                          )}
                          {expandedUserId === u.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                      {expandedUserId === u.id && (
                        <UserExpandedPanel user={u} onViewProfile={() => navigate(`/admin/users/${u.id}`)} />
                      )}
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu s-au găsit utilizatori{searchQuery && ` pentru "${searchQuery}"`}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
    </AdminLayout>
  );
};

export default AdminUsers;
