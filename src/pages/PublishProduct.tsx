import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublishWizard from "@/components/publish/PublishWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useIsBanned } from "@/hooks/useIsBanned";
import { BannedBanner } from "@/components/common/BannedBanner";
import { Button } from "@/components/ui/button";
import { getProductById, type Product } from "@/features/products/productsApi";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  mode: "create" | "edit";
  productIdOverride?: string;
  onDone?: () => void;
}

const PublishProductPage = ({ mode, productIdOverride, onDone }: Props) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const id = productIdOverride ?? routeId;
  const { user, loading: authLoading } = useAuth();
  const { isBanned } = useIsBanned();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(mode === "edit");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (mode !== "edit" || !id || !user) return;
    (async () => {
      try {
        const p = await getProductById(id);
        if (!p) {
          toast({ title: t("Produs inexistent", "Product not found"), variant: "destructive" });
          navigate("/owner");
          return;
        }
        if (p.owner_id !== user.id) {
          toast({ title: t("Acces interzis", "Access denied"), variant: "destructive" });
          navigate("/owner");
          return;
        }
        // Sensitive fields (pickup_*, serial_number) are column-level restricted;
        // hydrate them via the secure owner/admin RPC.
        try {
          const { data: sensRows } = await (supabase.rpc as any)(
            "get_product_sensitive_fields",
            { _id: id },
          );
          const s = Array.isArray(sensRows) ? sensRows[0] : sensRows;
          (p as any).pickup_address = s?.pickup_address ?? null;
          (p as any).pickup_lat = s?.pickup_lat ?? null;
          (p as any).pickup_lng = s?.pickup_lng ?? null;
          (p as any).serial_number = s?.serial_number ?? null;
        } catch {
          (p as any).serial_number = null;
        }
        setProduct(p);
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [mode, id, user, navigate, toast]);

  if (authLoading || loadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isBanned) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
        <BannedBanner
          context={
            mode === "create"
              ? t(
                  "Nu poți publica anunțuri noi cât timp contul este suspendat.",
                  "You can't publish new listings while your account is suspended.",
                )
              : t(
                  "Nu poți edita anunțuri cât timp contul este suspendat.",
                  "You can't edit listings while your account is suspended.",
                )
          }
        />
        <Button variant="outline" onClick={() => navigate("/")}>
          {t("Înapoi la pagina principală", "Back to home")}
        </Button>
      </div>
    );
  }

  return <PublishWizard key={id ?? "new"} mode={mode} productId={id} initialProduct={product} onDone={onDone} />;
};

export default PublishProductPage;