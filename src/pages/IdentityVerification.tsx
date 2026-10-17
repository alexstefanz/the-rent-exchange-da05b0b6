import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Loader2, AlertTriangle, IdCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Status = "unverified" | "pending" | "processing" | "verified" | "requires_input" | "canceled";

export default function IdentityVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returning = params.get("done") === "1";
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const goBack = () => {
    const target = sessionStorage.getItem("identity_return_to") || "/contul-meu";
    sessionStorage.removeItem("identity_return_to");
    navigate(target, { replace: true });
  };

  useEffect(() => {
    if (!returning || status !== "verified") return;
    if (countdown <= 0) { goBack(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returning, status, countdown]);


  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("identity_status").eq("id", user.id).single();
    setStatus(((data as any)?.identity_status ?? "unverified") as Status);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const start = async () => {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.functions.invoke("create-identity-session", {
      body: { return_origin: window.location.origin },
    });
    if (error || !data?.url) {
      if (data?.already_verified) { setStatus("verified"); setBusy(false); return; }
      setErr("Nu am putut porni verificarea. Încearcă din nou.");
      setBusy(false); return;
    }
    window.location.href = data.url;
  };

  if (!user) {
    return (
      <main className="container max-w-xl py-16 text-center">
        <p className="mb-4">Autentifică-te pentru a-ți verifica identitatea.</p>
        <Button asChild><Link to="/auth">Autentificare</Link></Button>
      </main>
    );
  }

  return (
    <main className="container max-w-xl py-12">
      <Card className="p-8 text-center space-y-5">
        {status === "verified" ? (
          <>
            <ShieldCheck className="mx-auto h-14 w-14 text-primary" />
            <h1 className="text-2xl font-bold">Identitate verificată</h1>
            <p className="text-muted-foreground">Profilul tău afișează acum insigna de identitate verificată.</p>
            {returning && <p className="text-sm text-muted-foreground">Te întoarcem automat în {countdown} secunde…</p>}
            <Button size="lg" className="w-full" onClick={goBack}>Înapoi la Rentli</Button>
          </>
        ) : status === "pending" || status === "processing" ? (
          <>
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Verificare în curs</h1>
            <p className="text-muted-foreground">Durează de obicei câteva minute. Pagina se actualizează automat.</p>
            {status === "pending" && <Button variant="outline" onClick={start} disabled={busy}>Reia verificarea</Button>}
            <Button variant="ghost" className="w-full" onClick={goBack}>Înapoi la Rentli</Button>
          </>
        ) : (
          <>
            {status === "requires_input" ? <AlertTriangle className="mx-auto h-14 w-14 text-destructive" /> : <IdCard className="mx-auto h-14 w-14 text-primary" />}
            <h1 className="text-2xl font-bold">{status === "requires_input" ? "Verificarea necesită atenție" : "Verifică-ți identitatea"}</h1>
            <p className="text-muted-foreground">
              {status === "requires_input"
                ? "Documentul sau selfie-ul nu a putut fi validat. Încearcă din nou, cu lumină bună și documentul complet în cadru."
                : "Ai nevoie de buletin, pașaport sau permis și de camera telefonului. Verificarea e procesată securizat de Stripe; Rentli nu stochează imaginile actelor."}
            </p>
            <Button size="lg" onClick={start} disabled={busy || status === null}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Începe verificarea
            </Button>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button variant="ghost" className="w-full" onClick={goBack}>Înapoi la Rentli</Button>
          </>
        )}
      </Card>
    </main>
  );
}
