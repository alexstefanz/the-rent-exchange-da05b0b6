import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, User, Mail, Phone, Calendar, Eye, Loader2,
  Shield, ShieldCheck, Ban, UserCheck, Package, ShoppingCart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import { updateUserRole } from "@/features/admin/adminApi";
import { banUser, unbanUser } from "@/features/admin/banApi";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

const kycStatusLabels: Record<string, { label: string; color: string }> = {
  not_started: { label: "Neînceput", color: "bg-gray-100 text-gray-800" },
  NOT_VERIFIED: { label: "Neverificat", color: "bg-gray-100 text-gray-800" },
  pending: { label: "În așteptare", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobat", color: "bg-green-100 text-green-800" },
  rejected: { label: "Respins", color: "bg-red-100 text-red-800" },
};

const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", icon: <Shield className="h-4 w-4" /> },
  moderator: { label: "Moderator", icon: <ShieldCheck className="h-4 w-4" /> },
  user: { label: "Utilizator", icon: <User className="h-4 w-4" /> },
};

const useAdminUserDetail = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['adminUserDetail', userId],
    queryFn: async () => {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (profileError) throw new Error(profileError.message);

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId!)
        .maybeSingle();

      // Fetch counts
      const { count: productsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId!);

      const { count: rentalsCount } = await supabase
        .from('rentals')
        .select('id', { count: 'exact', head: true })
        .eq('renter_id', userId!);

      return {
        ...profile,
        user_role: roleData?.role || 'user',
        products_count: productsCount || 0,
        rentals_count: rentalsCount || 0,
      };
    },
    enabled: !!userId,
  });
};

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [updatingRole, setUpdatingRole] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);

  const { data: userDetail, isLoading } = useAdminUserDetail(id);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminUserDetail', id] });
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const handleRoleChange = async (role: 'admin' | 'moderator' | 'user') => {
    if (!id) return;
    setUpdatingRole(true);
    try {
      await updateUserRole(id, role);
      toast.success(`Rolul a fost schimbat la "${roleLabels[role].label}"`);
      invalidate();
    } catch { toast.error("Eroare la schimbarea rolului"); }
    finally { setUpdatingRole(false); }
  };

  const handleBan = async () => {
    if (!id || !banReason.trim() || !currentUser?.id) return;
    setBanLoading(true);
    try {
      await banUser(id, banReason, currentUser.id);
      toast.success("Utilizator banat");
      invalidate();
      setBanDialog(false);
      setBanReason("");
    } catch { toast.error("Eroare la banare"); }
    finally { setBanLoading(false); }
  };

  const handleUnban = async () => {
    if (!id) return;
    setBanLoading(true);
    try {
      await unbanUser(id);
      toast.success("Utilizator debanat");
      invalidate();
    } catch { toast.error("Eroare la debanare"); }
    finally { setBanLoading(false); }
  };

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

  if (!userDetail) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Utilizatorul nu a fost găsit</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/admin/users">Înapoi la listă</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isBanned = userDetail.is_banned === true;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/users"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{userDetail.full_name || 'Fără nume'}</h1>
              <Badge variant={userDetail.user_role === 'admin' ? 'default' : 'outline'} className="gap-1">
                {roleLabels[userDetail.user_role]?.icon}
                {roleLabels[userDetail.user_role]?.label || userDetail.user_role}
              </Badge>
              {isBanned && (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" /> BANAT
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Înregistrat {userDetail.created_at ? format(new Date(userDetail.created_at), "d MMMM yyyy", { locale: ro }) : '-'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Informații utilizator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userDetail.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">{userDetail.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{userDetail.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{userDetail.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{userDetail.created_at ? format(new Date(userDetail.created_at), "d MMM yyyy", { locale: ro }) : '-'}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Produse:</span>
                    <span className="font-medium">{userDetail.products_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Rezervări:</span>
                    <span className="font-medium">{userDetail.rentals_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">KYC:</span>
                    <Badge className={kycStatusLabels[userDetail.kyc_status]?.color || "bg-gray-100"}>
                      {kycStatusLabels[userDetail.kyc_status]?.label || userDetail.kyc_status}
                    </Badge>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/utilizator/${id}`} target="_blank">
                    <Eye className="h-4 w-4 mr-2" /> Vezi profil public
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Ban Info */}
            {isBanned && userDetail.ban_reason && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-destructive">Motiv ban:</p>
                  <p className="text-sm mt-1">{userDetail.ban_reason}</p>
                  {userDetail.banned_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Banat la {format(new Date(userDetail.banned_at), "d MMM yyyy HH:mm", { locale: ro })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Role Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Gestionare rol
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {(['user', 'moderator', 'admin'] as const).map((role) => (
                    <Button
                      key={role}
                      variant={userDetail.user_role === role ? 'default' : 'outline'}
                      onClick={() => handleRoleChange(role)}
                      disabled={updatingRole || userDetail.user_role === role}
                      className="gap-2"
                    >
                      {updatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : roleLabels[role]?.icon}
                      {roleLabels[role].label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ban Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="h-5 w-5" /> Gestionare acces
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isBanned ? (
                  <Button onClick={handleUnban} disabled={banLoading} variant="outline" className="gap-2">
                    {banLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    Debanează utilizatorul
                  </Button>
                ) : (
                  <Button onClick={() => setBanDialog(true)} variant="destructive" className="gap-2">
                    <Ban className="h-4 w-4" /> Banează utilizatorul
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialog} onOpenChange={(open) => { setBanDialog(open); if (!open) setBanReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banează utilizatorul</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să banezi „{userDetail.full_name || 'Utilizator'}"? Utilizatorul nu va mai putea crea anunțuri sau rezervări.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Motivul banării..." value={banReason} onChange={(e) => setBanReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(false)}>Anulează</Button>
            <Button variant="destructive" onClick={handleBan} disabled={!banReason.trim() || banLoading}>
              {banLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Banează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUserDetail;
