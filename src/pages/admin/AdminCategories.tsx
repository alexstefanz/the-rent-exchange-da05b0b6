import { useState } from "react";
import { FolderTree, Plus, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategories, fetchSubcategories, createCategory, updateCategory, deleteCategory,
  toggleCategoryActive, createSubcategory, updateSubcategory, deleteSubcategory, toggleSubcategoryActive,
  PlatformCategory, PlatformSubcategory
} from "@/features/admin/categoriesApi";
import { toast } from "sonner";

const AdminCategories = () => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [catDialog, setCatDialog] = useState<{ open: boolean; editing?: PlatformCategory }>({ open: false });
  const [subDialog, setSubDialog] = useState<{ open: boolean; categoryId: string; editing?: PlatformSubcategory }>({ open: false, categoryId: "" });
  const [catForm, setCatForm] = useState({ name: "", name_en: "", icon: "", sort_order: 0 });
  const [subForm, setSubForm] = useState({ name: "", name_en: "", description: "", description_en: "", image_url: "", sort_order: 0 });
  const queryClient = useQueryClient();

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['platformCategories'],
    queryFn: fetchCategories,
  });

  const { data: subcategories } = useQuery({
    queryKey: ['platformSubcategories'],
    queryFn: () => fetchSubcategories(),
  });

  const openCatDialog = (cat?: PlatformCategory) => {
    if (cat) {
      setCatForm({ name: cat.name, name_en: cat.name_en || "", icon: cat.icon || "", sort_order: cat.sort_order });
      setCatDialog({ open: true, editing: cat });
    } else {
      setCatForm({ name: "", name_en: "", icon: "", sort_order: (categories?.length || 0) });
      setCatDialog({ open: true });
    }
  };

  const openSubDialog = (categoryId: string, sub?: PlatformSubcategory) => {
    if (sub) {
      setSubForm({ name: sub.name, name_en: sub.name_en || "", description: sub.description || "", description_en: sub.description_en || "", image_url: sub.image_url || "", sort_order: sub.sort_order });
      setSubDialog({ open: true, categoryId, editing: sub });
    } else {
      const catSubs = subcategories?.filter(s => s.category_id === categoryId) || [];
      setSubForm({ name: "", name_en: "", description: "", description_en: "", image_url: "", sort_order: catSubs.length });
      setSubDialog({ open: true, categoryId });
    }
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return;
    setActionLoading("cat");
    try {
      if (catDialog.editing) {
        await updateCategory(catDialog.editing.id, catForm);
        toast.success("Categorie actualizată");
      } else {
        await createCategory(catForm);
        toast.success("Categorie creată");
      }
      queryClient.invalidateQueries({ queryKey: ['platformCategories'] });
      setCatDialog({ open: false });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleDeleteCat = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteCategory(id);
      toast.success("Categorie ștearsă");
      queryClient.invalidateQueries({ queryKey: ['platformCategories'] });
    } catch { toast.error("Eroare la ștergere"); }
    finally { setActionLoading(null); }
  };

  const handleToggleCat = async (id: string, isActive: boolean) => {
    setActionLoading(id);
    try {
      await toggleCategoryActive(id, !isActive);
      toast.success(isActive ? "Categorie dezactivată" : "Categorie activată");
      queryClient.invalidateQueries({ queryKey: ['platformCategories'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleSaveSub = async () => {
    if (!subForm.name.trim()) return;
    setActionLoading("sub");
    try {
      if (subDialog.editing) {
        await updateSubcategory(subDialog.editing.id, subForm);
        toast.success("Subcategorie actualizată");
      } else {
        await createSubcategory({ ...subForm, category_id: subDialog.categoryId });
        toast.success("Subcategorie creată");
      }
      queryClient.invalidateQueries({ queryKey: ['platformSubcategories'] });
      setSubDialog({ open: false, categoryId: "" });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleDeleteSub = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteSubcategory(id);
      toast.success("Subcategorie ștearsă");
      queryClient.invalidateQueries({ queryKey: ['platformSubcategories'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  const handleToggleSub = async (id: string, isActive: boolean) => {
    setActionLoading(id);
    try {
      await toggleSubcategoryActive(id, !isActive);
      queryClient.invalidateQueries({ queryKey: ['platformSubcategories'] });
    } catch { toast.error("Eroare"); }
    finally { setActionLoading(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FolderTree className="h-8 w-8" /> Gestionare Categorii
            </h1>
            <p className="text-muted-foreground">Administrează categoriile și subcategoriile platformei</p>
          </div>
          <Button onClick={() => openCatDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Categorie Nouă
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categorii Platformă</CardTitle>
            <CardDescription>{categories?.length || 0} categorii</CardDescription>
          </CardHeader>
          <CardContent>
            {catsLoading ? (
              <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : categories && categories.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {categories.map((cat) => {
                  const catSubs = subcategories?.filter(s => s.category_id === cat.id) || [];
                  return (
                    <AccordionItem key={cat.id} value={cat.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                          {cat.name_en && <span className="text-sm text-muted-foreground">({cat.name_en})</span>}
                          <Badge variant={cat.is_active ? "default" : "secondary"} className="ml-2">
                            {cat.is_active ? "Activă" : "Inactivă"}
                          </Badge>
                          <Badge variant="outline" className="ml-1">{catSubs.length} sub</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-8">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openCatDialog(cat)}>
                              <Pencil className="h-3 w-3 mr-1" /> Editează
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleToggleCat(cat.id, cat.is_active)} disabled={actionLoading === cat.id}>
                              {cat.is_active ? <><ToggleRight className="h-3 w-3 mr-1" /> Dezactivează</> : <><ToggleLeft className="h-3 w-3 mr-1" /> Activează</>}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCat(cat.id)} disabled={actionLoading === cat.id}>
                              <Trash2 className="h-3 w-3 mr-1" /> Șterge
                            </Button>
                            <Button size="sm" onClick={() => openSubDialog(cat.id)}>
                              <Plus className="h-3 w-3 mr-1" /> Subcategorie
                            </Button>
                          </div>
                          {catSubs.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nume</TableHead>
                                  <TableHead>Ordine</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Acțiuni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {catSubs.map((sub) => (
                                  <TableRow key={sub.id}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{sub.name}</p>
                                        {sub.name_en && <p className="text-xs text-muted-foreground">{sub.name_en}</p>}
                                      </div>
                                    </TableCell>
                                    <TableCell>{sub.sort_order}</TableCell>
                                    <TableCell>
                                      <Badge variant={sub.is_active ? "default" : "secondary"}>
                                        {sub.is_active ? "Activă" : "Inactivă"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-1 justify-end">
                                        <Button size="icon" variant="ghost" onClick={() => openSubDialog(cat.id, sub)}><Pencil className="h-3 w-3" /></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleSub(sub.id, sub.is_active)}>
                                          {sub.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteSub(sub.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există categorii. Adaugă prima categorie.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Dialog */}
      <Dialog open={catDialog.open} onOpenChange={(open) => setCatDialog({ ...catDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catDialog.editing ? "Editează Categorie" : "Categorie Nouă"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nume (RO)</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
            <div><Label>Nume (EN)</Label><Input value={catForm.name_en} onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })} /></div>
            <div><Label>Icon (emoji)</Label><Input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="🎮" /></div>
            <div><Label>Ordine sortare</Label><Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog({ open: false })}>Anulează</Button>
            <Button onClick={handleSaveCat} disabled={!catForm.name.trim() || actionLoading === "cat"}>
              {actionLoading === "cat" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subDialog.open} onOpenChange={(open) => setSubDialog({ ...subDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subDialog.editing ? "Editează Subcategorie" : "Subcategorie Nouă"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nume (RO)</Label><Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} /></div>
            <div><Label>Nume (EN)</Label><Input value={subForm.name_en} onChange={(e) => setSubForm({ ...subForm, name_en: e.target.value })} /></div>
            <div><Label>Descriere (RO)</Label><Input value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} /></div>
            <div><Label>URL Imagine</Label><Input value={subForm.image_url} onChange={(e) => setSubForm({ ...subForm, image_url: e.target.value })} /></div>
            <div><Label>Ordine sortare</Label><Input type="number" value={subForm.sort_order} onChange={(e) => setSubForm({ ...subForm, sort_order: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog({ open: false, categoryId: "" })}>Anulează</Button>
            <Button onClick={handleSaveSub} disabled={!subForm.name.trim() || actionLoading === "sub"}>
              {actionLoading === "sub" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
