import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ExtensionSignDialog from "./ExtensionSignDialog";
import { format } from "date-fns";
import { Printer, FileText, FileSignature, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useContractAcceptance } from "./useContractAcceptance";
import ContractSignDialog from "./ContractSignDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";
import { getPvFileSignedUrl } from "@/features/rentals/rentalDetailPageApi";
import { useRentalExtensions, lateInfo } from "@/components/rentals/RentalExtensionCard";

type Tab = "contract" | "anexa1" | "anexa2" | "anexa3";
type Pv = { phase: string; owner_signature_data: string | null; renter_signature_data: string | null; owner_signed_at: string | null; renter_signed_at: string | null; photo_urls?: string[] };

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
  const [extSignId, setExtSignId] = useState<string | null>(null);
  const qc = useQueryClient();
  useEffect(() => { if (open) { setTab(initialTab); setBlank(initialBlank); } }, [open, initialTab, initialBlank]);
  const docRef = useRef<HTMLDivElement>(null);

  const { data: pvs } = useQuery({
    queryKey: ["rental-docs-pv", rental.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_pv_documents")
        .select("phase, owner_signature_data, renter_signature_data, owner_signed_at, renter_signed_at, photos_meta")
        .eq("rental_id", rental.id);
      return Promise.all(((data || []) as any[]).map(async (row) => {
        const paths: string[] = (row.photos_meta || []).map((m: any) => m?.path).filter(Boolean);
        const photo_urls = (await Promise.all(paths.map((pp) => getPvFileSignedUrl(pp).catch(() => null)))).filter(Boolean) as string[];
        return { ...row, photo_urls } as Pv;
      }));
    },
  });

  const b = blank;
  const v = (val: string | null | undefined) => (b || !val ? "______________________" : val);
  const handover = pvs?.find((p) => p.phase === "handover");
  const ret = pvs?.find((p) => p.phase === "return");
  const { user } = useAuth();
  const acc = useContractAcceptance(rental.id);
  const [signOpen, setSignOpen] = useState(false);
  const [readToEnd, setReadToEnd] = useState(false);
  const [readAnnex3, setReadAnnex3] = useState(false);
  useEffect(() => { if (!open) setReadAnnex3(false); }, [open]);
  useEffect(() => { if (open) setReadToEnd(false); }, [open]);
  const justSignedRef = useRef(false);
  const wasBothRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (acc.loading) return;
    if (!open) { wasBothRef.current = null; return; }
    if (wasBothRef.current === null) { wasBothRef.current = acc.bothAccepted; return; }
    if (!wasBothRef.current && acc.bothAccepted) {
      wasBothRef.current = true;
      if (justSignedRef.current) { justSignedRef.current = false; return; }
      window.dispatchEvent(new CustomEvent("rentli:contract-signed"));
      onOpenChange(false);
    }
  }, [open, acc.loading, acc.bothAccepted, onOpenChange]);
  const isPaid = ["authorized", "paid", "captured"].includes(rental.payment_status as string);
  const myRole = user?.id === rental.owner_id ? "owner" : user?.id === rental.renter_id ? "renter" : null;
  const canSignContract = isPaid && !!myRole && !(myRole === "owner" ? acc.owner : acc.renter);
  const contractPv: Pv = { phase: "contract", owner_signature_data: acc.ownerSig, renter_signature_data: acc.renterSig, owner_signed_at: acc.owner, renter_signed_at: acc.renter };
  const items = rental.product_included_items || [];
  const daily = Number(rental.daily_price || 0);
  const { data: exts = [] } = useRentalExtensions(rental.id);
  const paidExts = exts.filter((e) => e.status === "approved" && e.payment_status === "paid").reverse();
  const late = lateInfo(rental.end_date, daily, rental.return_confirmed_at ? new Date(rental.return_confirmed_at) : new Date());

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
.sig img{max-height:60px} .photos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0} .photos figure{margin:0;page-break-inside:avoid} .photos img{width:100%;height:60mm;object-fit:contain;border:1px solid #ccc} .photos figcaption{font-size:10px;color:#555} .noprint{display:none}
</style></head><body>${html}</body></html>`);
      w.document.close();
      w.focus();
      const imgs = Array.from(w.document.images);
      Promise.all(imgs.map((im) => im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 8000); })))
        .then(() => setTimeout(() => { w.print(); setBlank(false); }, 200));
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
      <H2>Art. 5. Valoarea bunului</H2>
      <p>Valoarea declarată a bunului: {b ? "______" : ron(rental.product_deposit_value)}. Eventualele daune constatate la returnare se soluționează prin procedura de dispută Rentli.</p>
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
      <H2>Art. 11. Jurnal de validare a semnării</H2>
      <p className="text-xs">Înainte de semnare, fiecare parte și-a confirmat identitatea printr-un cod unic trimis prin SMS pe telefonul asociat contului Rentli.</p>
      <table className="w-full border-collapse text-[11px] my-2">
        <thead>
          <tr>{["Parte", "Nume", "Canal", "Destinație", "Data și ora", "Referință"].map((h) => (
            <th key={h} className="border border-border p-1 text-left">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {([["Locator", rental.owner_name, acc.ownerRow], ["Locatar", rental.renter_name, acc.renterRow]] as const).map(([p, n, row]) => (
            <tr key={p}>
              <td className="border border-border p-1">{p}</td>
              <td className="border border-border p-1">{v(n)}</td>
              <td className="border border-border p-1">{!b && row?.validation_channel ? "Cod SMS" : "______"}</td>
              <td className="border border-border p-1">{!b && row?.validation_destination ? row.validation_destination : "______"}</td>
              <td className="border border-border p-1">{!b && row?.validated_at ? fmtDT(row.validated_at) : "______"}</td>
              <td className="border border-border p-1">{!b && row?.validation_ref ? row.validation_ref : "______"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Sig pv={contractPv} />
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
              ["Data", b ? "____________" : (() => {
                const signed = [pv?.owner_signed_at, pv?.renter_signed_at].filter(Boolean) as string[];
                const confirmed = isRet ? rental.return_confirmed_at : rental.handover_confirmed_at;
                const eff = signed.length ? signed.sort().at(-1)! : confirmed;
                return eff ? `${fmtDT(eff)} (data semnării)` : `${fmtD(isRet ? rental.end_date : rental.start_date)} (programată — se confirmă la semnare)`;
              })()],
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
        {!b && !!pv?.photo_urls?.length && (
          <>
            <H2>Fotografii la {isRet ? "returnare" : "predare"}</H2>
            <div className="photos grid grid-cols-2 gap-3 my-2">
              {pv.photo_urls.map((u, i) => (
                <figure key={u} className="m-0">
                  <img src={u} alt={`Poza ${i + 1}`} className="w-full h-48 object-contain border border-border rounded bg-muted" />
                  <figcaption className="text-[10px] text-muted-foreground">Poza {i + 1}</figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
        {isRet && (
          <>
            <H2>Întârziere și penalități (art. 8)</H2>
            {b ? (
              <p>Zile de întârziere: ______ × ______ = ______ RON</p>
            ) : (
              <p>Zile de întârziere: <b>{late.days}</b> × {ron(late.perDay)} = <b>{ron(late.total)}</b>{late.days === 0 ? " (restituire la termen)" : ""}</p>
            )}
          </>
        )}
        <Sig pv={pv} />
      </div>
    );
  };

  const anexa3 = (
    <div className="page">
      <Head title="ANEXA 3 — ACT ADIȚIONAL DE PRELUNGIRE" sub={`la Contractul de locațiune nr. ${rental.public_id}`} />
      {b || !paidExts.length ? (
        <>
          <H2>Art. 1. Prelungirea duratei</H2>
          <p>Părțile convin prelungirea locațiunii cu ______ zile, de la ____________ până la ____________.</p>
          <H2>Art. 2. Chiria suplimentară</H2>
          <p>Chiria suplimentară: ______ zile × ______ RON = ______ RON, plus comisionul platformei, achitată prin Rentli.ro.</p>
          {!b && <p className="text-xs text-muted-foreground">Nu există încă o prelungire aprobată și plătită.</p>}
        </>
      ) : (
        paidExts.map((e, i) => (
          <div key={e.id}>
            <H2>Act adițional nr. {i + 1} — din {fmtD(e.paid_at)}</H2>
            <p><b>Art. 1.</b> Părțile, {rental.owner_name} (Locator) și {rental.renter_name} (Locatar), convin prelungirea locațiunii bunului {rental.product_title} cu <b>{e.approved_days} zile</b>, de la {fmtD(e.original_end_date)} până la <b>{fmtD(e.approved_end_date)}</b>.</p>
            <p><b>Art. 2.</b> Chiria suplimentară este {e.approved_days} × {ron(e.daily_price)} = {ron(e.subtotal_amount)}, plus comisionul platformei de {ron(e.platform_fee)}, total {ron(e.total_amount)}, achitată prin Rentli.ro.</p>
            <p><b>Art. 3.</b> Restituirea se face la noua dată, în aceleași condiții. Toate celelalte clauze ale contractului rămân neschimbate.</p>
            <p><b>Art. 4.</b> Protecția bunului se prelungește de drept până la noua dată de restituire.</p>
            <Sig pv={{ phase: "extension", owner_signature_data: e.owner_signature_data, renter_signature_data: e.renter_signature_data, owner_signed_at: e.owner_signed_at, renter_signed_at: e.renter_signed_at }} />
          </div>
        ))
      )}
      {(b || !paidExts.length) && <Sig />}
    </div>
  );
  const extToSign = myRole ? paidExts.find((e) => !(myRole === "owner" ? e.owner_signed_at : e.renter_signed_at)) : undefined;

  const handoverDone = !!(rental.handover_pv_owner_signed_at && rental.handover_pv_renter_signed_at);
  const unlocked: Record<Tab, boolean> = {
    contract: true,
    anexa1: b || acc.bothAccepted,
    anexa2: b || handoverDone,
    anexa3: b || paidExts.length > 0,
  };
  const lockMsg: Record<Tab, string> = {
    contract: "",
    anexa1: "Anexa 1 se deblochează după semnarea contractului de către ambele părți.",
    anexa2: "Anexa 2 se deblochează după finalizarea predării (Anexa 1 semnată de ambele părți).",
    anexa3: "Anexa 3 este disponibilă doar după o prelungire aprobată și achitată.",
  };
  const tabs: { k: Tab; l: string }[] = [
    { k: "contract", l: "Contract" },
    { k: "anexa1", l: "Anexa 1 · Predare" },
    { k: "anexa2", l: "Anexa 2 · Returnare" },
    { k: "anexa3", l: "Anexa 3 · Act adițional" },
  ];
  const isLocked = !unlocked[tab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Documentele rezervării {rental.public_id}</DialogTitle>
          <DialogDescription>Contract de locațiune bun mobil și anexele aferente.</DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {tabs.map((x) => (
              <Button key={x.k} size="sm" variant={tab === x.k ? "default" : "outline"} className={!unlocked[x.k] ? "opacity-60" : ""} onClick={() => setTab(x.k)}>
                {!unlocked[x.k] && <Lock className="h-3.5 w-3.5 mr-1" />}{x.l}
              </Button>
            ))}
            <div className="ml-auto flex gap-2 flex-wrap">
              <Button size="sm" disabled={isLocked} variant={(tab === "contract" && canSignContract) || (tab === "anexa3" && extToSign) ? "outline" : "default"} onClick={() => print(false)}><Printer className="h-4 w-4 mr-1" />Salvează PDF / Tipărește</Button>
            </div>
          </div>
          {tab === "contract" && canSignContract && (
            <p className="text-xs text-muted-foreground pt-1">Citește contractul până la final — butonul de semnare se activează în partea de jos.</p>
          )}
          {tab === "anexa3" && extToSign && (
            <p className="text-xs text-muted-foreground pt-1">Citește Anexa 3 — butonul de semnare este în partea de jos.</p>
          )}
        </DialogHeader>
        <div
          className="flex-1 overflow-y-auto bg-muted/40 p-4"
          ref={(el) => {
            if (!el) return;
            requestAnimationFrame(() => {
              if (el.scrollHeight <= el.clientHeight + 40 && tab === "contract" && !readToEnd) setReadToEnd(true);
            });
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
            if (tab === "contract" && atEnd) setReadToEnd(true);
          }}
        >
          {isLocked ? (
            <div className="mx-auto max-w-md mt-10 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="font-semibold mt-3">Document blocat</p>
              <p className="text-sm text-muted-foreground mt-1">{lockMsg[tab]}</p>
            </div>
          ) : (
          <div className="mx-auto max-w-[210mm] bg-card text-card-foreground shadow-md rounded-sm p-8 font-serif text-[13px] leading-relaxed">
            {tab === "contract" ? contract : tab === "anexa1" ? anexa("handover") : tab === "anexa2" ? anexa("return") : anexa3}
          </div>
          )}
          {tab === "contract" && canSignContract && (
            <div className="mx-auto max-w-[210mm] mt-4 rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <p className="text-sm text-muted-foreground">
                {readToEnd ? "Ai parcurs contractul. Poți trece la semnare." : "Derulează până la finalul contractului pentru a putea semna."}
              </p>
              <Button disabled={!readToEnd} onClick={() => setSignOpen(true)}>
                <FileSignature className="h-4 w-4 mr-1" />Am citit — semnează contractul
              </Button>
            </div>
          )}
          {tab === "anexa3" && extToSign && !isLocked && (
            <div className="mx-auto max-w-[210mm] mt-4 rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <p className="text-sm text-muted-foreground">
                Verifică Anexa 3 de mai sus, apoi semnează.
              </p>
              <Button onClick={() => setExtSignId(extToSign.id)}>
                <FileSignature className="h-4 w-4 mr-1" />Am citit — semnează Anexa 3
              </Button>
            </div>
          )}
        </div>
        {/* full set for printing — only unlocked documents */}
        <div ref={docRef} className="hidden">
          {contract}
          {unlocked.anexa1 && anexa("handover")}
          {unlocked.anexa2 && anexa("return")}
          {unlocked.anexa3 && anexa3}
        </div>
      </DialogContent>
      <ContractSignDialog open={signOpen} onOpenChange={setSignOpen} rentalId={rental.id} publicId={rental.public_id} onSign={acc.sign} onBothSigned={() => { justSignedRef.current = true; onOpenChange(false); }} />
      {extSignId && (
        <ExtensionSignDialog open={!!extSignId} onOpenChange={(o) => { if (!o) setExtSignId(null); }} extensionId={extSignId} publicId={rental.public_id}
          onSigned={() => qc.invalidateQueries({ queryKey: ["rental-extensions", rental.id] })} />
      )}
    </Dialog>
  );
}
