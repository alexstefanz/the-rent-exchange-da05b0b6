import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { notify } from "@/lib/notify";

const CheckoutSuccess = () => {
  usePageSeo({ title: "Plată reușită — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { language } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentalData, setRentalData] = useState<{
    id: string;
    product_title: string;
    product_images: string[];
    start_date: string;
    end_date: string;
    rental_days: number;
    subtotal: number;
    owner_id: string;
    product_id: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Lipsește ID-ul sesiunii de plată.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "verify-stripe-payment",
          { body: { session_id: sessionId } },
        );

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        setRentalData(data.rental);
        // Stripe redirect kills the realtime INSERT for the renter, so fire
        // a confirmation toast here once per rental id.
        try {
          const rid = data?.rental?.id;
          if (rid) {
            const key = `checkout-toast-${rid}`;
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, "1");
              notify.payment({
                title: language === "en" ? "Payment successful" : "Plată reușită",
                message:
                  language === "en"
                    ? "Your rental request was sent to the owner."
                    : "Cererea ta a fost trimisă proprietarului.",
              });
            }
          }
        } catch {
          /* noop */
        }
      } catch (e: any) {
        console.error("Verification error:", e);
        setError(e?.message || "Eroare la verificarea plății.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Se verifică plata...</p>
      </div>
    );
  }

  if (error || !rentalData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive font-medium">{error || "Eroare necunoscută"}</p>
        <Button asChild variant="outline">
          <Link to="/">Înapoi acasă</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-heading text-xl md:text-2xl font-semibold">
            {language === "ro" ? "Rezervare confirmată" : "Reservation confirmed"}
          </h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <BookingConfirmation
          productTitle={rentalData.product_title}
          ownerName="proprietar"
          startDate={format(new Date(rentalData.start_date), "d MMM", { locale: dateLocale })}
          endDate={format(new Date(rentalData.end_date), "d MMM yyyy", { locale: dateLocale })}
          totalPrice={rentalData.subtotal}
          rentalDays={rentalData.rental_days}
          productId={rentalData.product_id}
          ownerId={rentalData.owner_id}
          rentalId={rentalData.id}
        />
      </main>
    </div>
  );
};

export default CheckoutSuccess;
