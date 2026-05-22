import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScanLine, CheckCircle2, Edit3, Save, X, Loader2, AlertCircle, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  fetchExtractedDataForUser,
  triggerExtractIdData,
  updateExtractedData,
  verifyExtractedData,
  unverifyExtractedData,
  type KycExtractedData,
  type KycExtractedEditable,
} from "@/features/admin/kycExtractedDataApi";

interface Props {
  userId: string;
  kycCaseId: string;
}

const EMPTY: KycExtractedEditable = {
  cnp: "", id_series: "", id_number: "", full_name: "", address: "", birth_date: "", issued_by: "", valid_until: "",
};

const ExtractedIdDataCard = ({ userId, kycCaseId }: Props) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<KycExtractedEditable>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["kycExtracted", userId],
    queryFn: () => fetchExtractedDataForUser(userId),
    enabled: !!userId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["kycExtracted", userId] });

  const extractMutation = useMutation({
    mutationFn: () => triggerExtractIdData(kycCaseId),
    onSuccess: (res: any) => {
      if (res?.error) { toast.error(`Extracție eșuată: ${res.error}`); return; }
      toast.success("Date extrase din CI");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: () => updateExtractedData(data!.id, form),
    onSuccess: () => { toast.success("Date actualizate"); setEditing(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: () => data!.verified_by_admin ? unverifyExtractedData(data!.id) : verifyExtractedData(data!.id),
    onSuccess: () => { toast.success("Status verificare actualizat"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (d: KycExtractedData) => {
    setForm({
      cnp: d.cnp ?? "", id_series: d.id_series ?? "", id_number: d.id_number ?? "",
      full_name: d.full_name ?? "", address: d.address ?? "", birth_date: d.birth_date ?? "",
      issued_by: d.issued_by ?? "", valid_until: d.valid_until ?? "",
    });
    setEditing(true);
  };

  const confidence = data?.extraction_confidence ?? null;
  const confColor = confidence === null ? "" : confidence >= 0.8 ? "text-green-700" : confidence >= 0.5 ? "text-orange-600" : "text-destructive";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              Date extrase din CI
              {data?.verified_by_admin && (
                <Badge className="bg-green-100 text-green-800 border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verificat
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Folosite automat în Procesele Verbale pentru identificarea părților.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
              {extractMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCw className="h-4 w-4 mr-1" />}
              {data ? "Re-extrage" : "Extrage"}
            </Button>
            {data && !editing && (
              <Button size="sm" variant="outline" onClick={() => startEdit(data)}>
                <Edit3 className="h-4 w-4 mr-1" /> Editează
              </Button>
            )}
            {data && (
              <Button
                size="sm"
                variant={data.verified_by_admin ? "outline" : "default"}
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
              >
                {data.verified_by_admin ? "Anulează verificare" : "Confirmă"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Se încarcă...</p>}
        {!isLoading && !data && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Nu s-au extras încă date. Apasă „Extrage" pentru a rula OCR pe documentele încărcate.
          </div>
        )}
        {data && !editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field label="CNP" value={data.cnp} mono />
            <Field label="Serie / Număr" value={[data.id_series, data.id_number].filter(Boolean).join(" / ") || null} mono />
            <Field label="Nume complet" value={data.full_name} />
            <Field label="Data nașterii" value={data.birth_date} />
            <Field label="Adresă" value={data.address} className="sm:col-span-2" />
            <Field label="Emis de" value={data.issued_by} />
            <Field label="Valabil până la" value={data.valid_until} />
            {confidence !== null && (
              <Field label="Acuratețe OCR" value={`${Math.round(confidence * 100)}%`} valueClassName={confColor} />
            )}
          </div>
        )}
        {data && editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Editable label="CNP" value={form.cnp} onChange={(v) => setForm({ ...form, cnp: v })} mono />
            <div className="grid grid-cols-2 gap-2">
              <Editable label="Serie" value={form.id_series} onChange={(v) => setForm({ ...form, id_series: v.toUpperCase() })} mono />
              <Editable label="Număr" value={form.id_number} onChange={(v) => setForm({ ...form, id_number: v })} mono />
            </div>
            <Editable label="Nume complet" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} className="sm:col-span-2" />
            <Editable label="Adresă" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="sm:col-span-2" />
            <Editable label="Data nașterii" value={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} placeholder="YYYY-MM-DD" />
            <Editable label="Valabil până la" value={form.valid_until} onChange={(v) => setForm({ ...form, valid_until: v })} placeholder="YYYY-MM-DD" />
            <Editable label="Emis de" value={form.issued_by} onChange={(v) => setForm({ ...form, issued_by: v })} className="sm:col-span-2" />
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Anulează
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvează
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Field = ({ label, value, mono, className, valueClassName }: { label: string; value: string | null; mono?: boolean; className?: string; valueClassName?: string }) => (
  <div className={className}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-medium ${mono ? "font-mono" : ""} ${valueClassName ?? ""}`}>{value || <span className="text-muted-foreground font-normal">—</span>}</p>
  </div>
);

const Editable = ({ label, value, onChange, mono, className, placeholder }: { label: string; value: string | null; onChange: (v: string) => void; mono?: boolean; className?: string; placeholder?: string }) => (
  <div className={className}>
    <Label className="text-xs">{label}</Label>
    <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={mono ? "font-mono" : ""} placeholder={placeholder} />
  </div>
);

export default ExtractedIdDataCard;