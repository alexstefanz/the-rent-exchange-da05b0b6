import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Shield, ShieldCheck, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const navigate = useNavigate();

  const { data: users, isLoading } = useAdminUsers(debouncedSearch || undefined);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const isUserBanned = (u: any) => u.is_banned === true;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" /> Gestionare Utilizatori
          </h1>
          <p className="text-muted-foreground">Caută și administrează conturile utilizatorilor</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" /> Caută Utilizatori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Caută după nume sau email..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista Utilizatorilor</CardTitle>
            <CardDescription>{users?.length || 0} utilizatori găsiți</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
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
                      <TableRow
                        key={u.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{u.full_name || 'Fără nume'}</span>
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
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="h-3 w-3" /> BANAT
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-700">Activ</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {u.created_at ? format(new Date(u.created_at), 'd MMM yyyy', { locale: ro }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
