import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, LifeBuoy, Loader2, ArrowLeft, MessageSquare, Filter,
  Inbox, CheckCircle2, Clock4, Sparkles, X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fetchUserTickets, createUserTicket,
  closeUserTicket,
  CATEGORY_GROUPS, CATEGORY_TYPES, CATEGORY_GROUP_LABELS,
  type OpsTicket,
} from "@/features/tickets/userTicketsApi";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { useUserTicketsRealtime } from "@/hooks/useTicketRealtime";
import { StatusPill } from "@/components/support/center/StatusPill";
import { getSlaInfo, slaLabel } from "@/features/tickets/sla";
import { TicketTimeline } from "@/components/support/center/TicketTimeline";
import { TicketContextPanel } from "@/components/support/center/TicketContextPanel";
import { TicketChat } from "@/components/support/center/TicketChat";
import {
  TICKET_DESCRIPTION_MAX,
  TICKET_DESCRIPTION_MIN,
  TICKET_TITLE_MAX,
  TICKET_TITLE_MIN,
  ticketValidationMessage,
  validateTicketContent,
} from "@/features/tickets/ticketValidation";

type FilterKey = "all" | "active" | "waiting" | "resolved";

const FILTERS: { key: FilterKey; ro: string; en: string; icon: any }[] = [
  { key: "all",      ro: "Toate",          en: "All",          icon: Inbox },
  { key: "active",   ro: "Active",         en: "Active",       icon: Clock4 },
  { key: "waiting",  ro: "În așteptare",   en: "Waiting",      icon: Sparkles },
  { key: "resolved", ro: "Rezolvate",      en: "Resolved",     icon: CheckCircle2 },
];

function matchesFilter(t: OpsTicket, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "active") return ["NEW", "IN_PROGRESS"].includes(t.status);
  if (f === "waiting") return ["WAITING_CUSTOMER", "WAITING_OWNER", "WAITING_INTERNAL"].includes(t.status);
  if (f === "resolved") return ["RESOLVED", "CLOSED"].includes(t.status);
  return true;
}

const UserTickets = () => {
  usePageSeo({ title: "Suport — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("open"));
  const locale = language === "ro" ? ro : enUS;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useUserTicketsRealtime(user?.id);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["userTickets"],
    queryFn: fetchUserTickets,
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (!tickets) return [];
    const q = search.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (!matchesFilter(tk, filter)) return false;
      if (!q) return true;
      return (
        tk.title.toLowerCase().includes(q) ||
        tk.public_id.toLowerCase().includes(q) ||
        tk.description?.toLowerCase().includes(q)
      );
    });
  }, [tickets, filter, search]);

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, waiting: 0, resolved: 0 } as Record<FilterKey, number>;
    tickets?.forEach((tk) => {
      c.all++;
      if (matchesFilter(tk, "active")) c.active++;
      if (matchesFilter(tk, "waiting")) c.waiting++;
      if (matchesFilter(tk, "resolved")) c.resolved++;
    });
    return c;
  }, [tickets]);

  const selected = tickets?.find((tk) => tk.id === selectedId) || null;

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) setParams({ open: id }, { replace: true });
    else setParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 pt-24 lg:pt-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/15 grid place-items-center shrink-0">
                <LifeBuoy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {t("Cum te putem ajuta?", "How can we help?")}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {t(
                    "Trimite situația în detaliu. Echipa Rentli îți răspunde în maximum 48 de ore.",
                    "Describe the situation in detail. The Rentli team replies within 48 hours."
                  )}
                </p>
              </div>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-xl shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Ticket nou", "New ticket")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("Creează un ticket", "Create a ticket")}</DialogTitle>
                </DialogHeader>
                <CreateTicketForm
                  onSuccess={(id) => { setCreateOpen(false); handleSelect(id); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter pills + search */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 border",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(f.ro, f.en)}
                  <span className={cn(
                    "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                    active ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative md:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Caută ticket sau cod…", "Search ticket or code…")}
              className="pl-8 rounded-xl"
            />
          </div>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[60vh]">
          {/* Inbox list */}
          <div className={cn("space-y-2", selected && "hidden lg:block")}>
            {isLoading || authLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border/60 p-8 text-center">
                <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">
                  {t("Niciun ticket aici", "No tickets here")}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {t("Creează un ticket nou când ai nevoie de ajutor.", "Create a new ticket when you need help.")}
                </p>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t("Ticket nou", "New ticket")}
                </Button>
              </div>
            ) : (
              filtered.map((tk) => (
                <TicketCard
                  key={tk.id}
                  ticket={tk}
                  active={tk.id === selectedId}
                  onClick={() => handleSelect(tk.id)}
                  locale={locale}
                />
              ))
            )}
          </div>

          {/* Detail panel */}
          <div className={cn(
            selected ? "block" : "hidden lg:block",
            "rounded-2xl bg-card border border-border/60 overflow-hidden"
          )}>
            {selected ? (
              <TicketDetailView
                ticket={selected}
                onBack={() => handleSelect(null)}
              />
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t("Selectează un tichet pentru a vedea corespondența.", "Select a ticket to view its correspondence.")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ============= Ticket Card =============

function TicketCard({
  ticket, active, onClick, locale,
}: { ticket: OpsTicket; active: boolean; onClick: () => void; locale: any }) {
  const { t, language } = useLanguage();
  const categoryLabel = CATEGORY_GROUP_LABELS[ticket.category_group] || ticket.category_group;
  const sla = getSlaInfo(ticket);
  return (
    <motion.button
      layout
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all bg-card",
        active
          ? "border-primary shadow-md ring-1 ring-primary/20"
          : "border-border/60 hover:border-primary/40 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">{ticket.public_id}</span>
        <StatusPill status={ticket.status} size="xs" />
      </div>
      <p className="font-medium text-sm leading-tight line-clamp-2 mb-1.5">{ticket.title}</p>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{categoryLabel}</span>
        <span className="shrink-0">
          {formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true, locale })}
        </span>
      </div>
      <p
        className={cn(
          "mt-1.5 text-[11px] font-medium",
          sla.state === "breached"
            ? "text-destructive"
            : sla.state === "answered"
            ? "text-muted-foreground"
            : "text-primary",
        )}
      >
        {slaLabel(sla, language)}
      </p>
    </motion.button>
  );
}

// ============= Detail View =============

function TicketDetailView({ ticket, onBack }: { ticket: OpsTicket; onBack: () => void }) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  const closeMutation = useMutation({
    mutationFn: () => closeUserTicket(ticket.id),
    onSuccess: () => {
      toast.success(t("Ticket închis", "Ticket closed"));
      qc.invalidateQueries({ queryKey: ["userTickets"] });
      qc.invalidateQueries({ queryKey: ["userTicketMessages", ticket.id] });
    },
    onError: (e: Error) =>
      toast.error(t("Nu am putut închide tichetul", "Could not close the ticket"), { description: e.message }),
  });

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="border-b border-border/60 p-4 flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-muted-foreground">{ticket.public_id}</span>
            <StatusPill status={ticket.status} size="xs" />
          </div>
          <h2 className="font-semibold text-base leading-tight">{ticket.title}</h2>
        </div>
        {!isClosed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <X className="h-4 w-4 mr-1" />}
                <span className="hidden sm:inline">{t("Închide tichetul", "Close ticket")}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Închizi acest ticket?", "Close this ticket?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "Confirmă doar dacă problema este rezolvată sau tichetul a fost deschis din greșeală. Poți deschide oricând un tichet nou.",
                    "Confirm only if the issue is resolved or the ticket was opened by mistake. You can always open a new one."
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => closeMutation.mutate()}>
                  {t("Închide tichetul", "Close ticket")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Body: chat + side context */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_280px]">
        <div className="flex flex-col min-h-0 border-r border-border/60">
          {/* Description preview */}
          {ticket.description && (
            <div className="px-4 pt-3 pb-2">
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t("Vezi descrierea inițială", "View original description")}
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-foreground/80">{ticket.description}</p>
              </details>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <TicketChat ticketId={ticket.id} isClosed={isClosed} />
          </div>
        </div>
        <div className="hidden xl:block p-4 space-y-3 overflow-y-auto bg-muted/10">
          <TicketTimeline ticket={ticket} />
          <TicketContextPanel ticket={ticket} />
        </div>
      </div>
    </div>
  );
}

// ============= Create Form =============

function CreateTicketForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const { t, language } = useLanguage();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("");
  const [categoryType, setCategoryType] = useState("");

  const createMutation = useMutation({
    mutationFn: createUserTicket,
    onSuccess: (created) => {
      toast.success(t("Ticket creat", "Ticket created"));
      qc.invalidateQueries({ queryKey: ["userTickets"] });
      onSuccess(created.id);
    },
    onError: (err: Error) => {
      toast.error(t("Eroare", "Error"), { description: err.message });
    },
  });

  const categoryTypes = categoryGroup ? (CATEGORY_TYPES[categoryGroup] || []) : [];
  const valid =
    title.trim().length >= TICKET_TITLE_MIN &&
    description.trim().length >= TICKET_DESCRIPTION_MIN &&
    !!categoryGroup &&
    !!categoryType;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!categoryGroup || !categoryType) return;
        const error = validateTicketContent(title, description);
        if (error) {
          toast.error(t("Verifică formularul", "Check the form"), { description: ticketValidationMessage(error, language === "ro" ? "ro" : "en") });
          return;
        }
        createMutation.mutate({
          title: title.trim(),
          description: description.trim(),
          category_group: categoryGroup,
          category_type: categoryType,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>{t("Categorie", "Category")}</Label>
        <Select value={categoryGroup} onValueChange={(v) => { setCategoryGroup(v); setCategoryType(""); }}>
          <SelectTrigger><SelectValue placeholder={t("Selectează categoria", "Select category")} /></SelectTrigger>
          <SelectContent>
            {CATEGORY_GROUPS.map((g) => (
              <SelectItem key={g} value={g}>{CATEGORY_GROUP_LABELS[g] || g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {categoryGroup && (
        <div className="space-y-2">
          <Label>{t("Tip problemă", "Issue type")}</Label>
          <Select value={categoryType} onValueChange={setCategoryType}>
            <SelectTrigger><SelectValue placeholder={t("Selectează tipul", "Select type")} /></SelectTrigger>
            <SelectContent>
              {categoryTypes.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>{t("Titlu", "Title")}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} minLength={TICKET_TITLE_MIN} maxLength={TICKET_TITLE_MAX}
          placeholder={t("Descrie pe scurt problema", "Briefly describe the issue")} />
      </div>
      <div className="space-y-2">
        <Label>{t("Descriere", "Description")}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} minLength={TICKET_DESCRIPTION_MIN} maxLength={TICKET_DESCRIPTION_MAX}
          className="min-h-48 resize-y"
          placeholder={t("Explică în detaliu problema…", "Explain the issue in detail…")} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t(`Minimum ${TICKET_DESCRIPTION_MIN} de caractere`, `Minimum ${TICKET_DESCRIPTION_MIN} characters`)}</span>
          <span>{description.length}/{TICKET_DESCRIPTION_MAX}</span>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={!valid || createMutation.isPending}>
        {createMutation.isPending
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se trimite…", "Submitting…")}</>
          : t("Trimite tichetul", "Submit ticket")}
      </Button>
    </form>
  );
}

export default UserTickets;
