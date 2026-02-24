import { useState } from "react";
import { TicketCheck, Search, Loader2, MessageSquare, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTickets, updateTicketStatus, updateTicketPriority, updateTicketNotes, resolveTicket, SupportTicket } from "@/features/admin/ticketsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Deschis", variant: "destructive" },
  in_progress: { label: "În lucru", variant: "default" },
  resolved: { label: "Rezolvat", variant: "secondary" },
  closed: { label: "Închis", variant: "outline" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Scăzut", color: "bg-blue-100 text-blue-800" },
  medium: { label: "Mediu", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Ridicat", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

const categoryLabels: Record<string, string> = {
  dispute: "Dispută",
  fraud: "Fraudă",
  quality: "Calitate",
  other: "Altele",
};

const AdminTickets = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<SupportTicket | null>(null);
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; ticketId: string }>({ open: false, ticketId: "" });
  const [resolution, setResolution] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['adminTickets', statusFilter, priorityFilter],
    queryFn: () => fetchTickets(
      statusFilter === 'all' ? undefined : statusFilter,
      priorityFilter === 'all' ? undefined : priorityFilter
    ),
    staleTime: 30000,
  });

  const handleStatusChange = async (ticketId: string, status: string) => {
    setActionLoading(ticketId);
    try {
      await updateTicketStatus(ticketId, status);
      toast.success("Status actualizat");
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handlePriorityChange = async (ticketId: string, priority: string) => {
    setActionLoading(ticketId);
    try {
      await updateTicketPriority(ticketId, priority);
      toast.success("Prioritate actualizată");
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    setActionLoading(resolveDialog.ticketId);
    try {
      await resolveTicket(resolveDialog.ticketId, resolution);
      toast.success("Ticket rezolvat");
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      setResolveDialog({ open: false, ticketId: "" });
      setResolution("");
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleSaveNotes = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateTicketNotes(ticketId, adminNotes);
      toast.success("Notițe salvate");
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const openStats = {
    open: tickets?.filter(t => t.status === 'open').length || 0,
    in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    urgent: tickets?.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TicketCheck className="h-8 w-8" /> Tickete Suport
          </h1>
          <p className="text-muted-foreground">Gestionează reclamațiile și cererile utilizatorilor</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <MessageSquare className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{openStats.open}</p>
                <p className="text-sm text-muted-foreground">Tickete deschise</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{openStats.in_progress}</p>
                <p className="text-sm text-muted-foreground">În lucru</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{openStats.urgent}</p>
                <p className="text-sm text-muted-foreground">Urgente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  <SelectItem value="open">Deschise</SelectItem>
                  <SelectItem value="in_progress">În lucru</SelectItem>
                  <SelectItem value="resolved">Rezolvate</SelectItem>
                  <SelectItem value="closed">Închise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Prioritate" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate prioritățile</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Ridicat</SelectItem>
                  <SelectItem value="medium">Mediu</SelectItem>
                  <SelectItem value="low">Scăzut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Ticketelor</CardTitle>
            <CardDescription>{tickets?.length || 0} tickete</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : tickets && tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subiect</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Prioritate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer" onClick={() => { setDetailTicket(ticket); setAdminNotes(ticket.admin_notes || ""); }}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{categoryLabels[ticket.category] || ticket.category}</TableCell>
                        <TableCell>
                          <Badge className={priorityConfig[ticket.priority]?.color || ""}>
                            {priorityConfig[ticket.priority]?.label || ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[ticket.status]?.variant || "outline"}>
                            {statusConfig[ticket.status]?.label || ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: ro })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {actionLoading === ticket.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <div className="flex gap-2 justify-end">
                              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                <Button size="sm" variant="outline" onClick={() => { setResolveDialog({ open: true, ticketId: ticket.id }); }}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Rezolvă
                                </Button>
                              )}
                            </div>
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

      {/* Detail Dialog */}
      <Dialog open={!!detailTicket} onOpenChange={(open) => { if (!open) setDetailTicket(null); }}>
        <DialogContent className="max-w-2xl">
          {detailTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{detailTicket.subject}</DialogTitle>
                <DialogDescription>
                  Creat pe {format(new Date(detailTicket.created_at), 'd MMMM yyyy, HH:mm', { locale: ro })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={priorityConfig[detailTicket.priority]?.color}>{priorityConfig[detailTicket.priority]?.label}</Badge>
                  <Badge variant={statusConfig[detailTicket.status]?.variant}>{statusConfig[detailTicket.status]?.label}</Badge>
                  <Badge variant="outline">{categoryLabels[detailTicket.category]}</Badge>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium mb-1">Descriere</p>
                  <p className="text-sm text-muted-foreground">{detailTicket.description}</p>
                </div>
                {detailTicket.resolution && (
                  <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                    <p className="text-sm font-medium mb-1 text-green-800">Rezoluție</p>
                    <p className="text-sm text-green-700">{detailTicket.resolution}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-2">Notițe admin (interne)</p>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Notițe interne..." rows={3} />
                  <Button size="sm" className="mt-2" onClick={() => handleSaveNotes(detailTicket.id)} disabled={actionLoading === detailTicket.id}>
                    Salvează notițe
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={detailTicket.status} onValueChange={(v) => handleStatusChange(detailTicket.id, v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Deschis</SelectItem>
                      <SelectItem value="in_progress">În lucru</SelectItem>
                      <SelectItem value="resolved">Rezolvat</SelectItem>
                      <SelectItem value="closed">Închis</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={detailTicket.priority} onValueChange={(v) => handlePriorityChange(detailTicket.id, v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Scăzut</SelectItem>
                      <SelectItem value="medium">Mediu</SelectItem>
                      <SelectItem value="high">Ridicat</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(open) => { setResolveDialog({ ...resolveDialog, open }); if (!open) setResolution(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezolvă ticket</DialogTitle>
            <DialogDescription>Descrie rezoluția pentru acest ticket.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Rezoluția..." value={resolution} onChange={(e) => setResolution(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false, ticketId: "" })}>Anulează</Button>
            <Button onClick={handleResolve} disabled={!resolution.trim()}>Marchează rezolvat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTickets;
