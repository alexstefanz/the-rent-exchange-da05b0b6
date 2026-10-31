import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const DeactivateAccount = () => {
  usePageSeo({ title: "Ștergere cont — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg(t("Link invalid — token lipsă.", "Invalid link — token missing."));
      return;
    }

    const confirm = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-account-deactivation", {
          body: { token },
        });

        if (error || data?.error) {
          setStatus("error");
          setErrorMsg(data?.error || error?.message || t("Eroare la ștergerea contului.", "Error deleting the account."));
          return;
        }

        // Sign out the user
        await supabase.auth.signOut();
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMsg(t("Eroare neașteptată. Încearcă din nou.", "Unexpected error. Please try again."));
      }
    };

    confirm();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "loading" && t("Se procesează...", "Processing...")}
            {status === "success" && t("Cont șters", "Account deleted")}
            {status === "error" && t("Eroare", "Error")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-muted-foreground">
                {t("Contul tău a fost șters definitiv. Ne pare rău că pleci!", "Your account has been permanently deleted. We are sorry to see you go!")}
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                {t("Înapoi la pagina principală", "Back to homepage")}
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{errorMsg}</p>
              <Button onClick={() => navigate("/")} variant="outline">
                {t("Înapoi la pagina principală", "Back to homepage")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeactivateAccount;
