import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const DeactivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("Link invalid — token lipsă.");
      return;
    }

    const confirm = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-account-deactivation", {
          body: { token },
        });

        if (error || data?.error) {
          setStatus("error");
          setErrorMsg(data?.error || error?.message || "Eroare la dezactivarea contului.");
          return;
        }

        // Sign out the user
        await supabase.auth.signOut();
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMsg("Eroare neașteptată. Încearcă din nou.");
      }
    };

    confirm();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "loading" && "Se procesează..."}
            {status === "success" && "Cont dezactivat"}
            {status === "error" && "Eroare"}
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
                Contul tău a fost dezactivat cu succes. Ne pare rău că pleci!
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                Înapoi la pagina principală
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{errorMsg}</p>
              <Button onClick={() => navigate("/")} variant="outline">
                Înapoi la pagina principală
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeactivateAccount;
