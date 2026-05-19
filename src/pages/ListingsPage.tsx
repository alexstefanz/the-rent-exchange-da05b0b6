import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Package, Inbox } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMyProducts } from "@/hooks/queries/useProducts";
import { useOwnerListingsStats } from "@/hooks/queries/useOwnerListingsStats";
import ListingsHeader from "@/components/listings/ListingsHeader";
import ListingsStatsBar from "@/components/listings/ListingsStatsBar";
import ListingsFilterBar, { type ListingsFilters } from "@/components/listings/ListingsFilterBar";
import ListingCard from "@/components/listings/ListingCard";
import ListingsEmptyState from "@/components/listings/ListingsEmptyState";
import ListingAvailabilityDialog from "@/components/listings/ListingAvailabilityDialog";
import type { ListingStatus } from "@/components/listings/ListingStatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { deleteProduct, updateProduct, type Product } from "@/features/products/productsApi";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import RentalsOutTab from "@/components/dashboard/RentalsOutTab";

const deriveStatus = (p: Product): ListingStatus => {
  const a = (p as any).approval_status as string | undefined;
  if (a === "pending") return "pending";
  if (a === "rejected") return "rejected";
  if (!p.is_active) return "hidden";
  if (p.available_immediately === false) return "unavailable";
  return "active";
};

const ListingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const topTab = searchParams.get("tab") === "cereri" ? "cereri" : "anunturi";
  const setTopTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "cereri") next.set("tab", "cereri");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  const { data: products = [], isLoading } = useMyProducts(user?.id);
  const { data: stats } = useOwnerListingsStats(user?.id);

  const [filters, setFilters] = useState<ListingsFilters>({
    search: "", status: "all", category: "all", city: "all", sort: "recent",
  });

  const [availabilityProduct, setAvailabilityProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [confirmHide, setConfirmHide] = useState<Product | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Realtime: refresh on any change to user's products
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`owner-listings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `owner_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-products", user.id] });
          qc.invalidateQueries({ queryKey: ["owner-listings-stats", user.id] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort(),
    [products],
  );
  const cities = useMemo(
    () => Array.from(new Set(products.map((p) => p.location_city).filter(Boolean) as string[])).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = [...products];
    const s = filters.search.trim().toLowerCase();
    if (s) list = list.filter((p) => p.title.toLowerCase().includes(s) || (p.title_en || "").toLowerCase().includes(s));
    if (filters.category !== "all") list = list.filter((p) => p.category === filters.category);
    if (filters.city !== "all") list = list.filter((p) => p.location_city === filters.city);
    if (filters.status !== "all") list = list.filter((p) => {
      const st = deriveStatus(p);
      if (filters.status === "active") return st === "active" || st === "unavailable";
      return st === filters.status;
    });
    switch (filters.sort) {
      case "price_asc": list.sort((a, b) => a.daily_price_owner - b.daily_price_owner); break;
      case "price_desc": list.sort((a, b) => b.daily_price_owner - a.daily_price_owner); break;
      case "title_asc": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [products, filters]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-products", user?.id] });
    qc.invalidateQueries({ queryKey: ["owner-listings-stats", user?.id] });
  };

  const handleHide = async (p: Product) => {
    if (!user) return;
    await updateProduct(p.id, { is_active: false }, user.id);
    toast({ title: t("Anunț ascuns", "Listing hidden") });
    refresh();
    setConfirmHide(null);
  };
  const handleActivate = async (p: Product) => {
    if (!user) return;
    await updateProduct(p.id, { is_active: true }, user.id);
    toast({ title: t("Anunț reactivat", "Listing reactivated") });
    refresh();
  };
  const handleDelete = async (p: Product) => {
    if (!user) return;
    await deleteProduct(p.id, user.id);
    toast({ title: t("Anunț șters", "Listing deleted") });
    refresh();
    setConfirmDelete(null);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasNoProducts = products.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 pt-24 lg:pt-8 pb-28 sm:pb-12 space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-4 w-4" /> {t("Înapoi la Contul Meu", "Back to My Account")}
        </Button>

        <TopTabs value={topTab} onValueChange={setTopTab} className="space-y-6">
          <TopTabsList className="h-auto bg-muted/60 p-1">
            <TopTabsTrigger value="anunturi" className="gap-2 px-4 py-2">
              <Package className="h-4 w-4" />
              {t("Anunțuri", "Listings")}
            </TopTabsTrigger>
            <TopTabsTrigger value="cereri" className="gap-2 px-4 py-2">
              <Inbox className="h-4 w-4" />
              {t("Cereri primite", "Requests received")}
            </TopTabsTrigger>
          </TopTabsList>

          <TopTabsContent value="anunturi" className="space-y-6 mt-0">
            <ListingsHeader totalCount={stats?.total ?? products.length} />

        {!hasNoProducts && stats && (
          <ListingsStatsBar
            stats={stats}
            activeStatus={filters.status}
            onSelectStatus={(s) => setFilters((f) => ({ ...f, status: s }))}
            onOpenRentals={() => setTopTab("cereri")}
          />
        )}

        {hasNoProducts ? (
          <ListingsEmptyState />
        ) : (
          <>
            <Tabs
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v as ListingsFilters["status"] }))}
            >
              <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1">
                <TabsTrigger value="all" className="gap-2">
                  {t("Toate", "All")}
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stats?.total ?? products.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2">
                  {t("Active", "Active")}
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stats?.active ?? 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  {t("În verificare", "In review")}
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stats?.pending ?? 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="hidden" className="gap-2">
                  {t("Ascunse", "Hidden")}
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stats?.hidden ?? 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  {t("Respinse", "Rejected")}
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stats?.rejected ?? 0}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ListingsFilterBar
              filters={filters}
              onChange={setFilters}
              categories={categories}
              cities={cities}
              resultCount={filtered.length}
            />

            {filtered.length === 0 ? (
              <ListingsEmptyState filtered />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => {
                  const status = deriveStatus(p);
                  return (
                    <ListingCard
                      key={p.id}
                      product={p}
                      status={status}
                      onCalendar={() => setAvailabilityProduct(p)}
                      onHide={() => setConfirmHide(p)}
                      onActivate={() => handleActivate(p)}
                      onDelete={() => setConfirmDelete(p)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
          </TopTabsContent>

          <TopTabsContent value="cereri" className="space-y-4 mt-0">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold tracking-tight text-lg">{t("Cereri primite", "Bookings received")}</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("Rezervări pentru anunțurile tale", "Bookings on your listings")}
                </p>
              </div>
            </div>
            <RentalsOutTab />
          </TopTabsContent>
        </TopTabs>
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-20 left-4 right-4 z-30 sm:hidden">
        <Button asChild size="lg" className="w-full shadow-lg">
          <Link to="/owner/new-product"><Plus className="h-5 w-5" /> {t("Adaugă produs", "Add product")}</Link>
        </Button>
      </div>

      <ListingAvailabilityDialog
        product={availabilityProduct}
        open={!!availabilityProduct}
        onOpenChange={(o) => !o && setAvailabilityProduct(null)}
        onSaved={refresh}
      />

      <AlertDialog open={!!confirmHide} onOpenChange={(o) => !o && setConfirmHide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ascunzi anunțul?", "Hide listing?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Produsul nu va mai apărea în căutări, dar îl poți reactiva oricând.",
                "The listing will no longer appear in search, but you can reactivate it anytime.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmHide && handleHide(confirmHide)}>
              {t("Ascunde", "Hide")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ștergi anunțul definitiv?", "Delete listing?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Această acțiune nu poate fi anulată. Anunțul va fi eliminat din contul tău.",
                "This action cannot be undone. The listing will be removed from your account.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {t("Șterge definitiv", "Delete permanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default ListingsPage;
