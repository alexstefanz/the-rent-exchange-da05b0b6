import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type UnsubState = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<UnsubState>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (res.ok && data.valid === true) {
          setState("valid");
        } else if (data.reason === "already_unsubscribed") {
          setState("already_unsubscribed");
        } else {
          setState("invalid");
        }
      } catch {
        setState("invalid");
      }
    };

    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      const result = typeof data === "string" ? JSON.parse(data) : data;
      if (result.success) {
        setState("success");
      } else if (result.reason === "already_unsubscribed") {
        setState("already_unsubscribed");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-foreground">
            {t("Dezabonare notificări email", "Unsubscribe from email notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">{t("Se verifică...", "Verifying...")}</p>
            </>
          )}

          {state === "valid" && (
            <>
              <MailX className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {t("Ești sigur că vrei să te dezabonezi de la notificările prin email de la Rentli?", "Are you sure you want to unsubscribe from Rentli email notifications?")}
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("Confirmă dezabonarea", "Confirm unsubscribe")}
              </Button>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-center text-muted-foreground">
                {t("Te-ai dezabonat cu succes. Nu vei mai primi notificări prin email.", "You have been unsubscribed. You will no longer receive email notifications.")}
              </p>
            </>
          )}

          {state === "already_unsubscribed" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {t("Ești deja dezabonat de la notificările prin email.", "You are already unsubscribed from email notifications.")}
              </p>
            </>
          )}

          {state === "invalid" && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-center text-muted-foreground">
                {t("Link-ul de dezabonare este invalid sau a expirat.", "The unsubscribe link is invalid or has expired.")}
              </p>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-center text-muted-foreground">
                {t("A apărut o eroare. Te rugăm să încerci din nou.", "An error occurred. Please try again.")}
              </p>
              <Button variant="outline" onClick={handleUnsubscribe}>
                {t("Încearcă din nou", "Try again")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
