import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, Clock, EyeOff, FileEdit, XCircle, AlertTriangle, Trash2 } from "lucide-react";

export type ListingStatus =
  | "active" | "pending" | "draft" | "hidden" | "rejected" | "unavailable" | "deletion_pending";

const styles: Record<ListingStatus, { cls: string; icon: any; ro: string; en: string }> = {
  active:      { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",   icon: CheckCircle2, ro: "Activ",         en: "Active" },
  pending:     { cls: "bg-amber-50 text-amber-800 ring-amber-200",         icon: Clock,        ro: "În verificare", en: "In review" },
  draft:       { cls: "bg-slate-100 text-slate-700 ring-slate-200",        icon: FileEdit,     ro: "Draft",         en: "Draft" },
  hidden:      { cls: "bg-zinc-100 text-zinc-700 ring-zinc-200",           icon: EyeOff,       ro: "Ascuns",        en: "Hidden" },
  rejected:    { cls: "bg-rose-50 text-rose-700 ring-rose-200",            icon: XCircle,      ro: "Respins",       en: "Rejected" },
  unavailable: { cls: "bg-orange-50 text-orange-700 ring-orange-200",      icon: AlertTriangle,ro: "Indisponibil",  en: "Unavailable" },
  deletion_pending: { cls: "bg-rose-50 text-rose-700 ring-rose-200",       icon: Trash2,       ro: "Ștergere în așteptare", en: "Deletion pending" },
};


const ListingStatusBadge = ({ status, size = "sm" }: { status: ListingStatus; size?: "sm" | "md" }) => {
  const { language } = useLanguage();
  const s = styles[status];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        s.cls,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {language === "ro" ? s.ro : s.en}
    </span>
  );
};

export default ListingStatusBadge;