import { useState } from "react";
import { CalendarCheck, Filter, MoreHorizontal, Loader2 } from "lucide-react";
import SortableTableHead, { SortDirection, sortData, useToggleSort } from "@/components/admin/SortableTableHead";
import TableColumnFilterRow, { applyColumnFilters, ColumnFilterConfig } from "@/components/admin/TableColumnFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminRentals } from "@/hooks/queries/useAdminStats";
import { updateRentalStatus } from "@/features/admin/adminApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

const paymentStatusLabels: Record<string, string> = {
  pending: "Neplătit",
  paid: "Plătit",
  refunded: "Rambursat",
  failed: "Eșuat",
};

const AdminReservations = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const handleSort = useToggleSort(setSortKey, setSortDirection, sortKey, sortDirection);

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const rentalColumnFilters: ColumnFilterConfig[] = [
    { key: "product_title", type: "text", placeholder: "Produs..." },
    { key: "renter_name", type: "text", placeholder: "Chiriaș..." },
    { key: "owner_name", type: "text", placeholder: "Proprietar..." },
    { key: "start_date", type: "text", placeholder: "Dată..." },
    { key: "subtotal", type: "text", placeholder: "Sumă..." },
    { key: "status", type: "select", placeholder: "Status", options: [
      { value: "pending", label: "În așteptare" },
      { value: "confirmed", label: "Confirmată" },
      { value: "active", label: "Activă" },
      { value: "completed", label: "Finalizată" },
      { value: "cancelled", label: "Anulată" },
      { value: "overdue", label: "Întârziată" },
    ]},
    { key: "payment_status", type: "select", placeholder: "Plată", options: [
      { value: "pending", label: "Neplătit" },
      { value: "paid", label: "Plătit" },
      { value: "refunded", label: "Rambursat" },
      { value: "failed", label: "Eșuat" },
    ]},
    { key: "_actions", type: "text" },
  ];
  
  const { data: rentals, isLoading } = useAdminRentals(
    statusFilter || undefined
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleStatusChange = async (rentalId: string, newStatus: string) => {
    setUpdatingId(rentalId);
    try {
      await updateRentalStatus(rentalId, newStatus);
      toast.success(`Statusul rezervării a fost actualizat la "${statusLabels[newStatus]}"`);
      queryClient.invalidateQueries({ queryKey: ['adminRentals'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (error) {
      toast.error("Eroare la actualizarea statusului");
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
            <CalendarCheck className="h-8 w-8" />
            Gestionare Rezervări
          </h1>
          <p className="text-muted-foreground">
            Vezi și gestionează toate rezervările de pe platformă
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Rentals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Rezervărilor</CardTitle>
            <CardDescription>
              {rentals?.length || 0} rezervări găsite
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : rentals && rentals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead label="Produs" sortKey="product_title" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Chiriaș" sortKey="renter_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Proprietar" sortKey="owner_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Perioada" sortKey="start_date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Suma" sortKey="subtotal" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <TableHead>Status</TableHead>
                      <TableHead>Plată</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableColumnFilterRow filters={rentalColumnFilters} values={columnFilters} onChange={handleColumnFilter} />
                    {sortData(applyColumnFilters(rentals, columnFilters), sortKey, sortDirection).map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="font-medium max-w-[200px]">
                          <span className="line-clamp-1">{rental.product_title}</span>
                        </TableCell>
                        <TableCell>{rental.renter_name}</TableCell>
                        <TableCell>{rental.owner_name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(rental.start_date), 'd MMM', { locale: ro })} - {format(new Date(rental.end_date), 'd MMM', { locale: ro })}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {rental.rental_days} zile
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatCurrency(rental.subtotal)}</div>
                            <div className="text-xs text-muted-foreground">
                              Comision: {formatCurrency(rental.platform_fee)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[rental.status] || "bg-gray-100"}>
                            {statusLabels[rental.status] || rental.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rental.payment_status === 'paid' ? 'default' : 'outline'}>
                            {paymentStatusLabels[rental.payment_status] || rental.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {updatingId === rental.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {rental.status === 'pending' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(rental.id, 'confirmed')}
                                  >
                                    Confirmă rezervarea
                                  </DropdownMenuItem>
                                )}
                                {rental.status === 'confirmed' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(rental.id, 'active')}
                                  >
                                    Marchează ca activă
                                  </DropdownMenuItem>
                                )}
                                {rental.status === 'active' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(rental.id, 'completed')}
                                    >
                                      Marchează finalizată
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(rental.id, 'overdue')}
                                      className="text-orange-600"
                                    >
                                      Marchează întârziată
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {!['completed', 'cancelled'].includes(rental.status) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(rental.id, 'cancelled')}
                                    className="text-destructive"
                                  >
                                    Anulează rezervarea
                                  </DropdownMenuItem>
                                )}
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
