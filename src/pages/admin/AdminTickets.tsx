import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TicketCheck, Search, Clock, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useOpsTickets } from "@/hooks/queries/useOpsTickets";
import {
  CATEGORY_GROUP_LABELS,
  CATEGORY_GROUPS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type FetchTicketsFilters,
} from "@/features/admin/opsTicketsApi";
import { format, differenceInHours } from "date-fns";
import { ro } from "date-fns/locale";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  WAITING_CUSTOMER: "bg-purple-100 text-purple-800",
  WAITING_OWNER: "bg-purple-100 text-purple-800",
  WAITING_INTERNAL: "bg-gray-100 text-gray-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-600",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const AdminTickets = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FetchTicketsFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const { data: tickets, isLoading } = useOpsTickets(filters);

  const handleSearch = () => {
    setFilters(f => ({ ...f, search: searchInput || undefined }));
  };

  const stats = {
    newCount: tickets?.filter(t => t.status === 'NEW').length || 0,
    inProgress: tickets?.filter(t => t.status === 'IN_PROGRESS').length || 0,
    urgent: tickets?.filter(t => t.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(t.status)).length || 0,
  };

  const getStatusLabel = (s: string) => STATUS_OPTIONS.find(o => o.value === s)?.label || s;
  const getPriorityLabel = (p: string) => PRIORITY_OPTIONS.find(o => o.value === p)?.label || p;

  const isSlaBreached = (ticket: { priority: string; status: string; created_at: string }) =>
    ticket.priority === 'URGENT' && ticket.status === 'NEW' && differenceInHours(new Date(), new Date(ticket.created_at)) >= 2;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TicketCheck className="h-8 w-8" /> Tickete Operaționale
            </h1>
            <p className="text-muted-foreground">Gestionează probleme operaționale marketplace</p>
          </div>
          <Button onClick={() => navigate('/admin/tickets/new')}>
            <Plus className="h-4 w-4 mr-2" /> Ticket nou
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <TicketCheck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.newCount}</p>
                <p className="text-sm text-muted-foreground">Noi</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">În lucru</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-sm text-muted-foreground">Urgente nerezolvate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Caută TCK-... sau titlu"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-[220px]"
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select value={filters.status || "all"} onValueChange={v => setFilters(f => ({ ...f, status: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.priority || "all"} onValueChange={v => setFilters(f => ({ ...f, priority: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Prioritate" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate prioritățile</SelectItem>
                  {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.category_group || "all"} onValueChange={v => setFilters(f => ({ ...f, category_group: v === 'all' ? undefined : v, category_type: undefined }))}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate categoriile</SelectItem>
                  {CATEGORY_GROUPS.map(g => <SelectItem key={g} value={g}>{CATEGORY_GROUP_LABELS[g]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Ticketelor</CardTitle>
            <CardDescription>{tickets?.length || 0} tickete</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : tickets && tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Titlu</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Prioritate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map(ticket => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{ticket.public_id}</TableCell>
                        <TableCell>
                          <p className="font-medium line-clamp-1">{ticket.title}</p>
                        </TableCell>
                        <TableCell className="text-sm">{CATEGORY_GROUP_LABELS[ticket.category_group] || ticket.category_group}</TableCell>
                        <TableCell>
                          <Badge className={priorityColors[ticket.priority] || ''}>{getPriorityLabel(ticket.priority)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[ticket.status] || ''}>{getStatusLabel(ticket.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: ro })}
                        </TableCell>
                        <TableCell>
                          {isSlaBreached(ticket) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TicketCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există tickete</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;
