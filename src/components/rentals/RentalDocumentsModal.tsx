import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Printer, FileDown, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";

type Tab = "contract" | "anexa1" | "anexa2";
type Pv = { phase: string; owner_signature_data: string | null; renter_signature_data: string | null; owner_signed_at: string | null; renter_signed_at: string | null };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rental: RentalFullDetail;
  initialTab?: Tab;
  initialBlank?: boolean;
}

const fmtD = (d?: string | null) => (d ? format(new Date(d), "dd.MM.yyyy") : "____________");
const fmtDT = (d?: string | null) => (d ? format(new Date(d), "dd.MM.yyyy HH:mm") : "");
const slot = (t?: string | null) => {
  if (!t) return "____:____";
  const h = parseInt(t.slice(0, 2), 10);
  return isNaN(h) ? t : `${t.slice(0, 5)}–${String(h + 2).padStart(2, "0")}:00`;
};
const ron = (n?: number | null) => (n == null ? "______" : `${Number(n).toFixed(2)} RON`);

export default function RentalDocumentsModal({ open, onOpenChange, rental, initialTab = "contract", initialBlank = false }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [blank, setBlank] = useState(initialBlank);
  useEffect(() => { if (open) { setTab(initialTab); setBlank(initialBlank); } }, [open, initialTab, initialBlank]);
  const docRef = useRef<HTMLDivElement>(null);

  const { data: pvs } = useQuery({
    queryKey: ["rental-docs-pv", rental.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_pv_documents")
        .select("phase, owner_signature_data, renter_signature_data, owner_signed_at, renter_signed_at")
        .eq("rental_id", rental.id);
      return (data || []) as Pv[];
    },
  });

  const b = blank;
  const v = (val: string | null | undefined) => (b || !val ? "______________________" : val);
  const handover = pvs?.find((p) => p.phase === "handover");
  const ret = pvs?.find((p) => p.phase === "return");
  const items = rental.product_included_items || [];
  const daily = Number(rental.daily_price || 0);

  const print = (allBlank: boolean) => {
    setBlank(allBlank);
    setTimeout(() => {
      const html = docRef.current?.innerHTML || "";
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${rental.public_id} — Documente</title>
<style>
body{font-family:'Times New Roman',serif;color:#111;margin:0}
.page{width:190mm;margin:0 auto;padding:12mm 0;page-break-after:always;font-size:12px;line-height:1.55}
.page:last-child{page-break-after:auto}
h1{font-size:16px;text-align:center;margin:0 0 4px} h2{font-size:13px;margin:14px 0 4px}
.c{text-align:center} .muted{color:#555;font-size:11px}
table{width:100%;border-collapse:collapse;margin:6px 0} td,th{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top}
.sig{display:flex;gap:24px;margin-top:24px} .sig>div{flex:1;border-top:1px solid #333;padding-top:4px;min-height:70px}
.sig img{max-height:60px} .noprint{display:none}
</style></head><body>${html}</body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); setBlank(false); }, 300);
    }, 50);
  };

  const Sig = ({ pv }: { pv?: Pv }) => (
    <div className="sig flex gap-6 mt-6">
      <div className="flex-1 border-t border-foreground/60 pt-1 min-h-[70px]">
        <div className="text-xs font-semibold">Locator (Proprietar)</div>
        <div className="text-xs">{v(rental.owner_name)}</div>
        {!b && pv?.owner_signature_data && <img src={pv.owner_signature_data} alt="" className="max-h-[60px]" />}
        {!b && pv?.owner_signed_at && <div className="muted text-[10px] text-muted-foreground">Semnat {fmtDT(pv.owner_signed_at)}</div>}
      </div>
      <div className="flex-1 border-t border-foreground/60 pt-1 min-h-[70px]">
        <div className="text-xs font-semibold">Locatar (Chiriaș)</div>
        <div className="text-xs">{v(rental.renter_name)}</div>
        {!b && pv?.renter_signature_data && <img src={pv.renter_signature_data} alt="" className="max-h-[60px]" />}
        {!b && pv?.renter_signed_at && <div className="muted text-[10px] text-muted-foreground">Semnat {fmtDT(pv.renter_signed_at)}</div>}
      </div>
    </div>
  );

  const Head = ({ title, sub }: { title: string; sub: string }) => (
    <>
      <div className="flex justify-between text-[11px] text-muted-foreground muted"><span>Rentli.ro</span><span>Nr. {rental.public_id}</span></div>
      <h1 className="text-base font-bold text-center mt-2">{title}</h1>
      <p className="c text-center text-xs text-muted-foreground mb-3">{sub}</p>
    </>
  );

  const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="font-bold text-[13px] mt-4 mb-1">{children}</h2>;

  const contract = (
    <div className="page">
      <Head title="CONTRACT DE LOCAȚIUNE A UNUI BUN MOBIL" sub={`încheiat prin platforma Rentli.ro la data de ${b ? "____________" : fmtD(rental.created_at)}`} />
      <H2>Art. 1. Părțile contractante</H2>
      <p><b>Locator (Proprietar):</b> {v(rental.owner_name)}, telefon {v(rental.owner_phone)}, e-mail {v(rental.owner_email)};</p>
      <p><b>Locatar (Chiriaș):</b> {v(rental.renter_name)}, telefon {v(rental.renter_phone)}, e-mail {v(rental.renter_email)}.</p>
      <p>Părțile au convenit încheierea prezentului contract în temeiul art. 1777–1823 din Codul Civil.</p>
      <H2>Art. 2. Obiectul contractului</H2>
      <p>Locatorul transmite Locatarului folosința temporară a bunului mobil: <b>{v(rental.product_title)}</b>{rental.product_category && !b ? ` (categoria ${rental.product_category})` : ""}, împreună cu accesoriile: {b || !items.length ? "______________________" : items.join(", ")}. Starea bunului la predare se consemnează în Anexa 1.</p>
      <H2>Art. 3. Durata locațiunii</H2>
      <p>Perioada: de la <b>{b ? "____________" : fmtD(rental.start_date)}</b> până la <b>{b ? "____________" : fmtD(rental.end_date)}</b> ({b ? "___" : rental.rental_days} zile). Predarea are loc în intervalul orar <b>{b ? "____:____" : slot(rental.pickup_time)}</b>, la locația: {v(rental.pickup_location || rental.product_location_city)}. Returnarea se face la aceeași locație, în același interval orar, la data de final.</p>
      <H2>Art. 4. Chiria și modalitatea de plată</H2>
      <p>Chiria este de {b ? "______" : ron(daily)}/zi, total {b ? "______" : ron(rental.subtotal)}. Plata se efectuează exclusiv prin platforma Rentli.ro; suma este rezervată (blocată) pe cardul Locatarului și eliberată către Locator după finalizarea închirierii, minus comisionul platformei.</p>
      <H2>Art. 5. Garanția</H2>
      <p>Valoarea declarată a bunului / garanție: {b ? "______" : ron(rental.product_deposit_value)}. Eventualele daune constatate la returnare se soluționează prin procedura de dispută Rentli.</p>
      <H2>Art. 6. Obligațiile Locatorului</H2>
      <p>Să predea bunul în stare corespunzătoare de folosință, curat și complet, cu toate accesoriile; să garanteze Locatarul contra viciilor ascunse și a tulburărilor de drept; să informeze despre modul corect de utilizare.</p>
      <H2>Art. 7. Obligațiile Locatarului</H2>
      <p>Să folosească bunul cu prudență și diligență, conform destinației; să nu-l subînchirieze sau cedeze terților; să suporte cheltuielile curente de folosință; să restituie bunul la termen, în starea în care l-a primit, exceptând uzura normală.</p>
      <H2>Art. 8. Întârzierea la restituire</H2>
      <p>Pentru fiecare zi de întârziere neaprobată, Locatarul datorează o penalitate egală cu dublul chiriei zilnice, respectiv {b ? "______" : ron(daily * 2)}/zi, consemnată în Anexa 2. Prelungirea se poate face doar cu acordul Locatorului, prin act adițional.</p>
      <H2>Art. 9. Incidente, daune și forța majoră</H2>
      <p>Orice defecțiune, pierdere sau furt se comunică imediat celeilalte părți și Rentli, prin chatul intern sau tichet de suport. Locatarul răspunde pentru deteriorările produse din culpa sa. Niciuna dintre părți nu răspunde pentru neexecutarea cauzată de forță majoră.</p>
      <H2>Art. 10. Dispoziții finale</H2>
      <p>Contractul se completează cu Anexa 1 (PV de predare), Anexa 2 (PV de returnare) și eventualele acte adiționale. Litigiile se soluționează amiabil, prin medierea Rentli, iar în caz contrar de instanțele competente din România. Acceptarea electronică și semnăturile digitale din platformă au valoarea semnăturii olografe.</p>
      <Sig pv={handover} />
    </div>
  );

  const anexa = (phase: "handover" | "return") => {
    const pv = phase === "handover" ? handover : ret;
    const isRet = phase === "return";
    return (
      <div className="page">
        <Head
          title={isRet ? "ANEXA 2 — PROCES-VERBAL DE RESTITUIRE" : "ANEXA 1 — PROCES-VERBAL DE PREDARE-PRIMIRE"}
          sub={`la Contractul de locațiune nr. ${rental.public_id}`}
        />
        <table className="w-full border-collapse text-xs my-2">
          <tbody>
            {[
              ["Bun", v(rental.product_title)],
              ["Data", b ? "____________" : fmtD(isRet ? rental.end_date : rental.start_date)],
              ["Interval orar", b ? "____:____" : slot(rental.pickup_time)],
              ["Locație", v(rental.pickup_location || rental.product_location_city)],
              [isRet ? "Predă (Locatar)" : "Predă (Locator)", v(isRet ? rental.renter_name : rental.owner_name)],
              [isRet ? "Primește (Locator)" : "Primește (Locatar)", v(isRet ? rental.owner_name : rental.renter_name)],
            ].map(([k, val]) => (
              <tr key={k}><td className="border border-border p-1.5 font-semibold w-1/3">{k}</td><td className="border border-border p-1.5">{val}</td></tr>
            ))}
          </tbody>
        </table>
        <H2>Accesorii {isRet ? "restituite" : "predate"}</H2>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {(b || !items.length ? ["", "", ""] : items).map((it, i) => (
              <tr key={i}><td className="border border-border p-1.5">{it || "\u00a0"}</td><td className="border border-border p-1.5 w-24">☐ Da ☐ Nu</td></tr>
            ))}
          </tbody>
        </table>
        <H2>Starea bunului</H2>
        <p>☐ Funcțional, fără defecte &nbsp; ☐ Uzură normală &nbsp; ☐ Defecte constatate (descriere):</p>
        <p>_____________________________________________________________________________</p>
        <p className="text-xs text-muted-foreground">Fotografiile încărcate în platformă fac parte integrantă din prezentul proces-verbal.</p>
        {isRet && (
          <>
            <H2>Întârziere și penalități (art. 8)</H2>
            <p>Zile de întârziere: ______ × {b ? "______" : ron(daily * 2)} = ______ RON</p>
          </>
        )}
        <Sig pv={pv} />
      </div>
    );
  };

  const tabs: { k: Tab; l: string }[] = [
    { k: "contract", l: "Contract" },
    { k: "anexa1", l: "Anexa 1 · Predare" },
    { k: "anexa2", l: "Anexa 2 · Returnare" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Documentele rezervării {rental.public_id}</DialogTitle>
          <DialogDescription>Contract de locațiune bun mobil și anexele aferente.</DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {tabs.map((x) => (
              <Button key={x.k} size="sm" variant={tab === x.k ? "default" : "outline"} onClick={() => setTab(x.k)}>{x.l}</Button>
            ))}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => print(true)}><FileDown className="h-4 w-4 mr-1" />Set nesemnat</Button>
              <Button size="sm" onClick={() => print(false)}><Printer className="h-4 w-4 mr-1" />Salvează PDF / Tipărește</Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4">
          <div className="mx-auto max-w-[210mm] bg-card text-card-foreground shadow-md rounded-sm p-8 font-serif text-[13px] leading-relaxed">
            {tab === "contract" ? contract : tab === "anexa1" ? anexa("handover") : anexa("return")}
          </div>
        </div>
        {/* full set for printing */}
        <div ref={docRef} className="hidden">
          {contract}
          {anexa("handover")}
          {anexa("return")}
        </div>
      </DialogContent>
    </Dialog>
  );
}
