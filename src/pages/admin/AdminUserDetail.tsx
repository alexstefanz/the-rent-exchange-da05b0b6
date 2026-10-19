import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, User, Mail, Phone, Calendar, Eye, Loader2,
  Shield, ShieldCheck, Ban, UserCheck, Package, ShoppingCart,
  MessageCircle, Building2, AlertTriangle, Tags, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import UserProductsTab from "@/components/admin/user-detail/UserProductsTab";
import UserRentalsTab from "@/components/admin/user-detail/UserRentalsTab";
import UserReviewsTab from "@/components/admin/user-detail/UserReviewsTab";
import UserConversationsTab from "@/components/admin/user-detail/UserConversationsTab";
import UserActivityTab from "@/components/admin/user-detail/UserActivityTab";
import AdminSpecializationsTab from "@/components/admin/user-detail/AdminSpecializationsTab";
import { updateUserRole } from "@/features/admin/adminApi";
import { banUser, unbanUser, adminDeleteUser } from "@/features/admin/banApi";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";

const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", icon: <Shield className="h-4 w-4" /> },
  moderator: { label: "Moderator", icon: <ShieldCheck className="h-4 w-4" /> },
  user: { label: "Utilizator", icon: <User className="h-4 w-4" /> },
};

const useAdminUserDetail = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['adminUserDetail', userId],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (profileError) throw new Error(profileError.message);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId!)
        .maybeSingle();

      const { count: productsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId!);

      const { count: rentalsCount } = await supabase
        .from('rentals')
        .select('id', { count: 'exact', head: true })
        .or(`renter_id.eq.${userId!},owner_id.eq.${userId!}`);

      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .or(`buyer_id.eq.${userId!},owner_id.eq.${userId!}`);

      return {
        ...profile,
        user_role: roleData?.role || 'user',
        products_count: productsCount || 0,
        rentals_count: rentalsCount || 0,
        conversations_count: conversationsCount || 0,
      };
    },
    enabled: !!userId,
  });
};

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [updatingRole, setUpdatingRole] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await adminDeleteUser(id);
      toast.success("Cont șters definitiv");
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      navigate('/admin/users');
    } catch (e) {
      toast.error("Eroare la ștergere: " + (e as Error).message);
    } finally {
      setDeleteLoading(false);
    }
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
              <Badge variant={(userDetail as any).identity_status === 'verified' ? 'default' : 'outline'}>
                Identitate: {({ verified: 'Verificată', processing: 'În procesare', requires_input: 'Necesită reluare', canceled: 'Anulată' } as Record<string, string>)[(userDetail as any).identity_status] || 'Neverificată'}
                {(userDetail as any).identity_verified_at ? ` · ${format(new Date((userDetail as any).identity_verified_at), 'd MMM yyyy', { locale: ro })}` : ''}
              </Badge>
              {userDetail.is_deactivated && (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> DEZACTIVAT
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Înregistrat {userDetail.created_at ? format(new Date(userDetail.created_at), "d MMMM yyyy", { locale: ro }) : '-'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card - Left Column */}
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

                {/* Account Type */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tip cont:</span>
                    <Badge variant="outline">
                      {userDetail.account_type === 'business' ? '🏢 Business' : '👤 Individual'}
                    </Badge>
                  </div>
                </div>

                {/* Company Info */}
                {userDetail.account_type === 'business' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Building2 className="h-4 w-4" /> Detalii companie
                      </div>
                      {userDetail.company_name && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nume:</span>
                          <span className="font-medium text-right">{userDetail.company_name}</span>
                        </div>
                      )}
                      {userDetail.cui && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CUI:</span>
                          <span className="font-medium">{userDetail.cui}</span>
                        </div>
                      )}
                      {userDetail.reg_com && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reg. com.:</span>
                          <span className="font-medium">{userDetail.reg_com}</span>
                        </div>
                      )}
                      {userDetail.company_address && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Adresă:</span>
                          <p className="text-xs mt-0.5">{userDetail.company_address}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Stats */}
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
                    <span className="text-muted-foreground flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Conversații:</span>
                    <span className="font-medium">{userDetail.conversations_count}</span>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Acțiuni rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Role */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Schimbă rolul:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['user', 'moderator', 'admin'] as const).map((role) => (
                      <Button
                        key={role}
                        variant={userDetail.user_role === role ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRoleChange(role)}
                        disabled={updatingRole || userDetail.user_role === role}
                        className="gap-1 text-xs"
                      >
                        {updatingRole ? <Loader2 className="h-3 w-3 animate-spin" /> : roleLabels[role]?.icon}
                        {roleLabels[role].label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                {/* Ban */}
                {isBanned ? (
                  <Button onClick={handleUnban} disabled={banLoading} variant="outline" size="sm" className="w-full gap-2">
                    {banLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    Debanează
                  </Button>
                ) : (
                  <Button onClick={() => setBanDialog(true)} variant="destructive" size="sm" className="w-full gap-2">
                    <Ban className="h-4 w-4" /> Banează
                  </Button>
                )}
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  disabled={kycLoading || ((userDetail as any).identity_status ?? 'unverified') === 'unverified'}
                  onClick={async () => {
                    if (!id || !window.confirm("Dezactivezi verificarea KYC (Stripe Identity) pentru acest utilizator? Va trebui să reia verificarea.")) return;
                    setKycLoading(true);
                    setKycMsg(null);
                    const { error } = await (supabase.rpc as any)('admin_reset_identity_verification', { _user_id: id });
                    setKycLoading(false);
                    setKycMsg(error ? `Eroare: ${error.message}` : "Verificarea KYC a fost dezactivată.");
                    if (!error) invalidate();
                  }}
                >
                  {kycLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Dezactivează verificarea KYC
                </Button>
                {kycMsg && <p className="text-xs text-muted-foreground">{kycMsg}</p>}
                <Separator />
                <Button
                  onClick={() => { setDeleteConfirm(""); setDeleteDialog(true); }}
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  disabled={currentUser?.id === id}
                >
                  <Trash2 className="h-4 w-4" /> Șterge cont (testare)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tabs - Right Column */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="products" className="gap-1 text-xs">
                  <Package className="h-3.5 w-3.5" /> Produse ({userDetail.products_count})
                </TabsTrigger>
                <TabsTrigger value="rentals" className="gap-1 text-xs">
                  <ShoppingCart className="h-3.5 w-3.5" /> Rezervări ({userDetail.rentals_count})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-1 text-xs">
                  ⭐ Recenzii
                </TabsTrigger>
                <TabsTrigger value="conversations" className="gap-1 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> Chat ({userDetail.conversations_count})
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1 text-xs">
                  📋 Activitate
                </TabsTrigger>
                {userDetail.user_role === 'admin' && (
                  <TabsTrigger value="specializations" className="gap-1 text-xs">
                    <Tags className="h-3.5 w-3.5" /> Specializări
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="products">
                <Card>
                  <CardContent className="pt-6">
                    {id && <UserProductsTab userId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rentals">
                <Card>
                  <CardContent className="pt-6">
                    {id && <UserRentalsTab userId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardContent className="pt-6">
                    {id && <UserReviewsTab userId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conversations">
                <Card>
                  <CardContent className="pt-6">
                    {id && <UserConversationsTab userId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardContent className="pt-6">
                    {id && <UserActivityTab userId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>

              {userDetail.user_role === 'admin' && (
                <TabsContent value="specializations">
                  <Card>
                    <CardContent className="pt-6">
                      {id && <AdminSpecializationsTab userId={id} />}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
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

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onOpenChange={(open) => { setDeleteDialog(open); if (!open) setDeleteConfirm(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Șterge contul definitiv
            </DialogTitle>
            <DialogDescription>
              Această acțiune este <strong>ireversibilă</strong>. Va șterge contul „{userDetail.full_name || userDetail.email}",
              toate produsele, rezervările, conversațiile, recenziile și activitatea asociată.
              <br /><br />
              Pentru confirmare, scrie <code className="bg-muted px-1.5 py-0.5 rounded">STERGE</code> mai jos.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="STERGE"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            rows={1}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Anulează</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm.trim() !== "STERGE" || deleteLoading}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Șterge definitiv
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUserDetail;
