import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  createOpsTicket,
  CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS,
  CATEGORY_TYPES,
  PRIORITY_OPTIONS,
} from "@/features/admin/opsTicketsApi";
import { toast } from "@/components/ui/sonner";

const AdminTicketCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_group: "",
    category_type: "",
    priority: "MEDIUM",
    reservation_id: "",
    product_id: "",
  });

  const categoryTypes = form.category_group ? (CATEGORY_TYPES[form.category_group] || []) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category_group || !form.category_type) {
      toast.error("Completează câmpurile obligatorii");
      return;
    }
    setLoading(true);
    try {
      const ticket = await createOpsTicket({
        title: form.title,
        description: form.description,
        category_group: form.category_group,
        category_type: form.category_type,
        priority: form.priority,
        reservation_id: form.reservation_id || null,
        product_id: form.product_id || null,
      });
      toast.success(`Ticket ${ticket.public_id} creat!`);
      navigate(`/admin/tickets/${ticket.id}`);
    } catch (err: any) {
      toast.error(err.message || "Eroare la creare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tickets')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Înapoi la tichete
          </Button>
          <h1 className="text-2xl font-bold">Ticket Nou</h1>
          <p className="text-muted-foreground">Creează un tichet operațional</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Titlu *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Descrie pe scurt problema..."
                />
              </div>

              <div>
                <Label>Descriere</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalii suplimentare..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grup categorie *</Label>
                  <Select
                    value={form.category_group}
                    onValueChange={v => setForm(f => ({ ...f, category_group: v, category_type: "" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_GROUPS.map(g => (
                        <SelectItem key={g} value={g}>{CATEGORY_GROUP_LABELS[g]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tip problemă *</Label>
                  <Select
                    value={form.category_type}
                    onValueChange={v => setForm(f => ({ ...f, category_type: v }))}
                    disabled={!form.category_group}
                  >
                    <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                    <SelectContent>
                      {categoryTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Prioritate</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID Rezervare (opțional)</Label>
                  <Input
                    value={form.reservation_id}
                    onChange={e => setForm(f => ({ ...f, reservation_id: e.target.value }))}
                    placeholder="UUID rezervare..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-populează context (produs, chiriaș, owner)</p>
                </div>
                <div>
                  <Label>ID Produs (opțional)</Label>
                  <Input
                    value={form.product_id}
                    onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                    placeholder="UUID produs..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Creează Ticket
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/tickets')}>
                  Anulează
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTicketCreate;
