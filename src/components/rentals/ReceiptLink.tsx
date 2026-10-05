import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function ReceiptLink({ rentalId, t }: { rentalId: string; t: (ro: string, en: string) => string }) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["rental-receipt", rentalId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-rental-payment-status", { body: { rental_id: rentalId } });
      if (error) return null;
      return (data?.receipt_url as string | null) ?? null;
    },
    staleTime: 5 * 60_000,
  });
  if (isLoading) return null;
  if (!url) {
    return (
      <p className="mt-3 text-[11px] text-muted-foreground">
        {t("Chitanța de plată apare aici după încasarea plății (o primești și pe email).", "The payment receipt appears here once payment is captured (also sent by email).")}
      </p>
    );
  }
  return (
    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
      <a href={url} target="_blank" rel="noreferrer">
        <ExternalLink className="h-4 w-4 mr-2" />
        {t("Descarcă chitanța de plată", "Download payment receipt")}
      </a>
    </Button>
  );
}
