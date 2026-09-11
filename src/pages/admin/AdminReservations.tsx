import { useState, useMemo } from "react";
import { CalendarCheck, Filter, Loader2, ChevronDown, ChevronUp, User, MapPin, Tag, DollarSign, Calendar, Copy, Hash, ExternalLink } from "lucide-react";
import SortableTableHead, { SortDirection, sortData, useToggleSort } from "@/components/admin/SortableTableHead";
import TableColumnFilterRow, { applyColumnFilters, ColumnFilterConfig } from "@/components/admin/TableColumnFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminRentals } from "@/hooks/queries/useAdminStats";
import { updateRentalStatus } from "@/features/admin/adminApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RentalTimeline from "@/components/dashboard/RentalTimeline";
import RentalPaymentStatus from "@/components/admin/RentalPaymentStatus";
import SourceBadge from "@/components/admin/SourceBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const paymentStatusLabels: Record<string, string> = {
  pending: "Neplătit",
  unpaid: "Neplătit",
  authorized: "Autorizat",
  captured: "Plătit",
  paid: "Plătit",
  refunded: "Rambursat",
  failed: "Eșuat",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-red-100 text-red-800",
  unpaid: "bg-red-100 text-red-800",
  authorized: "bg-blue-100 text-blue-800",
  captured: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-orange-100 text-orange-800",
  failed: "bg-red-100 text-red-800",
};

const RentalExpandedPanel = ({
  rental,
  updatingId,
  onStatusChange,
  formatCurrency,
}: {
  rental: any;
  updatingId: string | null;
  onStatusChange: (id: string, status: string) => void;
  formatCurrency: (v: number) => string;
}) => {
  const isUpdating = updatingId === rental.id;
  const copyId = (value: string, label: string) => {
    navigator.clipboard?.writeText(value).then(
      () => toast.success(`${label} copiat: ${value}`),
      () => toast.error("Nu am putut copia"),
    );
  };
  return (
    <div className="p-4 space-y-3 bg-muted/30 border-t">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-3 border">
        <Hash className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase font-semibold text-muted-foreground">ID Rezervare</span>
        <button
          type="button"
          onClick={() => copyId(rental.public_id, "ID Rezervare")}
          className="font-mono text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
          title="Click pentru a copia"
        >
          {rental.public_id}
          <Copy className="h-3 w-3" />
        </button>
        <span className="text-xs text-muted-foreground ml-auto">
          UUID:{" "}
          <button
            type="button"
            onClick={() => copyId(rental.id, "UUID")}
            className="font-mono hover:underline"
            title="Click pentru a copia UUID-ul intern"
          >
            {rental.id.slice(0, 8)}…
          </button>
        </span>
        <Button asChild size="sm" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <a href={`/rezervari/${rental.public_id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Deschide pagina închirierii
          </a>
        </Button>
      </div>
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Sumar</TabsTrigger>
          <TabsTrigger value="payment">Status plăți</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-3">
          <div className="rounded-lg bg-card p-3 border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Timeline rezervare</p>
            <RentalTimeline rental={{
              status: rental.status,
              payment_status: rental.payment_status,
              end_date: rental.end_date,
              handover_confirmed_at: rental.handover_confirmed_at,
              return_confirmed_at: rental.return_confirmed_at,
              refunded_at: rental.refunded_at,
            }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Proprietar:</span>
          <span className="font-medium">{rental.owner_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Categorie:</span>
          <span className="font-medium">{rental.category || '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Oraș:</span>
          <span className="font-medium">{rental.location_city || '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Comision:</span>
          <span className="font-medium">{formatCurrency(rental.platform_fee)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Perioadă:</span>
          <span className="font-medium">
            {format(new Date(rental.start_date), 'd MMM', { locale: ro })} - {format(new Date(rental.end_date), 'd MMM', { locale: ro })} ({rental.rental_days} zile)
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Plată:</span>{" "}
          <Badge className={paymentStatusColors[rental.payment_status] || "bg-gray-100 text-gray-800"}>
            {paymentStatusLabels[rental.payment_status] || rental.payment_status}
          </Badge>
        </div>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {rental.status === 'pending' && (
              <Button size="sm" onClick={() => onStatusChange(rental.id, 'confirmed')}>Confirmă rezervarea</Button>
            )}
            {rental.status === 'confirmed' && (
              <Button size="sm" onClick={() => onStatusChange(rental.id, 'active')}>Marchează ca activă</Button>
            )}
            {rental.status === 'active' && (
              <>
                <Button size="sm" onClick={() => onStatusChange(rental.id, 'completed')}>Marchează finalizată</Button>
                <Button size="sm" variant="outline" className="text-orange-600" onClick={() => onStatusChange(rental.id, 'overdue')}>Marchează întârziată</Button>
              </>
            )}
            {!['completed', 'cancelled'].includes(rental.status) && (
              <Button size="sm" variant="destructive" onClick={() => onStatusChange(rental.id, 'cancelled')}>Anulează</Button>
            )}
          </>
        )}
          </div>
        </TabsContent>
        <TabsContent value="payment">
          <RentalPaymentStatus rentalId={rental.id} mode="admin" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminReservations = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { from?: Date; to?: Date }>>({});
  const queryClient = useQueryClient();
  const handleSort = useToggleSort(setSortKey, setSortDirection, sortKey, sortDirection);

  const { data: categories } = useQuery({
    queryKey: ['platformCategories'],
    queryFn: async () => {
      const { data } = await supabase.from('platform_categories').select('name').eq('is_active', true).order('sort_order');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (key: string, range: { from?: Date; to?: Date }) => {
    setDateRangeFilters(prev => ({ ...prev, [key]: range }));
  };

  const { data: rentals, isLoading } = useAdminRentals(statusFilter || undefined, 50, 0, sourceFilter || undefined);

  const cityOptions = useMemo(() => {
    if (!rentals) return [];
    const cities = [...new Set(rentals.map(r => r.location_city).filter(c => c && c !== '-'))];
    return cities.sort((a, b) => a.localeCompare(b, 'ro')).map(c => ({ value: c, label: c }));
  }, [rentals]);

  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    return categories.map(c => ({ value: c.name, label: c.name }));
  }, [categories]);

  const rentalColumnFilters: ColumnFilterConfig[] = [
    { key: "public_id", type: "text", placeholder: "RNT-..." },
    { key: "product_title", type: "text", placeholder: "Produs..." },
    { key: "renter_name", type: "text", placeholder: "Chiriaș..." },
    { key: "owner_name", type: "text", placeholder: "Proprietar..." },
    { key: "subtotal", type: "amountrange", placeholder: "Sumă" },
    { key: "status", type: "select", placeholder: "Status", options: [
      { value: "pending", label: "În așteptare" },
      { value: "confirmed", label: "Confirmată" },
      { value: "active", label: "Activă" },
      { value: "completed", label: "Finalizată" },
      { value: "cancelled", label: "Anulată" },
      { value: "overdue", label: "Întârziată" },
    ]},
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 0 }).format(value);
  };

  const handleStatusChange = async (rentalId: string, newStatus: string) => {
    setUpdatingId(rentalId);
    try {
      await updateRentalStatus(rentalId, newStatus);
      const ref = rentals?.find((r: any) => r.id === rentalId)?.public_id || rentalId.slice(0, 8);
      toast.success(`Statusul ${ref} a fost actualizat la "${statusLabels[newStatus]}"`);
      queryClient.invalidateQueries({ queryKey: ['adminRentals'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (error) {
      toast.error("Eroare la actualizarea statusului");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return sortData(
      applyColumnFilters(rentals, columnFilters, dateRangeFilters),
      sortKey,
      sortDirection
    );
  }, [rentals, columnFilters, dateRangeFilters, sortKey, sortDirection]);

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          <h1 className="text-xl font-bold tracking-tight">Gestionare Rezervări</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">— Vezi și gestionează rezervările</span>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toate statusurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                <SelectItem value="pending">În așteptare</SelectItem>
                <SelectItem value="confirmed">Confirmate</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Finalizate</SelectItem>
                <SelectItem value="cancelled">Anulate</SelectItem>
                <SelectItem value="overdue">Întârziate</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista Rezervărilor</CardTitle>
            <CardDescription>{filteredData.length} rezervări găsite</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : rentals && rentals.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead label="ID" sortKey="public_id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Produs" sortKey="product_title" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Chiriaș" sortKey="renter_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Proprietar" sortKey="owner_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Perioada" sortKey="start_date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <SortableTableHead label="Suma" sortKey="subtotal" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <TableHead>Status</TableHead>
                        <TableHead>Plată</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableColumnFilterRow
                        filters={rentalColumnFilters}
                        values={columnFilters}
                        onChange={handleColumnFilter}
                        dateRangeValues={dateRangeFilters}
                        onDateRangeChange={handleDateRangeChange}
                      />
                      {filteredData.map((rental) => (
                        <>
                          <TableRow key={rental.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(rental.id)}>
                            <TableCell className="whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(rental.public_id);
                                  toast.success(`Copiat: ${rental.public_id}`);
                                }}
                                className="font-mono text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                title="Click pentru a copia ID-ul"
                              >
                                {rental.public_id}
                                <Copy className="h-3 w-3 opacity-60" />
                              </button>
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className="line-clamp-1">{rental.product_title}</span>
                                {expandedId === rental.id ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                              </div>
                            </TableCell>
                            <TableCell>{rental.renter_name}</TableCell>
                            <TableCell>{rental.owner_name}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(rental.start_date), 'd MMM', { locale: ro })} - {format(new Date(rental.end_date), 'd MMM', { locale: ro })}
                              <br /><span className="text-xs text-muted-foreground">{rental.rental_days} zile</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{formatCurrency(rental.subtotal)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[rental.status] || "bg-gray-100"}>
                                {statusLabels[rental.status] || rental.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={paymentStatusColors[rental.payment_status] || "bg-gray-100 text-gray-800"}>
                                {paymentStatusLabels[rental.payment_status] || rental.payment_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {expandedId === rental.id && (
                            <TableRow key={`${rental.id}-expand`}>
                              <TableCell colSpan={8} className="p-0">
                                <RentalExpandedPanel rental={rental} updatingId={updatingId} onStatusChange={handleStatusChange} formatCurrency={formatCurrency} />
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
                  {filteredData.map((rental) => (
                    <Card key={rental.id} className="overflow-hidden">
                      <div className="p-3 cursor-pointer flex items-center justify-between" onClick={() => toggleExpand(rental.id)}>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(rental.public_id);
                              toast.success(`Copiat: ${rental.public_id}`);
                            }}
                            className="font-mono text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 mb-0.5"
                          >
                            {rental.public_id}
                            <Copy className="h-2.5 w-2.5 opacity-60" />
                          </button>
                          <p className="text-sm font-medium truncate">{rental.product_title}</p>
                          <p className="text-xs text-muted-foreground">{rental.renter_name} → {rental.owner_name} • {format(new Date(rental.start_date), 'd MMM', { locale: ro })} - {format(new Date(rental.end_date), 'd MMM', { locale: ro })}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium">{formatCurrency(rental.subtotal)}</span>
                          <Badge className={`${statusColors[rental.status] || "bg-gray-100"} text-[10px]`}>
                            {statusLabels[rental.status] || rental.status}
                          </Badge>
                          {expandedId === rental.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                      {expandedId === rental.id && (
                        <RentalExpandedPanel rental={rental} updatingId={updatingId} onStatusChange={handleStatusChange} formatCurrency={formatCurrency} />
                      )}
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există rezervări{statusFilter && ` cu status "${statusLabels[statusFilter]}"`}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;
