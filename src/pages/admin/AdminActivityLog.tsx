import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Activity, CalendarIcon, Download, Search, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  actionLabel,
  actionTone,
  activityDetails,
  activityToCsv,
} from "@/features/admin/activityFeedApi";
import {
  useAdminActivityActions,
  useAdminActivityFeed,
} from "@/hooks/queries/useAdminActivityFeed";

const PAGE_SIZE = 50;

const toneClass = (action: string) => {
  switch (actionTone(action)) {
    case "success":
      return "bg-green-500/15 text-green-700 border-green-500/30";
    case "danger":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "warning":
      return "bg-primary/10 text-primary border-primary/30";
    default:
      return "";
  }
};

const entityLink = (entityType: string | null, entityId: string | null) => {
  if (!entityType || !entityId) return null;
  if (entityType.includes("product")) return `/admin/products?q=${entityId}`;
  if (entityType.includes("rental")) return `/admin/reservations?q=${entityId}`;
  return null;
};

const AdminActivityLog = () => {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useAdminActivityFeed({
    search,
    action,
    dateFrom,
    dateTo,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: actions } = useAdminActivityActions();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const exportCsv = () => {
    const blob = new Blob([activityToCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jurnal-activitate-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = !!search || action !== "all" || !!dateFrom || !!dateTo;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Jurnal activitate
            </h1>
            <p className="text-sm text-muted-foreground">
              Toate acțiunile înregistrate pe platformă ({total})
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după nume sau email"
              className="pl-9"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
            />
          </div>

          <Select value={action} onValueChange={resetPage(setAction)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Toate acțiunile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate acțiunile</SelectItem>
              {(actions ?? []).map((a) => (
                <SelectItem key={a} value={a}>
                  {actionLabel(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(!dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateFrom ? format(dateFrom, "d MMM yyyy", { locale: ro }) : "De la"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={resetPage(setDateFrom)} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(!dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateTo ? format(dateTo, "d MMM yyyy", { locale: ro }) : "Până la"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={resetPage(setDateTo)} />
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAction("all");
                setDateFrom(undefined);
                setDateTo(undefined);
                setPage(0);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Resetează
            </Button>
          )}
        </div>

        <div className="rounded-xl border bg-card">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nicio activitate pentru filtrele selectate</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Data</TableHead>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Acțiune</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Detalii</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const link = entityLink(row.entity_type, row.entity_id);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <Link
                          to={`/admin/users/${row.user_id}`}
                          className="text-sm font-medium hover:underline block truncate"
                        >
                          {row.user_name || "Utilizator"}
                        </Link>
                        <span className="text-xs text-muted-foreground block truncate">
                          {row.user_email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", toneClass(row.action))}>
                          {actionLabel(row.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {link ? (
                          <Link to={link} className="hover:underline">
                            {row.entity_type}
                          </Link>
                        ) : (
                          row.entity_type || "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[320px] truncate">
                        {activityDetails(row) || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Pagina {page + 1} din {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Înapoi
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Înainte
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminActivityLog;
