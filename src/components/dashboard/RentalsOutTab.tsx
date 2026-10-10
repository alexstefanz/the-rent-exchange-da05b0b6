import { useState, useMemo, useEffect } from "react";
import RentalTabsBar, { parseTab, emptyTabText, type RentalTabView } from "./RentalTabsBar";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Plus, Check, X, Loader2, Calendar, Inbox, MessageSquare, Clock, Sparkles, ArrowRight, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerRentals, respondToRental, type OwnerRental } from "@/features/rentals/ownerRentalsApi";
import { requestMutualCancellation, cancelErrorMessage } from "@/features/rentals/rentalsApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useRentalRealtime } from "@/hooks/useRentalRealtime";
import StatusBadge from "./StatusBadge";
import RentalsFilterBar, { type RentalStatusFilter, type RentalSortBy } from "./RentalsFilterBar";
import { bucketOf, matchesRentalFilter } from "./rentalBucket";

const VALID_STATUS_FILTERS: RentalStatusFilter[] = [
  "all",
  "ongoing",
  "active",
  "in_progress",
  "overdue",
  "pending",
  "completed",
  "cancelled",
];

/**
 * The account menu links to `?status=ongoing` for "everything in progress".
 * `active` is now reserved for the "Confirmate" filter.
 */
const fromUrlStatus = (value: string | null): RentalStatusFilter | null => {
  if (!value) return null;
  return VALID_STATUS_FILTERS.includes(value as RentalStatusFilter)
    ? (value as RentalStatusFilter)
    : null;
};


const RentalsOutTab = () => {
  const copy = useUxCopy();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  useRentalRealtime(user?.id, "owner", [["ownerRentals", user?.id]]);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["ownerRentals", user?.id],
    queryFn: () => getOwnerRentals(user!.id),
    enabled: !!user?.id,
  });

  const defaultStatus: RentalStatusFilter = fromUrlStatus(searchParams.get("status")) ?? "all";


  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [rejectDialogRental, setRejectDialogRental] = useState<OwnerRental | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelDialogRental, setCancelDialogRental] = useState<OwnerRental | null>(null);
  const [cancelSubject, setCancelSubject] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatusFilter>(defaultStatus);
  const [sortBy, setSortBy] = useState<RentalSortBy>("newest");
  const view: RentalTabView = parseTab(searchParams.get("tab") ?? (searchParams.get("status") === "pending" ? "requests" : searchParams.get("status") === "completed" ? "completed" : searchParams.get("status") === "cancelled" ? "cancelled" : null));
  const changeView = (v: RentalTabView) => { const n = new URLSearchParams(searchParams); n.set("tab", v); n.delete("status"); setSearchParams(n, { replace: true }); };

  useEffect(() => {
    const status = fromUrlStatus(searchParams.get("status"));
    if (!status) return;
    setStatusFilter(status);
  }, [searchParams]);

  const handleStatusFilterChange = (value: RentalStatusFilter) => {
    setStatusFilter(value);
    // Picking a finished-only filter jumps straight to the history tab.
    const next = new URLSearchParams(searchParams);
    if (value === "all") {
      next.delete("status");
    } else {
      next.set("status", value);
    }
    setSearchParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const c = { all: rentals.length, active: 0, in_progress: 0, overdue: 0, pending: 0, completed: 0, cancelled: 0 };
    for (const r of rentals) c[bucketOf(r)]++;
    return c;
  }, [rentals]);

  const matchesStatus = (r: OwnerRental) => matchesRentalFilter(r, statusFilter);


  const sortRentals = (arr: OwnerRental[]) => {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime();
      if (sortBy === "oldest") return new Date(a.created_at || a.start_date).getTime() - new Date(b.created_at || b.start_date).getTime();
      if (sortBy === "amount_desc") return Number(b.owner_payout || 0) - Number(a.owner_payout || 0);
      if (sortBy === "amount_asc") return Number(a.owner_payout || 0) - Number(b.owner_payout || 0);
      return 0;
    });
    return sorted;
  };

  const filtered = useMemo(() => sortRentals(rentals.filter(matchesStatus)), [rentals, statusFilter, sortBy]);

  const FINALIZED = new Set(["completed", "cancelled", "rejected"]);
  const isFinalized = (r: OwnerRental) =>
    FINALIZED.has(r.status) ||
    !!r.return_confirmed_at ||
    (!!r.return_pv_owner_signed_at && !!r.return_pv_renter_signed_at);
  const pendingRentals = filtered.filter(r => r.status === "pending");
  const premiumActiveRentals = filtered.filter(
    r => r.status !== "pending" && !isFinalized(r)
  );
  // History lives in its own tab and is never affected by the active-tab filters.
  const historyRentals = useMemo(
    () => sortRentals(rentals.filter(isFinalized)),
    [rentals, sortBy],
  );
  const activeCount = rentals.filter((r) => !isFinalized(r)).length;


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

  const handleAccept = async (rental: OwnerRental) => {
    setRespondingId(rental.id);
    try {
      await respondToRental(rental.id, "accept");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      toast.success("Cerere acceptată. Așteptăm plata chiriașului.");
    } catch (e) { toast.error("Eroare la acceptarea cererii"); console.error(e); }
    finally { setRespondingId(null); }
  };

  const handleReject = async () => {
    if (!rejectDialogRental) return;
    setRespondingId(rejectDialogRental.id);
    try {
      await respondToRental(rejectDialogRental.id, "reject", rejectReason || undefined);
      toast.success("Cererea a fost refuzată");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      setRejectDialogRental(null);
      setRejectReason("");
    } catch (e) { toast.error("Eroare la refuzarea cererii"); console.error(e); }
    finally { setRespondingId(null); }
  };

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
    setRespondingId(cancelDialogRental.id);
    try {
      await requestMutualCancellation(cancelDialogRental.id, cancelSubject.trim(), cancelReason.trim());
      toast.success("Cererea de anulare a fost trimisă către admin pentru revizuire");
      queryClient.invalidateQueries({ queryKey: ["ownerRentals"] });
      setCancelDialogRental(null);
      setCancelSubject("");
      setCancelReason("");
    } catch (e: any) {
      toast.error(cancelErrorMessage(e?.message || ""));
      console.error(e);
    } finally { setRespondingId(null); }
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
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Package className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mb-2 font-heading text-xl font-semibold text-foreground">Niciun produs închiriat momentan</h3>
        <p className="mb-6 max-w-md text-muted-foreground">Când chiriașii vor rezerva produsele tale, vei vedea aici cererile și închirierile active.</p>
        <Button asChild>
          <Link to="/owner/new-product"><Plus className="mr-2 h-4 w-4" />{copy.dashboard.addListing}</Link>
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
        amountLabel="Câștig"
      />

      {/* Filter & sort bar */}
 
      {isLiveView && liveList.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyTabText(view, "owner")}
          </p>
        </div>
      )}

      {/* Premium request cards */}
      {isLiveView && (liveList.length > 0) && (
        <section>
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            Cereri de închiriere
            <Badge className="bg-primary text-primary-foreground">{liveList.length}</Badge>
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {liveList.map((rental) => {
              const isPending = rental.status === "pending";
              const canRequestCancel = !isPending && !rental.handover_confirmed_at;
              const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
              const isExpired = isPending && new Date(rental.start_date) < startOfToday;
              return (
                <div
                  key={rental.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-card shadow-lg shadow-primary/10"
                >
                  {/* Product image */}
                  <Link
                    to={rental.public_id ? `/inchirieri/${rental.public_id}` : `/produs/${rental.product_id}`}
                    className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-muted block group"
                  >
                    <img
                      src={rental.product_image || "/placeholder.svg"}
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
                      {(() => {
                        const badgeBase = "shadow-md text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5";
                        const today = new Date(); today.setHours(0,0,0,0);
                        const startD = new Date(rental.start_date); startD.setHours(0,0,0,0);
                        const endD = new Date(rental.end_date); endD.setHours(0,0,0,0);
                        const handover = !!rental.handover_confirmed_at;
                        const returned = !!rental.return_confirmed_at;
                        if (isExpired) return <Badge className={`bg-muted text-muted-foreground border border-border ${badgeBase}`}>Expirată</Badge>;
                        if (isPending) return <Badge className={`bg-primary text-primary-foreground animate-pulse ${badgeBase}`}>Cerere nouă</Badge>;
                        if (returned) return <Badge className={`bg-emerald-100 text-emerald-800 border border-emerald-200 ${badgeBase}`}>Finalizată</Badge>;
                        if (endD < today) return <Badge className={`bg-rose-100 text-rose-800 border border-rose-200 ${badgeBase}`}>Întârziată</Badge>;
                        if (handover && endD.getTime() === today.getTime()) return <Badge className={`bg-primary text-primary-foreground ${badgeBase}`}>Returnare azi</Badge>;
                        if (handover) return <Badge className={`bg-sky-100 text-sky-800 border border-sky-200 ${badgeBase}`}>În derulare</Badge>;
                        if (startD.getTime() === today.getTime()) return <Badge className={`bg-primary text-primary-foreground ${badgeBase}`}>Predare azi</Badge>;
                        return <Badge className={`bg-emerald-100 text-emerald-800 border border-emerald-200 ${badgeBase}`}>Confirmată</Badge>;
                      })()}
                    </div>
                  </Link>

                  <div className="flex flex-col p-3 sm:p-4">
                    <div className="flex items-start gap-2 mb-1">
                      <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                          {isPending ? "Cerere de la" : "Rezervare cu"}
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {rental.renter_name || "Chiriaș"}
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
                          {format(new Date(rental.start_date), "d MMM", { locale: ro })} – {format(new Date(rental.end_date), "d MMM", { locale: ro })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{rental.rental_days} {rental.rental_days === 1 ? "zi" : "zile"}</p>
                      </div>
                      <div className="border-l border-border pl-3 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-primary/70 font-semibold">Câștig</p>
                        <p className="text-base sm:text-lg font-bold text-primary leading-tight">{rental.owner_payout} RON</p>
                      </div>
                    </div>

                    {rental.message_to_owner && rental.message_to_owner.trim().length > 0 && (
                      <div className="mt-2 sm:mt-3 rounded-xl rounded-tl-sm bg-background border border-border px-2 sm:px-3 py-1.5 sm:py-2">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">
                          <MessageSquare className="h-3 w-3" />
                          <span>Mesaj de la chiriaș</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground whitespace-pre-wrap break-words line-clamp-2 sm:line-clamp-3">
                          {rental.message_to_owner}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 sm:mt-4">
                      {isPending ? (
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                          {!isExpired && (
                            <Button
                              onClick={() => handleAccept(rental)}
                              disabled={respondingId === rental.id}
                              className="w-full h-9 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/90 shadow-md"
                            >
                              {respondingId === rental.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                              Acceptă
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => setRejectDialogRental(rental)}
                            disabled={respondingId === rental.id}
                            className="w-full h-9 text-xs sm:text-sm"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />Refuză
                          </Button>
                          {isExpired && (
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center mt-0.5">
                              Data de început a trecut. Cererea nu mai poate fi acceptată.
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button asChild className="w-full h-9 text-xs sm:text-sm">
                          <Link to={rental.public_id ? `/inchirieri/${rental.public_id}` : `/produs/${rental.product_id}`}>
                            Vezi detalii <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                          </Link>
                        </Button>
                      )}

                      {canRequestCancel && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelDialogRental(rental)}
                            disabled={respondingId === rental.id}
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
          <p className="text-sm text-muted-foreground">{emptyTabText(view, "owner")}</p>
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
              const to = rental.public_id ? `/inchirieri/${rental.public_id}` : `/produs/${rental.product_id}`;
              const allowed = ["pending", "accepted", "rejected", "completed", "cancelled", "active", "inactive"];
              const statusKey = (allowed.includes(rental.status) ? rental.status : "pending") as any;
              return (
                <div key={rental.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link to={to} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
                    <img src={rental.product_image || "/placeholder.svg"} alt={rental.product_title} loading="lazy" className="h-full w-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium text-foreground truncate">{rental.product_title}</p>
                      {rental.public_id && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 flex-shrink-0">{rental.public_id}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      Chiriaș: <span className="text-foreground">{rental.renter_name || "—"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rental.start_date), "d MMM yyyy", { locale: ro })} – {format(new Date(rental.end_date), "d MMM yyyy", { locale: ro })} · {rental.rental_days} zile
                    </p>
                  </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{rental.owner_payout} RON</p>
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

      {/* Reject dialog */}
      <Dialog open={!!rejectDialogRental} onOpenChange={(open) => !open && setRejectDialogRental(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuză cererea de închiriere</DialogTitle>
            <DialogDescription>Ești sigur că vrei să refuzi cererea pentru „{rejectDialogRental?.product_title}"?</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Motiv (opțional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogRental(null)}>Anulează</Button>
            <Button variant="destructive" onClick={handleReject} disabled={respondingId === rejectDialogRental?.id}>
              {respondingId === rejectDialogRental?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Refuză cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mutual cancel request dialog */}
      <Dialog open={!!cancelDialogRental} onOpenChange={(open) => !open && setCancelDialogRental(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicită anularea cererii</DialogTitle>
            <DialogDescription>
              Cererea va fi revizuită de un admin. La aprobare, banii (inclusiv comisionul) sunt rambursați integral chiriașului pentru „{cancelDialogRental?.product_title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cancel-subject-owner">Subiect</Label>
              <Input
                id="cancel-subject-owner"
                placeholder="Ex: Indisponibilitate produs"
                value={cancelSubject}
                onChange={(e) => setCancelSubject(e.target.value)}
                maxLength={120}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cancel-reason-owner">Motivul anulării</Label>
              <Textarea
                id="cancel-reason-owner"
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
            <Button
              variant="destructive"
              onClick={handleRequestCancel}
              disabled={respondingId === cancelDialogRental?.id}
            >
              {respondingId === cancelDialogRental?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Trimite cererea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalsOutTab;
