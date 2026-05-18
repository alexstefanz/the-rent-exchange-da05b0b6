import { Building2, MapPin, FileText, Receipt, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CompanyData {
  denumire: string | null;
  adresa: string | null;
  nrRegCom: string | null;
  scpTVA: boolean;
}

interface Props {
  data: CompanyData;
  onChange: (data: CompanyData) => void;
}

export const CompanyAutofillCard = ({ data, onChange }: Props) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-5 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold">
          <Building2 className="h-5 w-5" />
          Date companie
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-emerald-800 hover:bg-emerald-100"
          onClick={() => setEditing((v) => !v)}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Gata" : "Editează"}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <FieldEdit
            label="Denumire companie"
            value={data.denumire ?? ""}
            onChange={(v) => onChange({ ...data, denumire: v })}
          />
          <FieldEdit
            label="Nr. Registrul Comerțului"
            value={data.nrRegCom ?? ""}
            onChange={(v) => onChange({ ...data, nrRegCom: v })}
          />
          <FieldEdit
            label="Adresă sediu social"
            value={data.adresa ?? ""}
            onChange={(v) => onChange({ ...data, adresa: v })}
          />
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          <Row icon={Building2} label="Denumire" value={data.denumire} />
          <Row icon={FileText} label="Nr. Reg. Com." value={data.nrRegCom} />
          <Row icon={MapPin} label="Sediu social" value={data.adresa} />
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-700/70 shrink-0" />
            <span className="text-muted-foreground">TVA:</span>
            <Badge
              variant="outline"
              className={cn(
                "border-2 font-semibold",
                data.scpTVA
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                  : "border-muted-foreground/30 bg-background text-muted-foreground"
              )}
            >
              {data.scpTVA ? "Plătitor TVA" : "Neplătitor TVA"}
            </Badge>
          </div>
        </dl>
      )}
    </div>
  );
};

const Row = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null;
}) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 mt-0.5 text-emerald-700/70 shrink-0" />
    <div className="min-w-0 flex-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground break-words">{value || "—"}</div>
    </div>
  </div>
);

const FieldEdit = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <Label className="text-xs font-semibold text-emerald-900">{label}</Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background"
    />
  </div>
);

export default CompanyAutofillCard;