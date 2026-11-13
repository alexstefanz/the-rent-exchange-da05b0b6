import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ExtensionSignDialog from "./ExtensionSignDialog";
import { format } from "date-fns";
import { Printer, FileText, FileSignature, Lock, Download, Loader2 } from "lucide-react";
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
import { getPvFinancials } from "@/lib/pvContent";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t: T } = useLanguage();
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

  const sb = blank; // blank set: only signatures & on-site fields stay empty
  const b = false; // known data is always prefilled
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
  const { data: biz = [] } = useQuery({
    queryKey: ["rental-parties-business", rental.id],
    enabled: open && !!rental.id,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_rental_parties_business", { _rental_id: rental.id });
      if (error) return [];
      return (data || []) as Array<{ party: string; account_type: string; company_name: string | null; cui: string | null; reg_com: string | null; company_address: string | null }>;
    },
  });
  const bizOf = (party: "owner" | "renter") => {
    const r = biz.find((x) => x.party === party);
    return r && r.account_type === "business" && r.company_name ? r : null;
  };
  const partyLine = (party: "owner" | "renter") => {
    const name = party === "owner" ? rental.owner_name : rental.renter_name;
    const phone = party === "owner" ? rental.owner_phone : rental.renter_phone;
    const email = party === "owner" ? rental.owner_email : rental.renter_email;
    const c = bizOf(party);
    const contact = `${T("telefon", "phone")} ${v(phone)}, e-mail ${v(email)}`;
    if (!c) return `${v(name)}, ${T("identitate verificată prin Stripe Identity", "identity verified via Stripe Identity")}, ${contact}`;
    return `${c.company_name}, ${T("CUI", "VAT ID")} ${v(c.cui)}, ${T("Nr. Reg. Com.", "Trade Reg. No.")} ${v(c.reg_com)}, ${T("cu sediul în", "registered at")} ${v(c.company_address)}, ${T("reprezentată prin", "represented by")} ${v(name)} (${T("Administrator", "Administrator")}), ${contact}`;
  };
  const sigName = (party: "owner" | "renter") => {
    const name = party === "owner" ? rental.owner_name : rental.renter_name;
    const c = bizOf(party);
    return c ? `${c.company_name} — ${T("prin", "by")} ${v(name)}` : v(name);
  };
  const daily = Number(rental.daily_price || 0);
  const { data: exts = [] } = useRentalExtensions(rental.id);
  const paidExts = exts.filter((e) => e.status === "approved" && e.payment_status === "paid").reverse();
  const late = lateInfo(rental.end_date, daily, rental.return_confirmed_at ? new Date(rental.return_confirmed_at) : new Date());

  const DOC_CSS = `body{font-family:'Times New Roman',serif;color:#111;margin:0;background:#fff}
.page{width:190mm;margin:0 auto;padding:12mm 0;page-break-after:always;font-size:12px;line-height:1.55}
.page:last-child{page-break-after:auto}
h1{font-size:16px;text-align:center;margin:0 0 4px} h2{font-size:13px;margin:14px 0 4px}
.c{text-align:center} .muted{color:#555;font-size:11px}
table{width:100%;border-collapse:collapse;margin:6px 0} td,th{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top}
.sig{display:flex;gap:24px;margin-top:24px} .sig>div{flex:1;border-top:1px solid #333;padding-top:4px;min-height:70px}
.sig img{max-height:60px} .photos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0} .photos figure{margin:0;page-break-inside:avoid} .photos img{width:100%;height:60mm;object-fit:contain;border:1px solid #ccc} .photos figcaption{font-size:10px;color:#555} .noprint{display:none}`;

  const waitImgs = (doc: Document) => Promise.all(Array.from(doc.images).map((im) => im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 8000); })));

  const print = (allBlank: boolean) => {
    setBlank(allBlank);
    setTimeout(() => {
      const html = docRef.current?.innerHTML || "";
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${rental.public_id} — ${T("Documente", "Documents")}</title><style>${DOC_CSS}</style></head><body>${html}</body></html>`);
      w.document.close();
      w.focus();
      waitImgs(w.document).then(() => setTimeout(() => { w.print(); setBlank(false); }, 200));
    }, 50);
  };

  const [saving, setSaving] = useState(false);
  const savePdf = async () => {
    setSaving(true);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0";
    document.body.appendChild(iframe);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const d = iframe.contentDocument!;
      d.open();
      d.write(`<!doctype html><html><head><meta charset="utf-8"><style>${DOC_CSS}</style></head><body>${docRef.current?.innerHTML || ""}</body></html>`);
      d.close();
      await waitImgs(d);
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pages = Array.from(d.querySelectorAll<HTMLElement>(".page"));
      const targets = pages.length ? pages : [d.body];
      for (let i = 0; i < targets.length; i++) {
        const canvas = await html2canvas(targets[i], { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const pw = 210, ph = 297, margin = 10;
        const iw = pw - margin * 2;
        const ih = (canvas.height * iw) / canvas.width;
        const sliceH = ph - margin * 2;
        let offset = 0;
        let first = true;
        while (offset < ih) {
          if (i > 0 || !first) pdf.addPage();
          pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin - offset, iw, ih);
          offset += sliceH;
          first = false;
        }
      }
      pdf.save(`${T("Documente", "Documents")}-${rental.public_id}.pdf`);
    } catch (e) {
      toast.error(T("PDF-ul nu a putut fi generat. Folosește butonul Tipărește → Salvează ca PDF.", "The PDF could not be generated. Use Print → Save as PDF."));
    } finally {
      iframe.remove();
      setSaving(false);
    }
  };

  const Sig = ({ pv }: { pv?: Pv }) => (
    <div className="sig flex gap-6 mt-6">
      <div className="flex-1 border-t border-foreground/60 pt-1 min-h-[70px]">
        <div className="text-xs font-semibold">{T("Locator (Proprietar)", "Lessor (Owner)")}</div>
        <div className="text-xs">{sigName("owner")}</div>
        {!sb && pv?.owner_signature_data && <img src={pv.owner_signature_data} alt="" className="max-h-[60px]" />}
        {!sb && pv?.owner_signed_at && <div className="muted text-[10px] text-muted-foreground">{T("Semnat", "Signed")} {fmtDT(pv.owner_signed_at)}</div>}
      </div>
      <div className="flex-1 border-t border-foreground/60 pt-1 min-h-[70px]">
        <div className="text-xs font-semibold">{T("Locatar (Chiriaș)", "Lessee (Renter)")}</div>
        <div className="text-xs">{sigName("renter")}</div>
        {!sb && pv?.renter_signature_data && <img src={pv.renter_signature_data} alt="" className="max-h-[60px]" />}
        {!sb && pv?.renter_signed_at && <div className="muted text-[10px] text-muted-foreground">{T("Semnat", "Signed")} {fmtDT(pv.renter_signed_at)}</div>}
      </div>
    </div>
  );

  const Head = ({ title, sub }: { title: string; sub: string }) => (
    <>
      <div className="flex justify-between text-[11px] text-muted-foreground muted"><span>Rentli.ro</span><span>{T("Nr.", "No.")} {rental.public_id}</span></div>
      <h1 className="text-base font-bold text-center mt-2">{title}</h1>
      <p className="c text-center text-xs text-muted-foreground mb-3">{sub}</p>
    </>
  );

  const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="font-bold text-[13px] mt-4 mb-1">{children}</h2>;

  const contract = (
    <div className="page">
      <Head title={T("CONTRACT DE LOCAȚIUNE A UNUI BUN MOBIL", "LEASE AGREEMENT FOR A MOVABLE ITEM")} sub={T(`încheiat prin platforma Rentli.ro la data de ${fmtD(rental.created_at)}`, `concluded via the Rentli.ro platform on ${fmtD(rental.created_at)}`)} />
      <H2>{T("Art. 1. Părțile contractante", "Art. 1. Contracting parties")}</H2>
      <p><b>{T("Locator (Proprietar):", "Lessor (Owner):")}</b> {partyLine("owner")};</p>
      <p><b>{T("Locatar (Chiriaș):", "Lessee (Renter):")}</b> {partyLine("renter")}.</p>
      <p>{T("Părțile au convenit încheierea prezentului contract în temeiul art. 1777–1823 din Codul Civil.", "The parties have agreed to conclude this agreement under art. 1777–1823 of the Romanian Civil Code.")}</p>
      <H2>{T("Art. 2. Obiectul contractului", "Art. 2. Subject of the agreement")}</H2>
      <p>{T("Locatorul transmite Locatarului folosința temporară a bunului mobil:", "The Lessor grants the Lessee temporary use of the movable item:")} <b>{v(rental.product_title)}</b>{rental.product_category ? T(` (categoria ${rental.product_category})`, ` (category ${rental.product_category})`) : ""}, {T("împreună cu accesoriile:", "together with the accessories:")} {!items.length ? "______________________" : items.join(", ")}. {T("Starea bunului la predare se consemnează în Anexa 1.", "The condition of the item at handover is recorded in Annex 1.")}</p>
      <H2>{T("Art. 3. Durata locațiunii", "Art. 3. Lease term")}</H2>
      <p>{T("Perioada: de la", "Period: from")} <b>{fmtD(rental.start_date)}</b> {T("până la", "until")} <b>{fmtD(rental.end_date)}</b> ({rental.rental_days} {T("zile", "days")}). {T("Predarea are loc în intervalul orar", "Handover takes place within the time slot")} <b>{slot(rental.pickup_time)}</b>, {T("la locația:", "at the location:")} {v(rental.pickup_location || rental.product_location_city)}. {T("Returnarea se face la aceeași locație, în același interval orar, la data de final.", "The item is returned at the same location, within the same time slot, on the end date.")}</p>
      <H2>{T("Art. 4. Chiria și modalitatea de plată", "Art. 4. Rent and payment terms")}</H2>
      <p>{T(`Chiria este de ${ron(daily)}/zi, total ${ron(rental.subtotal)}. Plata se efectuează exclusiv prin platforma Rentli.ro; suma este rezervată (blocată) pe cardul Locatarului și eliberată către Locator după finalizarea închirierii, minus comisionul platformei.`, `The rent is ${ron(daily)}/day, total ${ron(rental.subtotal)}. Payment is made exclusively through the Rentli.ro platform; the amount is reserved (held) on the Lessee's card and released to the Lessor after the rental is completed, minus the platform fee.`)}</p>
      <H2>{T("Art. 5. Valoarea bunului", "Art. 5. Value of the item")}</H2>
      <p>{T(`Valoarea declarată a bunului: ${ron(rental.product_deposit_value)}. Eventualele daune constatate la returnare se soluționează prin procedura de dispută Rentli.`, `Declared value of the item: ${ron(rental.product_deposit_value)}. Any damage found at return is settled through the Rentli dispute procedure.`)}</p>
      <H2>{T("Art. 6. Obligațiile Locatorului", "Art. 6. Lessor's obligations")}</H2>
      <p>{T("Să predea bunul în stare corespunzătoare de folosință, curat și complet, cu toate accesoriile; să garanteze Locatarul contra viciilor ascunse și a tulburărilor de drept; să informeze despre modul corect de utilizare.", "To hand over the item in proper working condition, clean and complete, with all accessories; to guarantee the Lessee against hidden defects and legal disturbances; to explain the correct way of use.")}</p>
      <H2>{T("Art. 7. Obligațiile Locatarului", "Art. 7. Lessee's obligations")}</H2>
      <p>{T("Să folosească bunul cu prudență și diligență, conform destinației; să nu-l subînchirieze sau cedeze terților; să suporte cheltuielile curente de folosință; să restituie bunul la termen, în starea în care l-a primit, exceptând uzura normală.", "To use the item prudently and diligently, according to its purpose; not to sublet or assign it to third parties; to bear the current costs of use; to return the item on time, in the condition received, except for normal wear.")}</p>
      <H2>{T("Art. 8. Întârzierea la restituire", "Art. 8. Late return")}</H2>
      <p>{T(`Pentru fiecare zi de întârziere neaprobată, Locatarul datorează o penalitate egală cu dublul chiriei zilnice, respectiv ${ron(daily * 2)}/zi, consemnată în Anexa 2. Prelungirea se poate face doar cu acordul Locatorului, prin act adițional.`, `For each unapproved day of delay, the Lessee owes a penalty equal to twice the daily rent, i.e. ${ron(daily * 2)}/day, recorded in Annex 2. An extension is possible only with the Lessor's consent, by addendum.`)}</p>
      <H2>{T("Art. 9. Incidente, daune și forța majoră", "Art. 9. Incidents, damage and force majeure")}</H2>
      <p>{T("Orice defecțiune, pierdere sau furt se comunică imediat celeilalte părți și Rentli, prin chatul intern sau tichet de suport. Locatarul răspunde pentru deteriorările produse din culpa sa. Niciuna dintre părți nu răspunde pentru neexecutarea cauzată de forță majoră.", "Any malfunction, loss or theft must be reported immediately to the other party and to Rentli, via the internal chat or a support ticket. The Lessee is liable for damage caused by their fault. Neither party is liable for non-performance caused by force majeure.")}</p>
      <H2>{T("Art. 10. Dispoziții finale", "Art. 10. Final provisions")}</H2>
      <p>{T("Contractul se completează cu Anexa 1 (PV de predare), Anexa 2 (PV de returnare) și eventualele acte adiționale. Litigiile se soluționează amiabil, prin medierea Rentli, iar în caz contrar de instanțele competente din România. Acceptarea electronică și semnăturile digitale din platformă au valoarea semnăturii olografe.", "This agreement is supplemented by Annex 1 (handover report), Annex 2 (return report) and any addenda. Disputes are settled amicably through Rentli mediation, otherwise by the competent courts of Romania. Electronic acceptance and digital signatures in the platform have the value of a handwritten signature.")}</p>
      <H2>{T("Art. 11. Jurnal de validare a semnării", "Art. 11. Signature validation log")}</H2>
      <p className="text-xs">{T("Înainte de semnare, fiecare parte și-a confirmat identitatea printr-un cod unic trimis prin SMS pe telefonul asociat contului Rentli.", "Before signing, each party confirmed their identity with a unique code sent by SMS to the phone linked to their Rentli account.")}</p>
      <table className="w-full border-collapse text-[11px] my-2">
        <thead>
          <tr>{[T("Parte", "Party"), T("Nume", "Name"), T("Canal", "Channel"), T("Destinație", "Destination"), T("Data și ora", "Date & time"), T("Referință", "Reference")].map((h) => (
            <th key={h} className="border border-border p-1 text-left">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {([[T("Locator", "Lessor"), rental.owner_name, acc.ownerRow], [T("Locatar", "Lessee"), rental.renter_name, acc.renterRow]] as const).map(([p, n, row]) => (
            <tr key={p}>
              <td className="border border-border p-1">{p}</td>
              <td className="border border-border p-1">{v(n)}</td>
              <td className="border border-border p-1">{!sb && row?.validation_channel ? T("Cod SMS", "SMS code") : "______"}</td>
              <td className="border border-border p-1">{!sb && row?.validation_destination ? row.validation_destination : "______"}</td>
              <td className="border border-border p-1">{!sb && row?.validated_at ? fmtDT(row.validated_at) : "______"}</td>
              <td className="border border-border p-1">{!sb && row?.validation_ref ? row.validation_ref : "______"}</td>
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
    const financials = getPvFinancials(rental);
    return (
      <div className="page">
        <Head
          title={isRet ? T("ANEXA 2 — PROCES-VERBAL DE RESTITUIRE", "ANNEX 2 — RETURN REPORT") : T("ANEXA 1 — PROCES-VERBAL DE PREDARE-PRIMIRE", "ANNEX 1 — HANDOVER REPORT")}
          sub={T(`la Contractul de locațiune nr. ${rental.public_id}`, `to Lease Agreement no. ${rental.public_id}`)}
        />
        <table className="w-full border-collapse text-xs my-2">
          <tbody>
            {[
              [T("Bun", "Item"), v(rental.product_title)],
              [T("Data", "Date"), b ? "____________" : (() => {
                const signed = [pv?.owner_signed_at, pv?.renter_signed_at].filter(Boolean) as string[];
                const confirmed = isRet ? rental.return_confirmed_at : rental.handover_confirmed_at;
                const eff = signed.length ? signed.sort().at(-1)! : confirmed;
                return eff ? `${fmtDT(eff)} ${T("(data semnării)", "(signing date)")}` : `${fmtD(isRet ? rental.end_date : rental.start_date)} ${T("(programată — se confirmă la semnare)", "(scheduled — confirmed at signing)")}`;
              })()],
              [T("Interval orar", "Time slot"), b ? "____:____" : slot(rental.pickup_time)],
              [T("Locație", "Location"), v(rental.pickup_location || rental.product_location_city)],
              [isRet ? T("Predă (Locatar)", "Hands over (Lessee)") : T("Predă (Locator)", "Hands over (Lessor)"), (isRet ? sigName("renter") : sigName("owner"))],
              [isRet ? T("Primește (Locator)", "Receives (Lessor)") : T("Primește (Locatar)", "Receives (Lessee)"), (isRet ? sigName("owner") : sigName("renter"))],
            ].map(([k, val]) => (
              <tr key={k}><td className="border border-border p-1.5 font-semibold w-1/3">{k}</td><td className="border border-border p-1.5">{val}</td></tr>
            ))}
          </tbody>
        </table>
        <H2>{T("Datele închirierii — sumar financiar", "Rental details — financial summary")}</H2>
        <table className="w-full border-collapse text-xs my-2">
          <tbody>
            {[
              [T("Preț închiriere/zi", "Rental price/day"), ron(rental.daily_price)],
              [T("Subtotal închiriere", "Rental subtotal"), ron(financials.subtotal)],
              [T("Comision platformă (plătit de chiriaș)", "Platform fee (paid by renter)"), ron(financials.platformFee)],
              [T("Taxa Stripe (plătită de chiriaș)", "Stripe fee (paid by renter)"), ron(financials.stripeFee)],
              ...(financials.insuranceFee > 0 ? [[T("Taxa asigurare (plătită de chiriaș)", "Insurance fee (paid by renter)"), ron(financials.insuranceFee)]] : []),
              [T("Total pentru chiriaș (taxe incluse)", "Total for renter (fees included)"), ron(financials.total)],
            ].map(([label, value]) => (
              <tr key={label}><td className="border border-border p-1.5 font-semibold">{label}</td><td className="border border-border p-1.5 whitespace-nowrap">{value}</td></tr>
            ))}
          </tbody>
        </table>
        <H2>{isRet ? T("Accesorii restituite", "Returned accessories") : T("Accesorii predate", "Handed-over accessories")}</H2>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {(b || !items.length ? ["", "", ""] : items).map((it, i) => (
              <tr key={i}><td className="border border-border p-1.5">{it || "\u00a0"}</td><td className="border border-border p-1.5 w-24">{T("☐ Da ☐ Nu", "☐ Yes ☐ No")}</td></tr>
            ))}
          </tbody>
        </table>
        <H2>{T("Starea bunului", "Condition of the item")}</H2>
        <p>{T("☐ Funcțional, fără defecte \u00a0 ☐ Uzură normală \u00a0 ☐ Defecte constatate (descriere):", "☐ Working, no defects \u00a0 ☐ Normal wear \u00a0 ☐ Defects found (description):")}</p>
        <p>_____________________________________________________________________________</p>
        <p className="text-xs text-muted-foreground">{T("Fotografiile încărcate în platformă fac parte integrantă din prezentul proces-verbal.", "Photos uploaded to the platform are an integral part of this report.")}</p>
        {!sb && !!pv?.photo_urls?.length && (
          <>
            <H2>{isRet ? T("Fotografii la returnare", "Return photos") : T("Fotografii la predare", "Handover photos")}</H2>
            <div className="photos grid grid-cols-2 gap-3 my-2">
              {pv.photo_urls.map((u, i) => (
                <figure key={u} className="m-0">
                  <img src={u} alt={`${T("Poza", "Photo")} ${i + 1}`} className="w-full h-48 object-contain border border-border rounded bg-muted" />
                  <figcaption className="text-[10px] text-muted-foreground">{T("Poza", "Photo")} {i + 1}</figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
        {isRet && (
          <>
            <H2>{T("Întârziere și penalități (art. 8)", "Delay and penalties (art. 8)")}</H2>
            {sb ? (
              <p>{T("Zile de întârziere", "Days of delay")}: ______ × ______ = ______ RON</p>
            ) : (
              <p>{T("Zile de întârziere", "Days of delay")}: <b>{late.days}</b> × {ron(late.perDay)} = <b>{ron(late.total)}</b>{late.days === 0 ? T(" (restituire la termen)", " (returned on time)") : ""}</p>
            )}
          </>
        )}
        <Sig pv={pv} />
      </div>
    );
  };

  const anexa3 = (
    <div className="page">
      <Head title={T("ANEXA 3 — ACT ADIȚIONAL DE PRELUNGIRE", "ANNEX 3 — EXTENSION ADDENDUM")} sub={T(`la Contractul de locațiune nr. ${rental.public_id}`, `to Lease Agreement no. ${rental.public_id}`)} />
      {sb || !paidExts.length ? (
        <>
          <H2>{T("Art. 1. Prelungirea duratei", "Art. 1. Extension of the term")}</H2>
          <p>{T("Părțile convin prelungirea locațiunii cu ______ zile, de la ____________ până la ____________.", "The parties agree to extend the lease by ______ days, from ____________ to ____________.")}</p>
          <H2>{T("Art. 2. Chiria suplimentară", "Art. 2. Additional rent")}</H2>
          <p>{T("Chiria suplimentară: ______ zile × ______ RON = ______ RON, plus comisionul platformei, achitată prin Rentli.ro.", "Additional rent: ______ days × ______ RON = ______ RON, plus the platform fee, paid via Rentli.ro.")}</p>
          {!sb && <p className="text-xs text-muted-foreground">{T("Nu există încă o prelungire aprobată și plătită.", "There is no approved and paid extension yet.")}</p>}
        </>
      ) : (
        paidExts.map((e, i) => (
          <div key={e.id}>
            <H2>{T(`Act adițional nr. ${i + 1} — din ${fmtD(e.paid_at)}`, `Addendum no. ${i + 1} — dated ${fmtD(e.paid_at)}`)}</H2>
            <p><b>Art. 1.</b> {T(`Părțile, ${rental.owner_name} (Locator) și ${rental.renter_name} (Locatar), convin prelungirea locațiunii bunului ${rental.product_title} cu ${e.approved_days} zile, de la ${fmtD(e.original_end_date)} până la ${fmtD(e.approved_end_date)}.`, `The parties, ${rental.owner_name} (Lessor) and ${rental.renter_name} (Lessee), agree to extend the lease of ${rental.product_title} by ${e.approved_days} days, from ${fmtD(e.original_end_date)} to ${fmtD(e.approved_end_date)}.`)}</p>
            <p><b>Art. 2.</b> {T(`Chiria suplimentară este ${e.approved_days} × ${ron(e.daily_price)} = ${ron(e.subtotal_amount)}, plus comisionul platformei de ${ron(e.platform_fee)}, total ${ron(e.total_amount)}, achitată prin Rentli.ro.`, `The additional rent is ${e.approved_days} × ${ron(e.daily_price)} = ${ron(e.subtotal_amount)}, plus a platform fee of ${ron(e.platform_fee)}, total ${ron(e.total_amount)}, paid via Rentli.ro.`)}</p>
            <p><b>Art. 3.</b> {T("Restituirea se face la noua dată, în aceleași condiții. Toate celelalte clauze ale contractului rămân neschimbate.", "The item is returned on the new date, under the same conditions. All other clauses of the agreement remain unchanged.")}</p>
            <p><b>Art. 4.</b> {T("Protecția bunului se prelungește de drept până la noua dată de restituire.", "Item protection is automatically extended until the new return date.")}</p>
            <Sig pv={{ phase: "extension", owner_signature_data: e.owner_signature_data, renter_signature_data: e.renter_signature_data, owner_signed_at: e.owner_signed_at, renter_signed_at: e.renter_signed_at }} />
          </div>
        ))
      )}
      {(sb || !paidExts.length) && <Sig />}
    </div>
  );
  const extToSign = myRole ? paidExts.find((e) => myRole === "owner" ? !e.owner_signed_at : (!!e.owner_signed_at && !e.renter_signed_at)) : undefined;
  const extWaitingOwner = myRole === "renter" && paidExts.some((e) => !e.owner_signed_at);

  const handoverDone = !!(rental.handover_pv_owner_signed_at && rental.handover_pv_renter_signed_at);
  const unlocked: Record<Tab, boolean> = {
    contract: true,
    anexa1: sb || acc.bothAccepted,
    anexa2: sb || handoverDone,
    anexa3: sb || paidExts.length > 0,
  };
  const lockMsg: Record<Tab, string> = {
    contract: "",
    anexa1: T("Anexa 1 se deblochează după semnarea contractului de către ambele părți.", "Annex 1 unlocks after both parties sign the contract."),
    anexa2: T("Anexa 2 se deblochează după finalizarea predării (Anexa 1 semnată de ambele părți).", "Annex 2 unlocks after handover is completed (Annex 1 signed by both parties)."),
    anexa3: T("Anexa 3 este disponibilă doar după o prelungire aprobată și achitată.", "Annex 3 is available only after an approved and paid extension."),
  };
  const tabs: { k: Tab; l: string }[] = [
    { k: "contract", l: T("Contract", "Agreement") },
    { k: "anexa1", l: T("Anexa 1 · Predare", "Annex 1 · Handover") },
    { k: "anexa2", l: T("Anexa 2 · Returnare", "Annex 2 · Return") },
    { k: "anexa3", l: T("Anexa 3 · Act adițional", "Annex 3 · Addendum") },
  ];
  const isLocked = !unlocked[tab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {T("Documentele rezervării", "Booking documents")} {rental.public_id}</DialogTitle>
          <DialogDescription>{T("Contract de locațiune bun mobil și anexele aferente.", "Movable item lease agreement and its annexes.")}</DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {tabs.map((x) => (
              <Button key={x.k} size="sm" variant={tab === x.k ? "default" : "outline"} className={!unlocked[x.k] ? "opacity-60" : ""} onClick={() => setTab(x.k)}>
                {!unlocked[x.k] && <Lock className="h-3.5 w-3.5 mr-1" />}{x.l}
              </Button>
            ))}
            <div className="ml-auto flex gap-2 flex-wrap">
              <Button size="sm" disabled={isLocked} variant="outline" onClick={() => print(false)}><Printer className="h-4 w-4 mr-1" />{T("Tipărește", "Print")}</Button>
              <Button size="sm" disabled={isLocked || saving} variant={(tab === "contract" && canSignContract) || (tab === "anexa3" && extToSign) ? "outline" : "default"} onClick={savePdf}>{saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}{T("Salvează PDF", "Save PDF")}</Button>
            </div>
          </div>
          {tab === "contract" && canSignContract && (
            <p className="text-xs text-muted-foreground pt-1">{T("Citește contractul până la final — butonul de semnare se activează în partea de jos.", "Read the contract to the end — the sign button activates at the bottom.")}</p>
          )}
          {tab === "anexa3" && extToSign && (
            <p className="text-xs text-muted-foreground pt-1">{T("Citește Anexa 3 — butonul de semnare este în partea de jos.", "Read Annex 3 — the sign button is at the bottom.")}</p>
          )}
          {tab === "anexa3" && !extToSign && extWaitingOwner && (
            <p className="text-xs text-muted-foreground pt-1">{T("În așteptarea semnăturii proprietarului — vei putea semna după el.", "Waiting for the owner's signature — you can sign after them.")}</p>
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
              <p className="font-semibold mt-3">{T("Document blocat", "Document locked")}</p>
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
                {readToEnd ? T("Ai parcurs contractul. Poți trece la semnare.", "You have reviewed the contract. You can now sign.") : T("Derulează până la finalul contractului pentru a putea semna.", "Scroll to the end of the contract to be able to sign.")}
              </p>
              <Button disabled={!readToEnd} onClick={() => setSignOpen(true)}>
                <FileSignature className="h-4 w-4 mr-1" />{T("Am citit — semnează contractul", "I have read it — sign the contract")}
              </Button>
            </div>
          )}
          {tab === "anexa3" && extToSign && !isLocked && (
            <div className="mx-auto max-w-[210mm] mt-4 rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <p className="text-sm text-muted-foreground">
                {T("Verifică Anexa 3 de mai sus, apoi semnează.", "Review Annex 3 above, then sign.")}
              </p>
              <Button onClick={() => setExtSignId(extToSign.id)}>
                <FileSignature className="h-4 w-4 mr-1" />{T("Am citit — semnează Anexa 3", "I have read it — sign Annex 3")}
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
      <ContractSignDialog open={signOpen} onOpenChange={setSignOpen} rentalId={rental.id} publicId={rental.public_id}
        onSign={async (sig, code) => { const r = await acc.sign(sig, code); justSignedRef.current = true; onOpenChange(false); return r; }}
        onBothSigned={() => { justSignedRef.current = true; onOpenChange(false); }} />
      {extSignId && (
        <ExtensionSignDialog open={!!extSignId} onOpenChange={(o) => { if (!o) setExtSignId(null); }} extensionId={extSignId} publicId={rental.public_id}
          onSigned={() => { qc.invalidateQueries({ queryKey: ["rental-extensions", rental.id] }); onOpenChange(false); }} />
      )}
    </Dialog>
  );
}
