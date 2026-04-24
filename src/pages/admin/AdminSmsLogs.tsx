import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Users,
  Search,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAdminSmsLogs,
  computeSmsLogsStats,
  type AdminSmsLog,
} from "@/features/admin/adminSmsLogsApi";

type StatusFilter = "all" | "sent" | "failed" | "skipped";

const statusBadge = (status: AdminSmsLog["status"]) => {
  if (status === "sent") {
    return (
      <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30">
        Trimis
      </Badge>
    );
  }
  if (status === "failed") {
    return <Badge variant="destructive">Eșuat</Badge>;
  }
  return <Badge variant="secondary">Ignorat</Badge>;
};

const AdminSmsLogs = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selected, setSelected] = useState<AdminSmsLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: [
      "adminSmsLogs",
      statusFilter,
      search,
      dateFrom?.toISOString(),
      dateTo?.toISOString(),
    ],
    queryFn: () =>
      getAdminSmsLogs({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        dateFrom,
        dateTo,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const stats = useMemo(() => computeSmsLogsStats(logs || []), [logs]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters =
    !!search || statusFilter !== "all" || !!dateFrom || !!dateTo;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" /> SMS Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toate notificările SMS trimise prin platformă (audit, debugging, cost
            tracking).
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatsCard
            title="Trimise"
            value={stats.sent.toString()}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatsCard
            title="Eșuate"
            value={stats.failed.toString()}
            icon={<XCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Ignorate"
            value={stats.skipped.toString()}
            icon={<MinusCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Destinatari unici"
            value={stats.uniqueRecipients.toString()}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută telefon, nume, email, template, rental ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              <SelectItem value="sent">Trimise</SelectItem>
              <SelectItem value="failed">Eșuate</SelectItem>
              <SelectItem value="skipped">Ignorate</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start font-normal w-full md:w-[180px]",
                  !dateFrom && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "d MMM yyyy", { locale: ro }) : "De la"}
                {dateFrom && (
                  <X
                    className="ml-auto h-3 w-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFrom(undefined);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                className={cn("p-3 pointer-events-auto")}
                locale={ro}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start font-normal w-full md:w-[180px]",
                  !dateTo && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "d MMM yyyy", { locale: ro }) : "Până la"}
                {dateTo && (
                  <X
                    className="ml-auto h-3 w-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateTo(undefined);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                className={cn("p-3 pointer-events-auto")}
                locale={ro}
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" /> Resetează
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Data</TableHead>
                <TableHead>Destinatar</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Produs / Rental</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !logs?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {hasActiveFilters
                      ? "Niciun rezultat pentru filtrele aplicate"
                      : "Nu există încă SMS-uri trimise"}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(log)}
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "d MMM HH:mm", { locale: ro })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {log.user_name}
                        </span>
                        {log.user_email && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {log.user_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.recipient_phone || "—"}
                    </TableCell>
                    <TableCell>
                      <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
                        {log.template_key}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.product_title ? (
                        <span className="truncate max-w-[200px] block">{log.product_title}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Detalii SMS
              </DialogTitle>
              <DialogDescription>
                {selected && format(new Date(selected.created_at), "PPpp", { locale: ro })}
              </DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Status</div>
                    {statusBadge(selected.status)}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Template</div>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {selected.template_key}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Destinatar</div>
                    <div className="font-medium">{selected.user_name}</div>
                    {selected.user_email && (
                      <div className="text-xs text-muted-foreground">{selected.user_email}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Telefon</div>
                    <div className="font-mono text-xs">{selected.recipient_phone || "—"}</div>
                  </div>
                  {selected.rental_id && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Rental ID</div>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                        {selected.rental_id}
                      </code>
                      {selected.product_title && (
                        <div className="text-xs mt-1">{selected.product_title}</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Mesaj trimis</div>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap break-words">
                    {selected.message_body}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {selected.message_body.length} caractere
                  </div>
                </div>

                {selected.error_message && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Eroare</div>
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive break-words">
                      {selected.error_message}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Răspuns provider</div>
                  <pre className="rounded-md border bg-muted/30 p-3 text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selected.provider_response ?? {}, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground mb-0.5">Provider message ID</div>
                    <div className="font-mono break-all">
                      {selected.provider_message_id || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">Idempotency key</div>
                    <div className="font-mono break-all">{selected.idempotency_key}</div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSmsLogs;