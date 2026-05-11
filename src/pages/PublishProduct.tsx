import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublishWizard from "@/components/publish/PublishWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useKycGate } from "@/hooks/queries/useKycGate";
import KycGateBanner from "@/components/kyc/KycGateBanner";
import { getProductById, type Product } from "@/features/products/productsApi";
import { useToast } from "@/hooks/use-toast";

interface Props {
  mode: "create" | "edit";
}

const PublishProductPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const kyc = useKycGate();
  const { toast } = useToast();
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
          toast({ title: "Produs inexistent", variant: "destructive" });
          navigate("/owner");
          return;
        }
        if (p.owner_id !== user.id) {
          toast({ title: "Acces interzis", variant: "destructive" });
          navigate("/owner");
          return;
        }
        setProduct(p);
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [mode, id, user, navigate, toast]);

  if (authLoading || kyc.loading || loadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && mode === "create" && !kyc.isVerified) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <KycGateBanner reason="publish" />
      </div>
    );
  }

  return <PublishWizard mode={mode} productId={id} initialProduct={product} />;
};

export default PublishProductPage;