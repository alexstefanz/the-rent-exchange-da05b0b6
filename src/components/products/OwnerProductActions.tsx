import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { deleteProduct } from "@/features/products/productsApi";

interface Props {
  productId: string;
  productTitle: string;
  variant: "card" | "bar";
  onDeleted?: () => void;
}

const OwnerProductActions = ({ productId, productTitle, variant, onDeleted }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const editUrl = `/owner/edit-product/${productId}`;

  const stop = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); };

  const confirmDelete = async () => {
    if (!user) return;
    setBusy(true); setError(null);
    try {
      await deleteProduct(productId, user.id);
      setDone(true);
      onDeleted?.();
    } catch (e: any) {
      if (String(e?.code || e?.message || "").includes("PRODUCT_HAS_ACTIVE_RENTALS")) {
        setError(t("Anunțul are închirieri în desfășurare și nu poate fi șters. Îl poți doar ascunde din „Anunțurile mele”.", "This listing has rentals in progress and can't be deleted. You can only hide it from “My listings”."));
      } else {
        setError(t("Nu am putut trimite cererea de ștergere. Încearcă din nou.", "Could not send the deletion request. Try again."));
      }
    } finally { setBusy(false); }
  };

  const dialog = (
    <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setError(null); if (done) navigate("/anunturi"); } }}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{done ? t("Cerere trimisă", "Request sent") : t("Ștergi anunțul?", "Delete listing?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {done
              ? t(`„${productTitle}” a fost ascuns și va fi șters după confirmarea unui administrator.`, `“${productTitle}” was hidden and will be deleted after an admin confirms.`)
              : t(`„${productTitle}” va fi ascuns imediat și șters după confirmarea unui administrator.`, `“${productTitle}” will be hidden now and deleted after an admin confirms.`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>{done ? t("Închide", "Close") : t("Renunță", "Cancel")}</AlertDialogCancel>
          {!done && (
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t("Șterge", "Delete")}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "bar") {
    return (
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("Acesta este anunțul tău", "This is your listing")}</p>
          <p className="text-xs text-muted-foreground">{t("Îl poți modifica sau șterge direct de aici.", "You can edit or delete it right here.")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm"><Link to={editUrl}><Edit className="h-4 w-4" /> {t("Editează", "Edit")}</Link></Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
            <Trash2 className="h-4 w-4" /> {t("Șterge", "Delete")}
          </Button>
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <>
      <span className="absolute left-2 bottom-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
        {t("Anunțul tău", "Your listing")}
      </span>
      <div className="absolute right-12 top-2" onClick={stop}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={stop}
              aria-label={t("Opțiuni proprietar", "Owner options")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm hover:bg-background"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => navigate(editUrl)}>
              <Edit className="mr-2 h-4 w-4" /> {t("Editează", "Edit")}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onSelect={() => setOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> {t("Șterge", "Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {dialog}
    </>
  );
};

export default OwnerProductActions;
