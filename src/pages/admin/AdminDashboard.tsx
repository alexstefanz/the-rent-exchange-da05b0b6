import { 
  Users, 
  Package, 
  CalendarCheck, 
  Wallet, 
  Clock,
  ShieldCheck,
  Banknote,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import DashboardCategoriesWidget from "@/components/admin/DashboardCategoriesWidget";
import DashboardActivityWidget from "@/components/admin/DashboardActivityWidget";
import { useAdminStats, useAdminRentals } from "@/hooks/queries/useAdminStats";
import { useAdminNotificationSummary } from "@/hooks/queries/useAdminNotifications";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
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
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: summary } = useAdminNotificationSummary();
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
      <div className="space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">— Privire de ansamblu</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                onClick={() => navigate('/admin/users')}
              />
              <StatsCard
                title="Produse Active"
                value={stats?.total_products || 0}
                icon={<Package className="h-4 w-4" />}
                onClick={() => navigate('/admin/products')}
              />
              <StatsCard
                title="Total Rezervări"
                value={stats?.total_rentals || 0}
                icon={<CalendarCheck className="h-4 w-4" />}
                onClick={() => navigate('/admin/reservations')}
              />
              <StatsCard
                title="Rezervări Active"
                value={stats?.active_rentals || 0}
                icon={<Clock className="h-4 w-4" />}
                onClick={() => navigate('/admin/reservations')}
              />
              <StatsCard
                title="Venituri Luna Asta"
                value={formatCurrency(stats?.revenue_this_month || 0)}
                icon={<Wallet className="h-4 w-4" />}
                onClick={() => navigate('/admin/finances')}
              />
              <StatsCard
                title="Bani Retrași"
                value={formatCurrency(stats?.total_withdrawn || 0)}
                icon={<Banknote className="h-4 w-4" />}
                onClick={() => navigate('/admin/finances')}
              />
              <StatsCard
                title="Rapoarte Deschise"
                value={summary?.pending_reports || 0}
                icon={<Flag className="h-4 w-4" />}
                onClick={() => navigate('/admin/reports')}
              />
            </>
          )}
        </div>

        {/* Recent Rentals & Quick Stats */}
        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          {/* Recent Rentals */}
          <Card className="overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Ultimele Rezervări
              </CardTitle>
              <CardDescription>
                Cele mai recente rezervări pe platformă
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {rentalsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentRentals && recentRentals.length > 0 ? (
                <div className="space-y-4">
                  {recentRentals.map((rental) => (
                    <a
                      key={rental.id}
                      href={`/rezervari/${rental.public_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-w-0 cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-mono text-[10px] text-primary font-semibold">
                          {rental.public_id}
                        </p>
                        <p className="font-medium text-sm truncate">
                          {rental.product_title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {rental.renter_name} → {rental.owner_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rental.start_date), 'd MMM', { locale: ro })} - {format(new Date(rental.end_date), 'd MMM yyyy', { locale: ro })}
                        </p>
                      </div>
                      <div className="text-right space-y-1 shrink-0">
                        <Badge className={statusColors[rental.status] || "bg-gray-100"}>
                          {statusLabels[rental.status] || rental.status}
                        </Badge>
                        <p className="text-sm font-medium">
                          {formatCurrency(rental.subtotal)}
                        </p>
                      </div>
                    </a>
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

          {/* Activity feed */}
          <DashboardActivityWidget />

          {/* Categories Widget */}
          <DashboardCategoriesWidget />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
