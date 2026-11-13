import { useMemo, useState } from "react";
import { Search, AlertTriangle, Inbox, Filter, Plus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusPill } from "@/components/support/center/StatusPill";
import SourceBadge from "@/components/admin/SourceBadge";
import { getSlaInfo } from "@/features/tickets/sla";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CATEGORY_GROUP_LABELS,
  CATEGORY_GROUPS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type FetchTicketsFilters,
  type OpsTicket,
} from "@/features/admin/opsTicketsApi";

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-blue-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

const isUnread = (t: Pick<OpsTicket, "status" | "updated_at" | "last_admin_read_at">) =>
  !["CLOSED", "RESOLVED"].includes(t.status) &&
  (!t.last_admin_read_at || new Date(t.last_admin_read_at) < new Date(t.updated_at));

// Promisiune unică: primul răspuns în maximum 48h de la deschiderea tichetului.
const slaBreached = (t: OpsTicket) => getSlaInfo(t).state === "breached";
const slaDueSoon = (t: OpsTicket) => getSlaInfo(t).state === "due_soon";

type Tab = "open" | "waiting" | "resolved" | "all";

const TAB_FILTERS: Record<Tab, (t: OpsTicket) => boolean> = {
  open: (t) => ["NEW", "IN_PROGRESS"].includes(t.status),
  waiting: (t) => ["WAITING_CUSTOMER", "WAITING_OWNER", "WAITING_INTERNAL"].includes(t.status),
  resolved: (t) => ["RESOLVED", "CLOSED"].includes(t.status),
  all: () => true,
};

interface Props {
  tickets: OpsTicket[] | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: FetchTicketsFilters;
  setFilters: (f: FetchTicketsFilters) => void;
  onNew: () => void;
}

export function AdminInboxList({ tickets, isLoading, selectedId, onSelect, filters, setFilters, onNew }: Props) {
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState(filters.search ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const counts = useMemo(() => {
    const list = tickets || [];
    return {
      open: list.filter(TAB_FILTERS.open).length,
      waiting: list.filter(TAB_FILTERS.waiting).length,
      resolved: list.filter(TAB_FILTERS.resolved).length,
      all: list.length,
    };
  }, [tickets]);

  const visible = useMemo(() => (tickets || []).filter(TAB_FILTERS[tab]), [tickets, tab]);

  const TabBtn = ({ k, label }: { k: Tab; label: string }) => (
    <button
      onClick={() => setTab(k)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        tab === k
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {label}
      <span className={cn("ml-1.5 text-[10px]", tab === k ? "opacity-80" : "opacity-60")}>
        {counts[k]}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Inbox tichete</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onNew} className="h-7 px-2">
            <Plus className="h-3.5 w-3.5 mr-1" /> Nou
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="TCK-…, titlu sau utilizator"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setFilters({ ...filters, search: search || undefined })}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 scrollbar-none">
          <TabBtn k="open" label="Active" />
          <TabBtn k="waiting" label="Așteptare" />
          <TabBtn k="resolved" label="Rezolvate" />
          <TabBtn k="all" label="Toate" />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "ml-auto p-1.5 rounded-md transition-colors",
              showFilters ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="Filtre avansate"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.priority || "all"}
              onValueChange={(v) => setFilters({ ...filters, priority: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Prioritate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate prioritățile</SelectItem>
                {PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={filters.category_group || "all"}
              onValueChange={(v) => setFilters({ ...filters, category_group: v === "all" ? undefined : v, category_type: undefined })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate categoriile</SelectItem>
                {CATEGORY_GROUPS.map((g) => <SelectItem key={g} value={g}>{CATEGORY_GROUP_LABELS[g]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
              onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="h-8 text-xs col-span-2"><SelectValue placeholder="Status DB exact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Orice status</SelectItem>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={filters.created_via || "all"}
              onValueChange={(v) => setFilters({ ...filters, created_via: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="h-8 text-xs col-span-2"><SelectValue placeholder="Sursă" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate sursele</SelectItem>
                <SelectItem value="mobile">Aplicație mobilă</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 px-4 text-muted-foreground text-sm">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Niciun ticket aici
          </div>
        ) : (
          <ul className="divide-y">
            {visible.map((t) => {
              const unread = isUnread(t);
              const breached = slaBreached(t);
              const isActive = selectedId === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => onSelect(t.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 transition-colors flex gap-2 items-start group",
                      isActive ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50 border-l-2 border-transparent"
                    )}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", PRIORITY_DOT[t.priority] || "bg-muted-foreground")} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{t.public_id}</span>
                        {breached && <AlertTriangle className="h-3 w-3 text-red-500" aria-label="SLA depășit" />}
                        <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(t.updated_at), { locale: ro, addSuffix: false })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm line-clamp-1",
                        unread ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}>
                        {t.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] min-w-0">
                        <User className="h-3 w-3 flex-shrink-0 text-primary opacity-70" />
                        <span className="truncate font-semibold text-primary">
                          {t.requester_name || t.requester_email || "Utilizator anonim"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StatusPill status={t.status} size="xs" />
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                          {CATEGORY_GROUP_LABELS[t.category_group] || t.category_group}
                        </Badge>
                        <SourceBadge source={t.created_via} />
                        {slaBreached(t) ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border-destructive/50 text-destructive">
                            SLA 48h depășit
                          </Badge>
                        ) : slaDueSoon(t) ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border-primary/50 text-primary">
                            SLA aproape
                          </Badge>
                        ) : null}
                        {unread && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-label="necitit" />}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}