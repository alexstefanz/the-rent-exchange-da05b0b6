import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, Search, Loader2, Package, Inbox, Clock, Sparkles, ArrowRight, Ban, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import { requestMutualCancellation } from "@/features/rentals/rentalsApi";
import { toast } from "sonner";
import StatusBadge from "./StatusBadge";
import RentalsFilterBar, { type RentalStatusFilter, type RentalSortBy } from "./RentalsFilterBar";

interface MyRental {
  id: string;
  public_id: string | null;
  product_id: string | null;
  owner_id: string | null;
  product_title: string;
  product_image: string;
  owner_name: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  subtotal: number;
  status: string;
  payment_status: string;
  handover_confirmed_at: string | null;
  return_confirmed_at: string | null;
  message_to_owner: string | null;
  created_at: string | null;
}

const fetchMyRentals = async (userId: string): Promise<MyRental[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, public_id, product_id, owner_id, start_date, end_date, rental_days, subtotal, status, payment_status, handover_confirmed_at, return_confirmed_at, message_to_owner, created_at, products(title, images)")
    .eq("renter_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const ownerIds = Array.from(new Set((data || []).map((r: any) => r.owner_id).filter(Boolean)));
  let ownerMap: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    ownerMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name || "Proprietar"]));
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    public_id: r.public_id,
    product_id: r.product_id,
    owner_id: r.owner_id,
    product_title: r.products?.title || "Produs șters",
    product_image: r.products?.images?.[0] || "/placeholder.svg",
    owner_name: (r.owner_id && ownerMap[r.owner_id]) || "Proprietar",
    start_date: r.start_date,
    end_date: r.end_date,
    rental_days: r.rental_days,
    subtotal: Number(r.subtotal),
    status: r.status,
    payment_status: r.payment_status,
    handover_confirmed_at: r.handover_confirmed_at,
    return_confirmed_at: r.return_confirmed_at,
    message_to_owner: r.message_to_owner,
    created_at: r.created_at,
  }));
};

const RentalsTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRentalRealtime(user?.id, "renter", [["my-rentals", user?.id]]);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["my-rentals", user?.id],
    queryFn: () => fetchMyRentals(user!.id),
    enabled: !!user?.id,
  });

  const [cancelDialogRental, setCancelDialogRental] = useState<MyRental | null>(null);
  const [cancelSubject, setCancelSubject] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RentalStatusFilter>("all");
  const [sortBy, setSortBy] = useState<RentalSortBy>("newest");

  const counts = useMemo(() => ({
    all: rentals.length,
    active: rentals.filter(r => r.status === "confirmed" || r.status === "active").length,
    pending: rentals.filter(r => r.status === "pending").length,
    cancelled: rentals.filter(r => r.status === "cancelled" || r.status === "rejected").length,
  }), [rentals]);

  const matchesStatus = (r: MyRental) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return r.status === "confirmed" || r.status === "active";
    if (statusFilter === "pending") return r.status === "pending";
    if (statusFilter === "cancelled") return r.status === "cancelled" || r.status === "rejected";
    return true;
  };

  const sortRentals = (arr: MyRental[]) => {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime();
      if (sortBy === "oldest") return new Date(a.created_at || a.start_date).getTime() - new Date(b.created_at || b.start_date).getTime();
      if (sortBy === "amount_desc") return Number(b.subtotal) - Number(a.subtotal);
      if (sortBy === "amount_asc") return Number(a.subtotal) - Number(b.subtotal);
      return 0;
    });
    return sorted;
  };

  const filtered = useMemo(() => sortRentals(rentals.filter(matchesStatus)), [rentals, statusFilter, sortBy]);

  const pendingRentals = filtered.filter(r => r.status === "pending");
  const premiumActiveRentals = filtered.filter(
    r => (r.status === "confirmed" || r.status === "active") && !r.handover_confirmed_at,
  );
  const premiumIds = new Set([...pendingRentals, ...premiumActiveRentals].map(r => r.id));
  const historyRentals = filtered.filter(r => !premiumIds.has(r.id));

  const handleRequestCancel = async () => {
    if (!cancelDialogRental) return;
    if (!cancelSubject.trim() || cancelSubject.trim().length < 3) {
      toast.error("Subiectul e prea scurt (minim 3 caractere)");
      return;
    }
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("Te rugăm să adaugi un motiv (minim 5 caractere)");
      return;
    }
    setSubmitting(true);
    try {
      await requestMutualCancellation(cancelDialogRental.id, cancelSubject.trim(), cancelReason.trim());
      toast.success("Cererea de anulare a fost trimisă către admin pentru revizuire");
      queryClient.invalidateQueries({ queryKey: ["my-rentals"] });
      setCancelDialogRental(null);
      setCancelSubject("");
      setCancelReason("");
    } catch (e: any) {
      toast.error(e?.message || "Eroare la trimiterea cererii de anulare");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">{copy.dashboard.noRentals}</h3>
        <p className="mb-6 max-w-md text-muted-foreground">{copy.dashboard.noRentalsSubtitle}</p>
        <Button asChild>
          <Link to="/cauta">
            <Search className="mr-2 h-4 w-4" />
            {copy.dashboard.startSearching}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter & sort bar */}
      <RentalsFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        counts={counts}
        amountLabel="Total"
      />

      {/* Premium reservation cards */}
      {(pendingRentals.length > 0 || premiumActiveRentals.length > 0) && (
        <section>
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2 text-base">
            Rezervările mele
            <Badge className="bg-primary text-primary-foreground">{pendingRentals.length + premiumActiveRentals.length}</Badge>
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...pendingRentals, ...premiumActiveRentals].map((rental) => {
              const isPending = rental.status === "pending";
              const canRequestCancel = !isPending && !rental.handover_confirmed_at;
              return (
                <div
                  key={rental.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-card shadow-lg shadow-primary/10"
                >
                  <Link
                    to={rental.public_id ? `/rezervari/${rental.public_id}` : `/produs/${rental.product_id}`}
                    className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-muted block group"
                  >
                    <img
                      src={rental.product_image}
                      alt={rental.product_title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {rental.public_id && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-background/90 text-foreground border border-border shadow-md">
                          {rental.public_id}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      {isPending ? (
                        <Badge className="bg-primary text-primary-foreground animate-pulse shadow-md text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">În așteptare</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-md text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">Confirmată</Badge>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col p-3 sm:p-4">
                    <div className="flex items-start gap-2 mb-1">
                      <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                          {isPending ? "Cerere către" : "Rezervare la"}
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {rental.owner_name}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-foreground mt-1 line-clamp-1">
                      pentru <span className="text-primary">{rental.product_title}</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                      <div className="rounded-lg bg-card/80 border border-border p-1.5 sm:p-2">
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">
                          <Calendar className="h-3 w-3" /><span>Perioadă</span>
                        </div>
                        <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight">
                          {format(new Date(rental.start_date), "d MMM", { locale: roLocale })}–{format(new Date(rental.end_date), "d MMM", { locale: roLocale })}
                        </p>
                      </div>
                      <div className="rounded-lg bg-card/80 border border-border p-1.5 sm:p-2">
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">
                          <Clock className="h-3 w-3" /><span>Zile</span>
                        </div>
                        <p className="text-[11px] sm:text-xs font-semibold text-foreground">{rental.rental_days}</p>
                      </div>
                      <div className="rounded-lg bg-primary/15 border border-primary/30 p-1.5 sm:p-2">
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-primary/80 mb-0.5">
                          <span>Total</span>
                        </div>
                        <p className="text-[11px] sm:text-sm font-bold text-primary leading-tight">{rental.subtotal} RON</p>
                      </div>
                    </div>

                    {rental.message_to_owner && rental.message_to_owner.trim().length > 0 && (
                      <div className="mt-2 sm:mt-3 rounded-xl rounded-tl-sm bg-background border border-border px-2 sm:px-3 py-1.5 sm:py-2">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">
                          <MessageSquare className="h-3 w-3" />
                          <span>Mesajul tău</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground whitespace-pre-wrap break-words line-clamp-2 sm:line-clamp-3">
                          {rental.message_to_owner}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 sm:mt-4">
                      <Button asChild className="w-full h-9 text-xs sm:text-sm">
                        <Link to={rental.public_id ? `/rezervari/${rental.public_id}` : `/produs/${rental.product_id}`}>
                          Vezi detalii <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                        </Link>
                      </Button>

                      {canRequestCancel && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelDialogRental(rental)}
                            className="text-muted-foreground hover:text-destructive text-[11px] sm:text-xs px-2"
                          >
                            <Ban className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                            <span className="sm:hidden">Anulează</span>
                            <span className="hidden sm:inline">Solicită anularea cererii</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* History accordion (no images) */}
      {historyRentals.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Package className="h-5 w-5 text-primary" />
                Rezervări active &amp; istoric
                <Badge variant="secondary">{historyRentals.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="divide-y divide-border">
                {historyRentals.map((rental) => {
                  const to = rental.public_id ? `/rezervari/${rental.public_id}` : `/produs/${rental.product_id}`;
                  const allowed = ["pending", "accepted", "rejected", "completed", "cancelled", "active", "inactive"];
                  const statusKey = (allowed.includes(rental.status) ? rental.status : "pending") as any;
                  return (
                    <div key={rental.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-medium text-foreground truncate">{rental.product_title}</p>
                          {rental.public_id && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 flex-shrink-0">{rental.public_id}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Proprietar: <span className="text-foreground">{rental.owner_name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rental.start_date), "d MMM yyyy", { locale: roLocale })} – {format(new Date(rental.end_date), "d MMM yyyy", { locale: roLocale })} · {rental.rental_days} zile
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{rental.subtotal} RON</p>
                          <StatusBadge status={statusKey} />
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link to={to}>
                            Vezi mai mult <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Mutual cancel dialog */}
      <Dialog open={!!cancelDialogRental} onOpenChange={(open) => !open && setCancelDialogRental(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicită anularea rezervării</DialogTitle>
            <DialogDescription>
              Cererea va fi revizuită de un admin. La aprobare, banii (inclusiv comisionul) îți sunt rambursați integral pentru „{cancelDialogRental?.product_title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cancel-subject-renter">Subiect</Label>
              <Input
                id="cancel-subject-renter"
                placeholder="Ex: Probleme cu proprietarul"
                value={cancelSubject}
                onChange={(e) => setCancelSubject(e.target.value)}
                maxLength={120}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cancel-reason-renter">Motivul anulării</Label>
              <Textarea
                id="cancel-reason-renter"
                placeholder="Descrie pe scurt motivul (min. 5 caractere)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogRental(null)}>Renunță</Button>
            <Button onClick={handleRequestCancel} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Trimite cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalsTab;
