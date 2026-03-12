import { useState, useMemo } from "react";
import { Package, Search, MoreHorizontal, Loader2, Flag, Eye, EyeOff, Trash2, AlertTriangle, Star, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import SortableTableHead, { SortDirection, sortData, useToggleSort } from "@/components/admin/SortableTableHead";
import TableColumnFilterRow, { applyColumnFilters, ColumnFilterConfig } from "@/components/admin/TableColumnFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminProducts, toggleProductActive, flagProduct, unflagProduct, deleteProduct, approveProduct, rejectProduct, AdminProduct } from "@/features/admin/adminProductsApi";
import { fetchProductReviews, deleteProductReview, AdminProductReview } from "@/features/admin/adminReviewsApi";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [flagDialog, setFlagDialog] = useState<{ open: boolean; productId: string }>({ open: false, productId: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string; title: string }>({ open: false, productId: "", title: "" });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; productId: string }>({ open: false, productId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [reviewsDialog, setReviewsDialog] = useState<{ open: boolean; productId: string; title: string }>({ open: false, productId: "", title: "" });
  const [reviewsData, setReviewsData] = useState<AdminProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { from?: Date; to?: Date }>>({});
  const queryClient = useQueryClient();
  const handleSort = useToggleSort(setSortKey, setSortDirection, sortKey, sortDirection);

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (key: string, range: { from?: Date; to?: Date }) => {
    setDateRangeFilters(prev => ({ ...prev, [key]: range }));
  };

  const { data: categories } = useQuery({
    queryKey: ['platformCategories'],
    queryFn: async () => {
      const { data } = await supabase.from('platform_categories').select('name').eq('is_active', true).order('sort_order');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['adminProducts', debouncedSearch, statusFilter],
    queryFn: () => fetchAdminProducts(
      debouncedSearch || undefined,
      statusFilter === 'all' ? undefined : statusFilter
    ),
    staleTime: 30000,
  });

  // Dynamic options from data
  const cityOptions = useMemo(() => {
    if (!products) return [];
    const cities = [...new Set(products.map(p => p.location_city).filter(Boolean))];
    return cities.sort((a, b) => a.localeCompare(b, 'ro')).map(c => ({ value: c, label: c }));
  }, [products]);

  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    return categories.map(c => ({ value: c.name, label: c.name }));
  }, [categories]);

  const productColumnFilters: ColumnFilterConfig[] = [
    { key: "title", type: "text", placeholder: "Titlu..." },
    { key: "owner_name", type: "text", placeholder: "Proprietar..." },
    { key: "daily_price_owner", type: "amountrange", placeholder: "Preț" },
    { key: "category", type: "combobox", placeholder: "Categorie", options: categoryOptions },
    { key: "location_city", type: "combobox", placeholder: "Oraș", options: cityOptions },
    { key: "is_active", type: "select", placeholder: "Status", options: [
      { value: "true", label: "Activ" },
      { value: "false", label: "Inactiv" },
    ]},
    { key: "created_at", type: "daterange", placeholder: "Perioadă" },
    { key: "_actions", type: "text" },
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleToggleActive = async (product: AdminProduct) => {
    setActionLoading(product.id);
    try {
      await toggleProductActive(product.id, !product.is_active);
      toast.success(product.is_active ? "Produs dezactivat" : "Produs activat");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    } catch { toast.error("Eroare la actualizare"); }
    finally { setActionLoading(null); }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    setActionLoading(flagDialog.productId);
    try {
      await flagProduct(flagDialog.productId, flagReason);
      toast.success("Produs marcat ca suspect");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setFlagDialog({ open: false, productId: "" });
      setFlagReason("");
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleUnflag = async (productId: string) => {
    setActionLoading(productId);
    try {
      await unflagProduct(productId);
      toast.success("Flag ridicat");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    setActionLoading(deleteDialog.productId);
    try {
      await deleteProduct(deleteDialog.productId);
      toast.success("Produs șters definitiv");
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setDeleteDialog({ open: false, productId: "", title: "" });
    } catch { toast.error("Eroare la ștergere"); }
    finally { setActionLoading(null); }
  };

  const handleOpenReviews = async (productId: string, title: string) => {
    setReviewsDialog({ open: true, productId, title });
    setReviewsLoading(true);
    try {
      const reviews = await fetchProductReviews(productId);
      setReviewsData(reviews);
    } catch { toast.error("Eroare la încărcarea recenziilor"); }
    finally { setReviewsLoading(false); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      await deleteProductReview(reviewId);
      setReviewsData(prev => prev.filter(r => r.id !== reviewId));
      toast.success("Recenzie ștearsă");
    } catch { toast.error("Eroare la ștergerea recenziei"); }
    finally { setDeletingReviewId(null); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', minimumFractionDigits: 0 }).format(v);

  const filteredData = useMemo(() => {
    return sortData(
      applyColumnFilters(products, columnFilters, dateRangeFilters),
      sortKey,
      sortDirection
    );
  }, [products, columnFilters, dateRangeFilters, sortKey, sortDirection]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" /> Gestionare Produse
          </h1>
          <p className="text-muted-foreground">Administrează toate anunțurile de pe platformă</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Caută după titlu..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="flagged">Marcate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista Produselor</CardTitle>
            <CardDescription>{filteredData.length} produse găsite</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : products && products.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead label="Produs" sortKey="title" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Proprietar" sortKey="owner_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Preț/zi" sortKey="daily_price_owner" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Categorie" sortKey="category" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead label="Oraș" sortKey="location_city" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <TableHead>Status</TableHead>
                      <SortableTableHead label="Data" sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableColumnFilterRow
                      filters={productColumnFilters}
                      values={columnFilters}
                      onChange={handleColumnFilter}
                      dateRangeValues={dateRangeFilters}
                      onDateRangeChange={handleDateRangeChange}
                    />
                    {filteredData.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                            )}
                            <div>
                              <span className="font-medium line-clamp-1">{product.title}</span>
                              {product.admin_flagged && (
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                  <AlertTriangle className="h-3 w-3" /> {product.flag_reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{product.owner_name}</TableCell>
                        <TableCell>{formatCurrency(product.daily_price_owner)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{product.category || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{product.location_city || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Activ" : "Inactiv"}
                            </Badge>
                            {product.admin_flagged && <Badge variant="destructive">Marcat</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(product.created_at), 'd MMM yyyy', { locale: ro })}
                        </TableCell>
                        <TableCell className="text-right">
                          {actionLoading === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(`/produs/${product.slug}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" /> Vezi pe site
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                                  {product.is_active ? <><EyeOff className="h-4 w-4 mr-2" /> Dezactivează</> : <><Eye className="h-4 w-4 mr-2" /> Activează</>}
                                </DropdownMenuItem>
                                {product.admin_flagged ? (
                                  <DropdownMenuItem onClick={() => handleUnflag(product.id)}>
                                    <Flag className="h-4 w-4 mr-2" /> Ridică flag
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setFlagDialog({ open: true, productId: product.id })}>
                                    <Flag className="h-4 w-4 mr-2" /> Marchează suspect
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleOpenReviews(product.id, product.title)}>
                                  <MessageSquare className="h-4 w-4 mr-2" /> Recenzii
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ open: true, productId: product.id, title: product.title })}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Șterge definitiv
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu s-au găsit produse</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flag Dialog */}
      <Dialog open={flagDialog.open} onOpenChange={(open) => { setFlagDialog({ open, productId: flagDialog.productId }); if (!open) setFlagReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marchează produs ca suspect</DialogTitle>
            <DialogDescription>Introdu motivul pentru care acest produs este suspect.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Motivul..." value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialog({ open: false, productId: "" })}>Anulează</Button>
            <Button variant="destructive" onClick={handleFlag} disabled={!flagReason.trim()}>Marchează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi definitiv „{deleteDialog.title}"? Această acțiune nu poate fi anulată.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, productId: "", title: "" })}>Anulează</Button>
            <Button variant="destructive" onClick={handleDelete}>Șterge definitiv</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={reviewsDialog.open} onOpenChange={(open) => { if (!open) setReviewsDialog({ open: false, productId: "", title: "" }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" /> Recenzii — {reviewsDialog.title}
            </DialogTitle>
            <DialogDescription>{reviewsData.length} recenzii</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {reviewsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : reviewsData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nicio recenzie pentru acest produs.</p>
            ) : (
              <div className="space-y-4 pr-2">
                {reviewsData.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.reviewer_avatar || undefined} />
                          <AvatarFallback>{(review.reviewer_name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{review.reviewer_name || "Anonim"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'd MMM yyyy', { locale: ro })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {review.rating}/5
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{review.review_type === "owner" ? "Proprietar" : "Chiriaș"}</Badge>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    {(review.rating_product_condition || review.rating_communication || review.rating_punctuality) && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {review.rating_product_condition && <span>Stare: {review.rating_product_condition}/5</span>}
                        {review.rating_communication && <span>Comunicare: {review.rating_communication}/5</span>}
                        {review.rating_punctuality && <span>Punctualitate: {review.rating_punctuality}/5</span>}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingReviewId === review.id}
                      >
                        {deletingReviewId === review.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
