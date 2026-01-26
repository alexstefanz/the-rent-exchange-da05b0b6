import { 
  Users, 
  Package, 
  CalendarCheck, 
  Wallet, 
  Clock,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { useAdminStats, useAdminRentals } from "@/hooks/queries/useAdminStats";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  overdue: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  active: "Activă",
  completed: "Finalizată",
  cancelled: "Anulată",
  overdue: "Întârziată",
};

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentRentals, isLoading: rentalsLoading } = useAdminRentals(undefined, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bun venit în panoul de administrare. Aici poți vedea o privire de ansamblu asupra platformei.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Total Utilizatori"
                value={stats?.total_users || 0}
                icon={<Users className="h-4 w-4" />}
              />
              <StatsCard
                title="Produse Active"
                value={stats?.total_products || 0}
                icon={<Package className="h-4 w-4" />}
              />
              <StatsCard
                title="Total Rezervări"
                value={stats?.total_rentals || 0}
                icon={<CalendarCheck className="h-4 w-4" />}
              />
              <StatsCard
                title="Rezervări Active"
                value={stats?.active_rentals || 0}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatsCard
                title="Venituri Luna Asta"
                value={formatCurrency(stats?.revenue_this_month || 0)}
                icon={<Wallet className="h-4 w-4" />}
              />
              <StatsCard
                title="KYC În Așteptare"
                value={stats?.pending_kyc || 0}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
            </>
          )}
        </div>

        {/* Recent Rentals & Quick Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Rentals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Ultimele Rezervări
              </CardTitle>
              <CardDescription>
                Cele mai recente rezervări pe platformă
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rentalsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentRentals && recentRentals.length > 0 ? (
                <div className="space-y-4">
                  {recentRentals.map((rental) => (
                    <div 
                      key={rental.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {rental.product_title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rental.renter_name} → {rental.owner_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rental.start_date), 'd MMM', { locale: ro })} - {format(new Date(rental.end_date), 'd MMM yyyy', { locale: ro })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={statusColors[rental.status] || "bg-gray-100"}>
                          {statusLabels[rental.status] || rental.status}
                        </Badge>
                        <p className="text-sm font-medium">
                          {formatCurrency(rental.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nu există rezervări încă</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Acțiuni Rapide
              </CardTitle>
              <CardDescription>
                Acțiuni frecvente pentru administrare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <a 
                  href="/admin/reservations" 
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <CalendarCheck className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Gestionează Rezervări</p>
                    <p className="text-sm text-muted-foreground">
                      Vezi și modifică statusul rezervărilor
                    </p>
                  </div>
                </a>
                <a 
                  href="/admin/kyc" 
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Verificări KYC</p>
                    <p className="text-sm text-muted-foreground">
                      Aprobă sau respinge verificările de identitate
                    </p>
                  </div>
                </a>
                <a 
                  href="/admin/finances" 
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Wallet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Rapoarte Financiare</p>
                    <p className="text-sm text-muted-foreground">
                      Vezi veniturile și tranzacțiile platformei
                    </p>
                  </div>
                </a>
                <a 
                  href="/admin/users" 
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Gestionează Utilizatori</p>
                    <p className="text-sm text-muted-foreground">
                      Caută și administrează conturile utilizatorilor
                    </p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
