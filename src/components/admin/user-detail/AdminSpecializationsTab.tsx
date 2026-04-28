import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ADMIN_CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS_RO,
  fetchAdminSpecializations,
  setAdminSpecializations,
  type AdminCategoryGroup,
} from "@/features/admin/adminSpecializationsApi";

interface Props {
  userId: string;
}

const AdminSpecializationsTab = ({ userId }: Props) => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<AdminCategoryGroup>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["adminSpecializations", userId],
    queryFn: () => fetchAdminSpecializations(userId),
  });

  useEffect(() => {
    if (data) {
      setSelected(new Set(data.map((d) => d.category_group as AdminCategoryGroup)));
    }
  }, [data]);

  const toggle = (g: AdminCategoryGroup) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setAdminSpecializations(userId, Array.from(selected));
      toast.success("Specializări salvate");
      queryClient.invalidateQueries({ queryKey: ["adminSpecializations", userId] });
    } catch (e: any) {
      toast.error(e.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1">Categorii de tichete preluate automat</h3>
        <p className="text-xs text-muted-foreground">
          Tichetele noi din categoriile bifate sunt atribuite automat acestui admin.
          Dacă mai mulți admini au aceeași specializare, se alege cel cu cele mai puține tichete deschise.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {ADMIN_CATEGORY_GROUPS.map((g) => (
          <label
            key={g}
            className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selected.has(g)}
              onCheckedChange={() => toggle(g)}
            />
            <span className="text-sm font-medium">{CATEGORY_GROUP_LABELS_RO[g]}</span>
          </label>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvează specializările
      </Button>
    </div>
  );
};

export default AdminSpecializationsTab;