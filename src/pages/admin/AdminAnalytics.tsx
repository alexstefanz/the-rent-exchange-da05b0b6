import { BarChart3, Users, Package, TrendingUp, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminStats, useAdminRentals } from "@/hooks/queries/useAdminStats";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  'În așteptare': '#F97316',
  'Confirmate': '#22C55E',
  'Active': '#3B82F6',
  'Finalizate': '#6B7280',
  'Anulate': '#1a1a1a',
};

const AdminAnalytics = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: rentals, isLoading: rentalsLoading } = useAdminRentals(undefined, 100);

  // Calculate status distribution from rentals
  const statusDistribution = rentals?.reduce((acc, rental) => {
    acc[rental.status] = (acc[rental.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name === 'pending' ? 'În așteptare' :
          name === 'confirmed' ? 'Confirmate' :
          name === 'active' ? 'Active' :
          name === 'completed' ? 'Finalizate' :
          name === 'cancelled' ? 'Anulate' : name,
    value
  }));

  // Mock monthly data
  const monthlyData = [
    { name: 'Ian', rezervari: 12, utilizatori: 45, confirmate: 8 },
    { name: 'Feb', rezervari: 19, utilizatori: 52, confirmate: 14 },
    { name: 'Mar', rezervari: 25, utilizatori: 68, confirmate: 20 },
    { name: 'Apr', rezervari: 32, utilizatori: 85, confirmate: 26 },
    { name: 'Mai', rezervari: 28, utilizatori: 92, confirmate: 22 },
    { name: 'Iun', rezervari: 45, utilizatori: 110, confirmate: 38 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Analytics & Statistici</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">— Performanța platformei</span>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Utilizatori</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Conturi înregistrate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produse Active</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Disponibile pentru închiriere
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rezervări per anunț</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.total_products && stats.total_rentals
                      ? (stats.total_rentals / stats.total_products).toFixed(1)
                      : "0,0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Media rezervărilor pe anunț publicat
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rezervări Active</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_rentals || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    În desfășurare acum
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuția Rezervărilor</CardTitle>
              <CardDescription>
                După status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {rentalsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                ) : pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nu există date pentru afișare
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Tendințe Lunare</CardTitle>
              <CardDescription>
                Rezervări și utilizatori noi pe lună
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="rezervari" fill="hsl(var(--primary))" name="Rezervări" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="confirmate" fill="#22C55E" name="Confirmate" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="utilizatori" fill="hsl(var(--chart-2))" name="Utilizatori" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Categorii</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Electronice</span>
                  <span className="text-sm font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sport</span>
                  <span className="text-sm font-medium">24%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Unelte</span>
                  <span className="text-sm font-medium">18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Evenimente</span>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Altele</span>
                  <span className="text-sm font-medium">11%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Orașe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">București</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cluj-Napoca</span>
                  <span className="text-sm font-medium">18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Timișoara</span>
                  <span className="text-sm font-medium">12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Iași</span>
                  <span className="text-sm font-medium">10%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Altele</span>
                  <span className="text-sm font-medium">15%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metrici Cheie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Durată medie rezervare</span>
                  <span className="text-sm font-medium">3.2 zile</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Valoare medie</span>
                  <span className="text-sm font-medium">185 RON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rata anulare</span>
                  <span className="text-sm font-medium">8.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Timp răspuns mediu</span>
                  <span className="text-sm font-medium">2.1 ore</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rata recenzii</span>
                  <span className="text-sm font-medium">72%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
