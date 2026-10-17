import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/categories";
import type { PublishFormData } from "@/lib/publishTypes";

type Update = <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("ai-product-assistant", { body });
  if (error) {
    let msg = "Serviciul AI nu este disponibil momentan.";
    try { const j = await (error as any).context?.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

export const AiAutofillButton = ({ data, update }: { data: PublishFormData; update: Update }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const disabled = data.images.length === 0 || loading;

  const run = async () => {
    setLoading(true); setMsg(null);
    try {
      const r = await invoke({
        action: "autofill",
        images: data.images.slice(0, 3),
        categories: categories.map((c) => ({ name: c.name, subcategories: c.subcategories.map((s) => s.name) })),
      });
      if (r.title) update("title", r.title);
      if (r.description) update("description", r.description);
      if (r.condition) update("condition", r.condition);
      if (r.category) { update("category", r.category); update("subcategory", r.subcategory || ""); }
      setMsg({ ok: true, text: "Gata! Verifică și ajustează câmpurile dacă e nevoie." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          {data.images.length === 0
            ? "Adaugă cel puțin o poză ca AI-ul să completeze anunțul."
            : "Lasă AI-ul să completeze titlul, categoria, descrierea și starea din poze."}
        </p>
        <Button type="button" onClick={run} disabled={disabled} className="shrink-0">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analizăm produsul…</> : <>Completează cu AI ✨</>}
        </Button>
      </div>
      {msg && <p className={msg.ok ? "mt-2 text-xs text-primary" : "mt-2 text-xs text-destructive"}>{msg.text}</p>}
    </div>
  );
};

interface Estimate { value_min: number; value_max: number; daily_suggested: number; daily_min: number; daily_max: number; note: string }

export const AiPriceEstimateCard = ({ data, update, auto = false }: { data: PublishFormData; update: Update; auto?: boolean }) => {
  const [loading, setLoading] = useState(false);
  const [est, setEst] = useState<Estimate | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const lastKey = useRef<string>("");

  const run = async () => {
    setLoading(true); setErr(null);
    try {
      setEst(await invoke({
        action: "estimate", title: data.title, category: data.category, subcategory: data.subcategory,
        condition: data.condition, description: data.description,
      }));
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  };

  // Auto mode: estimate once title is meaningful; re-run only when the key inputs change (debounced).
  const key = `${data.title.trim()}|${data.category}|${data.subcategory}|${data.condition}`;
  useEffect(() => {
    if (!auto || data.title.trim().length < 5 || key === lastKey.current) return;
    const id = setTimeout(() => { lastKey.current = key; run(); }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, key]);

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Estimare AI de preț</p>
      </div>
      {loading ? (
        <p className="mt-3 flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analizăm produsul…</p>
      ) : est ? (
        <div className="mt-3 space-y-1.5 text-sm">
          <p>Valoare estimată: <b>{est.value_min} RON–{est.value_max} RON</b></p>
          <p>Recomandat pe zi: <b className="text-primary">{est.daily_suggested} RON/zi</b> ({est.daily_min}–{est.daily_max} RON)</p>
          {est.note && <p className="text-xs text-muted-foreground">{est.note}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" size="sm" onClick={() => update("daily_price_owner", est.daily_suggested)}>
              Folosește {est.daily_suggested} RON/zi
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={run}>Recalculează</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{auto ? "Estimarea valorii și a prețului pe zi apare automat după ce completezi titlul." : null}</p>
          <p className={auto ? "hidden" : "text-xs text-muted-foreground"}>Primește o estimare a valorii și un preț pe zi recomandat pentru piața din România, pe baza titlului, stării și descrierii.</p>
          {!auto && <Button type="button" size="sm" className="mt-3" onClick={run} disabled={!data.title}>Estimează prețul</Button>}
        </div>
      )}
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
};
