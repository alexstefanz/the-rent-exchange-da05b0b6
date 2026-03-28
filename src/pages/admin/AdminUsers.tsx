import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Shield, ShieldCheck, Ban, ChevronDown, ChevronUp, Package, CalendarCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminUsers } from "@/hooks/queries/useAdminStats";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const kycStatusLabels: Record<string, { label: string; color: string }> = {
  not_started: { label: "Neînceput", color: "bg-gray-100 text-gray-800" },
  pending: { label: "În așteptare", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobat", color: "bg-green-100 text-green-800" },
  rejected: { label: "Respins", color: "bg-red-100 text-red-800" },
};

const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" /> },
  moderator: { label: "Moderator", icon: <ShieldCheck className="h-3 w-3" /> },
  user: { label: "Utilizator", icon: null },
};

const UserExpandedPanel = ({ user, onViewProfile }: { user: any; onViewProfile: () => void }) => (
  <div className="p-4 space-y-3 bg-muted/30 border-t">
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
      <div>
        <span className="text-muted-foreground">KYC:</span>{" "}
        <Badge className={kycStatusLabels[user.kyc_status]?.color || "bg-gray-100"}>
          {kycStatusLabels[user.kyc_status]?.label || user.kyc_status}
        </Badge>
      </div>
      <div>
        <span className="text-muted-foreground">Înregistrat:</span>{" "}
        <span className="font-medium">{user.created_at ? format(new Date(user.created_at), 'd MMM yyyy', { locale: ro }) : '-'}</span>
      </div>
    </div>
    <Separator />
    <Button size="sm" variant="outline" onClick={onViewProfile}>
      <ExternalLink className="h-4 w-4 mr-1" /> Vezi profil complet
    </Button>
  </div>
);

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: users, isLoading } = useAdminUsers(debouncedSearch || undefined);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const isUserBanned = (u: any) => u.is_banned === true;
  const toggleExpand = (id: string) => setExpandedUserId(prev => prev === id ? null : id);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Gestionare Utilizatori</h1>
          <span className="text-sm text-muted-foreground">— Caută și administrează conturile</span>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută după nume sau email..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
            </div>
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
                        <TableHead>KYC</TableHead>
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
                                <span className="font-medium">{u.full_name || 'Fără nume'}</span>
                                {expandedUserId === u.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.email || '-'}</TableCell>
                            <TableCell>{u.products_count}</TableCell>
                            <TableCell>{u.rentals_count}</TableCell>
                            <TableCell>
                              <Badge className={kycStatusLabels[u.kyc_status]?.color || "bg-gray-100"}>
                                {kycStatusLabels[u.kyc_status]?.label || u.kyc_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.user_role === 'admin' ? 'default' : 'outline'} className="gap-1">
                                {roleLabels[u.user_role]?.icon}
                                {roleLabels[u.user_role]?.label || u.user_role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isUserBanned(u) ? (
                                <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" /> BANAT</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-700">Activ</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {u.created_at ? format(new Date(u.created_at), 'd MMM yyyy', { locale: ro }) : '-'}
                            </TableCell>
                          </TableRow>
                          {expandedUserId === u.id && (
                            <TableRow key={`${u.id}-expand`}>
                              <TableCell colSpan={8} className="p-0">
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
                            <p className="font-medium text-sm truncate">{u.full_name || 'Fără nume'}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={u.user_role === 'admin' ? 'default' : 'outline'} className="gap-1 text-[10px]">
                            {roleLabels[u.user_role]?.icon}
                            {roleLabels[u.user_role]?.label || u.user_role}
                          </Badge>
                          {isUserBanned(u) ? (
                            <Badge variant="destructive" className="gap-1 text-[10px]"><Ban className="h-3 w-3" /> BANAT</Badge>
                          ) : (
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
    </AdminLayout>
  );
};

export default AdminUsers;
