import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import RentalTabsBar, { parseTab, emptyTabText, type RentalTabView } from "./RentalTabsBar";
import { Link } from "react-router-dom";
import { Calendar, Search, Loader2, Package, Inbox, Clock, Sparkles, ArrowRight, Ban, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import { requestMutualCancellation } from "@/features/rentals/rentalsApi";
import { toast } from "@/components/ui/sonner";
import StatusBadge from "./StatusBadge";
import RentalsFilterBar, { type RentalStatusFilter, type RentalSortBy } from "./RentalsFilterBar";
import { bucketOf, matchesRentalFilter } from "./rentalBucket";

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
  return_pv_owner_signed_at: string | null;
  return_pv_renter_signed_at: string | null;
}

const fetchMyRentals = async (userId: string): Promise<MyRental[]> => {
  const { data, error } = await supabase
    .from("rentals")
    .select("id, public_id, product_id, owner_id, start_date, end_date, rental_days, subtotal, status, payment_status, handover_confirmed_at, return_confirmed_at, message_to_owner, created_at, products(title, images)")
    .eq("renter_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const ownerIds = Array.from(new Set((data || []).map((r: any) => r.owner_id).filter(Boolean)));
  const rentalIds = (data || []).map((r: any) => r.id);

  // Run the two secondary lookups in parallel instead of sequentially.
  const [profilesRes, pvsRes] = await Promise.all([
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", ownerIds)
      : Promise.resolve({ data: [] as any[] }),
    rentalIds.length > 0
      ? supabase
          .from("rental_pv_documents")
          .select("rental_id, owner_signed_at, renter_signed_at")
          .eq("phase", "return")
          .in("rental_id", rentalIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const ownerMap: Record<string, string> = Object.fromEntries(
    ((profilesRes.data as any[]) || []).map((p: any) => [p.id, p.full_name || "Proprietar"]),
  );
  const pvMap: Record<string, { owner: string | null; renter: string | null }> = Object.fromEntries(
    ((pvsRes.data as any[]) || []).map((p: any) => [
      p.rental_id,
      { owner: p.owner_signed_at, renter: p.renter_signed_at },
    ]),
  );

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
    return_pv_owner_signed_at: pvMap[r.id]?.owner ?? null,
    return_pv_renter_signed_at: pvMap[r.id]?.renter ?? null,
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
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const [cancelDialogRental, setCancelDialogRental] = useState<MyRental | null>(null);
  const [cancelSubject, setCancelSubject] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RentalStatusFilter>("all");
  const [sortBy, setSortBy] = useState<RentalSortBy>("newest");
  const [searchParams, setSearchParams] = useSearchParams();
  const view: RentalTabView = parseTab(searchParams.get("tab"));
  const changeView = (v: RentalTabView) => { const n = new URLSearchParams(searchParams); n.set("tab", v); setSearchParams(n, { replace: true }); };

  const counts = useMemo(() => {
    const c = { all: rentals.length, active: 0, in_progress: 0, overdue: 0, pending: 0, completed: 0, cancelled: 0 };
    for (const r of rentals) c[bucketOf(r)]++;
    return c;
  }, [rentals]);

  const matchesStatus = (r: MyRental) => matchesRentalFilter(r, statusFilter);

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

  const FINALIZED = new Set(["completed", "cancelled", "rejected"]);
  const isFinalized = (r: MyRental) =>
    FINALIZED.has(r.status) ||
    !!r.return_confirmed_at ||
    (!!r.return_pv_owner_signed_at && !!r.return_pv_renter_signed_at);
  const isPremium = (r: MyRental) => !isFinalized(r);
  // Keep the filtered sort order (default: newest first) so the most recent rental
  // always shows up as the first card, regardless of status.
  const premiumRentals = filtered.filter(isPremium);
  // History lives in its own tab and is never affected by the active-tab filters.
  const historyRentals = useMemo(
    () => sortRentals(rentals.filter(isFinalized)),
    [rentals, sortBy],
  );
  const activeCount = rentals.filter((r) => !isFinalized(r)).length;

  // Picking a finished-only filter jumps straight to the history tab.
  const handleStatusFilterChange = (value: RentalStatusFilter) => {
    setStatusFilter(value);
  };



  const sortedAll = useMemo(() => sortRentals(rentals), [rentals, sortBy]);
  const isCancelled = (r: any) => r.status === "cancelled" || r.status === "rejected";
  const requestsList = sortedAll.filter((r) => r.status === "pending");
  const activeList = sortedAll.filter((r) => r.status !== "pending" && !isFinalized(r));
  const completedList = sortedAll.filter((r) => isFinalized(r) && !isCancelled(r));
  const cancelledList = sortedAll.filter(isCancelled);
  const isLiveView = view === "requests" || view === "active";
  const isDoneView = !isLiveView;
  const liveList = view === "requests" ? requestsList : activeList;
  const doneList = view === "completed" ? completedList : cancelledList;

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
      <RentalTabsBar
        view={view}
        onChange={changeView}
        counts={{ requests: requestsList.length, active: activeList.length, completed: completedList.length, cancelled: cancelledList.length }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        amountLabel="Preț"
      />

      {/* Filter & sort bar */}
 
      {isLiveView && liveList.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyTabText(view, "renter")}
          </p>
        </div>
      )}

      {/* Premium reservation cards */}
      {isLiveView && liveList.length > 0 && (
        <section>
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2 text-base">
            Rezervările mele
            <Badge className="bg-primary text-primary-foreground">{liveList.length}</Badge>
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {liveList.map((rental) => {
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

                    <div className="mt-3 sm:mt-4 flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Perioadă</p>
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {format(new Date(rental.start_date), "d MMM", { locale: roLocale })} – {format(new Date(rental.end_date), "d MMM", { locale: roLocale })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{rental.rental_days} {rental.rental_days === 1 ? "zi" : "zile"}</p>
                      </div>
                      <div className="border-l border-border pl-3 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-primary/70 font-semibold">Total</p>
                        <p className="text-base sm:text-lg font-bold text-primary leading-tight">{rental.subtotal} RON</p>
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

      {isDoneView && doneList.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyTabText(view, "renter")}</p>
        </div>
      )}

      {/* History list (no images) */}
      {isDoneView && doneList.length > 0 && (
        <section>
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-primary" />
            Istoric închirieri
            <Badge variant="secondary">{doneList.length}</Badge>
          </h3>
          <div className="divide-y divide-border border rounded-xl bg-card px-4">
            {doneList.map((rental) => {
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
        </section>
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
