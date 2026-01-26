import { useState } from "react";
import { Users, Search, MoreHorizontal, Loader2, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminUsers } from "@/hooks/queries/useAdminStats";
import { updateUserRole } from "@/features/admin/adminApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useAdminUsers(debouncedSearch || undefined);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, role);
      toast.success(`Rolul utilizatorului a fost schimbat la "${roleLabels[role].label}"`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toast.error("Eroare la schimbarea rolului");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestionare Utilizatori
          </h1>
          <p className="text-muted-foreground">
            Caută și administrează conturile utilizatorilor
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Caută Utilizatori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută după nume sau email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Utilizatorilor</CardTitle>
            <CardDescription>
              {users?.length || 0} utilizatori găsiți
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilizator</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Produse</TableHead>
                      <TableHead>Rezervări</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Înregistrat</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name || 'Fără nume'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.phone || '-'}
                        </TableCell>
                        <TableCell>{user.products_count}</TableCell>
                        <TableCell>{user.rentals_count}</TableCell>
                        <TableCell>
                          <Badge className={kycStatusLabels[user.kyc_status]?.color || "bg-gray-100"}>
                            {kycStatusLabels[user.kyc_status]?.label || user.kyc_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.user_role === 'admin' ? 'default' : 'outline'} className="gap-1">
                            {roleLabels[user.user_role]?.icon}
                            {roleLabels[user.user_role]?.label || user.user_role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {user.created_at 
                            ? format(new Date(user.created_at), 'd MMM yyyy', { locale: ro })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {updatingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => window.open(`/utilizator/${user.id}`, '_blank')}
                                >
                                  Vezi profilul public
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user.id, 'user')}
                                  disabled={user.user_role === 'user'}
                                >
                                  Setează ca Utilizator
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user.id, 'moderator')}
                                  disabled={user.user_role === 'moderator'}
                                >
                                  Setează ca Moderator
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user.id, 'admin')}
                                  disabled={user.user_role === 'admin'}
                                >
                                  Setează ca Admin
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
