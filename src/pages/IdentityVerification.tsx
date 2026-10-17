import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Loader2, AlertTriangle, IdCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Status = "unverified" | "pending" | "processing" | "verified" | "requires_input" | "canceled";

// Stripe Identity last_error codes → Romanian explanations
const ERROR_RO: Record<string, string> = {
  consent_declined: "Nu ai acceptat termenii de verificare. Reia procesul și confirmă acordul pentru a continua.",
  under_supported_age: "Verificarea nu poate fi finalizată: trebuie să ai vârsta minimă acceptată.",
  country_not_supported: "Țara care a emis documentul nu este acceptată. Folosește un alt act de identitate.",
  device_not_supported: "Dispozitivul nu are o cameră compatibilă. Încearcă de pe telefon.",
  abandoned: "Verificarea a fost întreruptă înainte de final. Te rugăm să o reiei.",
  document_expired: "Documentul a expirat. Folosește un act de identitate valabil.",
  document_type_not_supported: "Tipul de document nu este acceptat. Folosește buletinul, pașaportul sau permisul de conducere.",
  document_unverified_other: "Documentul nu a putut fi validat. Fotografiază-l complet, clar și fără reflexii.",
  selfie_document_missing_photo: "Documentul nu conține o fotografie a feței. Folosește un act cu poză.",
  selfie_face_mismatch: "Selfie-ul nu corespunde cu fotografia din document. Reia verificarea, cu fața bine luminată.",
  selfie_manipulated: "Selfie-ul nu a putut fi validat. Fă o fotografie nouă, în timp real, fără filtre.",
  selfie_unverified_other: "Selfie-ul nu a putut fi validat. Încearcă din nou, într-un loc bine luminat.",
};

export default function IdentityVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returning = params.get("done") === "1";
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [lastError, setLastError] = useState<string | null>(null);

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
    const { data } = await supabase.from("profiles").select("identity_status, identity_last_error").eq("id", user.id).single();
    setStatus(((data as any)?.identity_status ?? "unverified") as Status);
    setLastError((data as any)?.identity_last_error ?? null);
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
            <h1 className="text-2xl font-bold">{status === "requires_input" ? "Verificarea necesită atenție" : status === "canceled" ? "Verificare anulată" : "Verifică-ți identitatea"}</h1>
            <p className="text-muted-foreground">
              {status === "requires_input"
                ? (ERROR_RO[lastError ?? ""] ?? "Documentul sau selfie-ul nu a putut fi validat. Încearcă din nou, cu lumină bună și documentul complet în cadru.")
                : status === "canceled"
                ? "Verificarea a fost întreruptă. O poți relua oricând."
                : "Verificarea e procesată securizat de Stripe; Rentli nu stochează imaginile actelor."}
            </p>
            <ol className="space-y-2 rounded-xl bg-muted/50 p-4 text-left text-sm">
              <li><strong>1.</strong> Pregătește buletinul, pașaportul sau permisul de conducere (valabil, nu copie).</li>
              <li><strong>2.</strong> Stai într-un loc bine luminat; documentul trebuie să fie complet în cadru, fără reflexii.</li>
              <li><strong>3.</strong> Fă un selfie cu fața descoperită (fără ochelari de soare sau șapcă).</li>
              <li><strong>4.</strong> Dacă pagina Stripe apare în engleză, alege „Română” din selectorul de limbă din partea de jos a ecranului.</li>
            </ol>
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
