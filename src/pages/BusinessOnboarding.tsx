import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CuiLookupField, { CuiLookupResult } from "@/components/onboarding/CuiLookupField";
import CompanyAutofillCard, { CompanyData } from "@/components/onboarding/CompanyAutofillCard";
import TrustStrip from "@/components/onboarding/TrustStrip";
import logoImage from "@/assets/rentli_logo.webp";
import { isValidRomanianIban } from "@/lib/ibanValidation";

const BusinessOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [cui, setCui] = useState("");
  const [company, setCompany] = useState<CompanyData>({
    denumire: null,
    adresa: null,
    nrRegCom: null,
    scpTVA: false,
  });
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [iban, setIban] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Pre-fill contact name & billing email from auth metadata
  useEffect(() => {
    if (user) {
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      if (meta.full_name) setContactName(meta.full_name);
      if (user.email) setBillingEmail(user.email);
    }
  }, [user]);

  const handleResult = (res: CuiLookupResult | null) => {
    if (res?.found) {
      setCompany({
        denumire: res.denumire,
        adresa: res.adresa,
        nrRegCom: res.nrRegCom,
        scpTVA: res.scpTVA,
      });
    }
  };

  const ibanValid = !iban || isValidRomanianIban(iban);
  const phoneValid = /^\+40\d{9}$/.test(phone.replace(/\s/g, ""));
  const canSubmit =
    !!company.denumire &&
    !!contactName.trim() &&
    phoneValid &&
    ibanValid &&
    !submitting;

  const progress = (() => {
    let n = 0;
    if (company.denumire) n++;
    if (contactName.trim()) n++;
    if (phoneValid) n++;
    if (iban && ibanValid) n++;
    return Math.round((n / 4) * 100);
  })();

  const handleSubmit = async (skip = false) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        account_type: "business",
      };
      if (!skip) {
        payload.company_name = company.denumire;
        payload.cui = cui.replace(/^RO/i, "").trim();
        payload.reg_com = company.nrRegCom;
        payload.company_address = company.adresa;
        payload.full_name = contactName.trim();
        payload.phone = phone.replace(/\s/g, "");
      }
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);
      if (error) throw error;

      toast({
        title: skip ? "Setup amânat" : "Setup finalizat",
        description: skip
          ? "Poți completa datele companiei oricând din profil."
          : "Bine ai venit pe Rentli Business!",
      });
      navigate(skip ? "/" : "/business", { replace: true });
    } catch (e: any) {
      toast({
        title: "Eroare",
        description: e?.message ?? "Nu am putut salva datele.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-12 pb-32 md:pb-12">
        <Link to="/" className="mb-6 inline-block">
          <img src={logoImage} alt="Rentli" className="h-10 w-auto" />
        </Link>

        <div className="mb-6 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Completează datele companiei
          </h1>
          <p className="text-muted-foreground">
            Aceste informații sunt necesare pentru publicarea anunțurilor și
            procesarea plăților.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{progress}% complet</span>
            <span>{progress < 100 ? "Aproape gata" : "Toate datele sunt completate"}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5 md:p-7 space-y-6">
            {/* CUI lookup */}
            <CuiLookupField
              value={cui}
              onChange={setCui}
              onResult={handleResult}
              autoFocus
            />

            {company.denumire && (
              <CompanyAutofillCard data={company} onChange={setCompany} />
            )}

            {/* Contact details */}
            <div className="space-y-4 pt-2">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Date de contact
              </h2>

              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-sm font-semibold">
                  Persoană de contact
                </Label>
                <Input
                  id="contact-name"
                  className="h-12"
                  placeholder="ex: Ion Popescu"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  className="h-12"
                  placeholder="+40 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phone.length > 3 && !phoneValid && (
                  <p className="text-xs text-destructive">
                    Format: +40 urmat de 9 cifre
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban" className="text-sm font-semibold">
                  IBAN <span className="text-muted-foreground font-normal">(pentru retrageri)</span>
                </Label>
                <Input
                  id="iban"
                  className="h-12 font-mono uppercase tracking-wide"
                  placeholder="RO49 AAAA 1B31 0075 9384 0000"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                />
                {!ibanValid && (
                  <p className="text-xs text-destructive">IBAN invalid</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-email" className="text-sm font-semibold">
                  Email facturare{" "}
                  <span className="text-muted-foreground font-normal">(opțional)</span>
                </Label>
                <Input
                  id="billing-email"
                  type="email"
                  className="h-12"
                  placeholder="facturi@companie.ro"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/15 p-3.5">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80">
                Datele companiei sunt validate automat prin ANAF, iar plățile
                sunt procesate securizat prin Rentli.
              </p>
            </div>

            <TrustStrip />
          </CardContent>
        </Card>

        {/* Desktop CTA */}
        <div className="hidden md:flex flex-col gap-2 mt-6">
          <Button
            type="button"
            size="lg"
            disabled={!canSubmit}
            onClick={() => handleSubmit(false)}
            className="h-12 text-base"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Finalizează setup <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="text-muted-foreground"
          >
            Completez mai târziu
          </Button>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t p-4 space-y-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <Button
          type="button"
          size="lg"
          disabled={!canSubmit}
          onClick={() => handleSubmit(false)}
          className="w-full h-12 text-base"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Finalizează setup <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="w-full text-sm text-muted-foreground py-1"
        >
          Completez mai târziu
        </button>
      </div>
    </div>
  );
};

export default BusinessOnboarding;