import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface CuiLookupResult {
  found: boolean;
  cui: string;
  denumire: string | null;
  adresa: string | null;
  nrRegCom: string | null;
  scpTVA: boolean;
  statusInactivi: boolean;
  error?: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onResult: (res: CuiLookupResult | null) => void;
  autoFocus?: boolean;
}

type Status = "idle" | "loading" | "success" | "inactive" | "error";

const sanitize = (raw: string) =>
  raw.trim().toUpperCase().replace(/^RO/, "").replace(/\D/g, "").slice(0, 10);

export const CuiLookupField = ({ value, onChange, onResult, autoFocus }: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const lastQueried = useRef<string>("");

  useEffect(() => {
    const clean = sanitize(value);
    if (clean.length < 2) {
      setStatus("idle");
      setMessage(null);
      onResult(null);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (clean === lastQueried.current) return;
      lastQueried.current = clean;
      setStatus("loading");
      setMessage("Căutăm firma în ANAF…");
      try {
        const { data, error } = await supabase.functions.invoke("lookup-cui", {
          body: { cui: clean },
        });
        if (error) throw error;
        const res = data as CuiLookupResult;
        if (!res.found) {
          setStatus("error");
          setMessage("CUI invalid sau firmă inexistentă");
          onResult(null);
          return;
        }
        if (res.statusInactivi) {
          setStatus("inactive");
          setMessage("Firmă inactivă fiscal");
        } else {
          setStatus("success");
          setMessage("Firmă verificată în Registrul Comerțului");
        }
        onResult(res);
      } catch (err) {
        console.error("CUI lookup failed", err);
        setStatus("error");
        setMessage("Nu am putut verifica CUI. Încearcă din nou.");
        onResult(null);
      }
    }, 600);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const borderClass =
    status === "success"
      ? "border-emerald-500 focus-visible:ring-emerald-500/30"
      : status === "inactive"
      ? "border-amber-500 focus-visible:ring-amber-500/30"
      : status === "error"
      ? "border-destructive focus-visible:ring-destructive/30"
      : "";

  const icon =
    status === "loading" ? (
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    ) : status === "success" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : status === "inactive" ? (
      <AlertTriangle className="h-5 w-5 text-amber-600" />
    ) : status === "error" ? (
      <AlertCircle className="h-5 w-5 text-destructive" />
    ) : (
      <Search className="h-5 w-5 text-muted-foreground" />
    );

  const messageColor =
    status === "success"
      ? "text-emerald-700"
      : status === "inactive"
      ? "text-amber-700"
      : status === "error"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="space-y-2">
      <Label htmlFor="cui-input" className="text-sm font-semibold">
        CUI companie
      </Label>
      <div className="relative">
        <Input
          id="cui-input"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="ex: RO12345678"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-14 pl-4 pr-12 text-lg font-medium tracking-wide", borderClass)}
          maxLength={12}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</div>
      </div>
      {message && (
        <p className={cn("text-sm font-medium flex items-center gap-1.5", messageColor)}>
          {message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Cu sau fără prefixul „RO”. Datele firmei sunt completate automat.
      </p>
    </div>
  );
};

export default CuiLookupField;