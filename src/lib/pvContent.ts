import { format } from "date-fns";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";

/**
 * Shared helpers + content builders for the Proces-Verbal (handover/return).
 * Used by the in-dialog rendered document, the PDF generator (jsPDF) and the
 * DOCX exporter so all three stay in sync.
 */

/** Replace Romanian diacritics — required for jsPDF Helvetica. */
export function noDia(s: string | null | undefined): string {
  if (!s) return "-";
  return s
    .replace(/[ăâ]/g, "a").replace(/[ĂÂ]/g, "A")
    .replace(/î/g, "i").replace(/Î/g, "I")
    .replace(/[șş]/g, "s").replace(/[ȘŞ]/g, "S")
    .replace(/[țţ]/g, "t").replace(/[ȚŢ]/g, "T");
}

export interface PvContent {
  title: string;
  ownerName: string;
  renterName: string;
  intro: string;
  object: string;
  accessories: string | null;
  period: string;
  responsibility: string;
  finalClause: string;
  todayLabel: string;
}

/** Date of the PV = effective signing date (latest signature), else now (live signing). */
export function pvEffectiveDate(pv?: { owner_signed_at?: string | null; renter_signed_at?: string | null } | null): Date {
  const ts = [pv?.owner_signed_at, pv?.renter_signed_at].filter(Boolean).map((d) => new Date(d as string).getTime());
  return ts.length ? new Date(Math.max(...ts)) : new Date();
}

export function buildPvContent(rental: RentalFullDetail, phase: "handover" | "return", docDate: Date = new Date()): PvContent {
  const today = format(docDate, "dd.MM.yyyy");
  const ownerName = rental.owner_name || "Proprietar";
  const renterName = rental.renter_name || "Chirias";
  const ownerPhone = rental.owner_phone || "0740 000 000";
  const renterPhone = rental.renter_phone || "0740 000 000";
  const ownerEmail = rental.owner_email || "owner@rentli.ro";
  const renterEmail = rental.renter_email || "renter@rentli.ro";

  const title = phase === "handover" ? "PROCES-VERBAL DE PREDARE-PRIMIRE" : "PROCES-VERBAL DE RETURNARE";

  const intro =
    `Incheiat astazi, ${today}, intre domnul/doamna ${ownerName}, in calitate de Proprietar, ` +
    `telefon ${ownerPhone}, email ${ownerEmail}, si domnul/doamna ${renterName}, in calitate de Chirias, ` +
    `telefon ${renterPhone}, email ${renterEmail}.`;

  const cat = rental.product_category || "-";
  const object =
    `Prin prezentul proces-verbal, Proprietarul preda, iar Chiriasul primeste spre utilizare temporara, ` +
    `prin intermediul platformei de renting peer-to-peer Rentli, urmatorul bun: ${rental.product_title || "-"}, ` +
    `din categoria ${cat}, pentru o perioada de ${rental.rental_days} zile, cu costul total de ${rental.subtotal} lei ` +
    `(${rental.daily_price} lei/zi).`;

  const items = rental.product_included_items || [];
  const accessories = items.length > 0
    ? (phase === "handover"
      ? `Bunul este insotit de urmatoarele accesorii: ${items.join(", ")}. La momentul predarii au fost realizate fotografii pentru confirmarea starii acestuia: DA.`
      : `Bunul este insotit de urmatoarele accesorii: ${items.join(", ")}. La momentul returnarii au fost realizate fotografii pentru confirmarea starii acestuia: DA.`)
    : null;

  const startTime = rental.pickup_time || "10:00";
  const endTime = "18:00";
  const period =
    `Perioada de utilizare convenita intre parti este de la data si ora ` +
    `${format(new Date(rental.start_date), "dd.MM.yyyy")}, ora ${startTime} pana la data si ora ` +
    `${format(new Date(rental.end_date), "dd.MM.yyyy")}, ora ${endTime}.`;

  const responsibility = phase === "handover"
    ? "Chiriasul declara ca a verificat bunul si il accepta in starea mentionata, obligandu-se sa il utilizeze conform destinatiei sale, sa il pastreze in bune conditii si sa il returneze la termenul stabilit, in aceeasi stare, cu exceptia uzurii normale. Chiriasul isi asuma raspunderea pentru orice deteriorare, pierdere sau furt survenite pe perioada utilizarii si se obliga sa notifice imediat Proprietarul in cazul aparitiei unor defecte sau incidente."
    : "Chiriasul restituie bunul catre Proprietar, iar Proprietarul confirma primirea acestuia in starea documentata prin fotografiile anexate. Eventualele daune constatate la momentul returnarii vor fi reglementate prin intermediul platformei Rentli, conform termenilor si conditiilor agreate.";

  const finalClause =
    "Eventualele neintelegeri vor fi solutionate conform termenilor si conditiilor platformei Rentli. Prezentul proces-verbal a fost incheiat in doua exemplare, cate unul pentru fiecare parte, avand aceeasi valoare juridica.";

  return {
    title,
    ownerName,
    renterName,
    intro,
    object,
    accessories,
    period,
    responsibility,
    finalClause,
    todayLabel: today,
  };
}

export const COMPANY = {
  name: "Rentli Platform SRL",
  address: "Str. Exemplu nr. 1, Bucuresti",
  fiscal: "CUI: RO12345678 | J40/1234/2024",
  contact: "Tel: +40 740 000 000 | Email: contact@rentli.ro",
};

export const MIN_PV_PHOTOS = 2;

/* =============================================================
 * Rich (run-based) content — shared by PDF, DOCX and HTML view.
 * Each paragraph is an array of `{ text, bold? }` so all three
 * renderers can apply identical bold emphasis.
 * ============================================================= */

export interface PvRun {
  text: string;
  bold?: boolean;
}

export interface PvRichContent {
  title: string;
  ownerName: string;
  renterName: string;
  introRuns: PvRun[];
  objectRuns: PvRun[];
  accessoriesRuns: PvRun[] | null;
  periodRuns: PvRun[];
  responsibilityRuns: PvRun[];
  finalClauseRuns: PvRun[];
  todayLabel: string;
}

const T = (text: string): PvRun => ({ text });
const B = (text: string): PvRun => ({ text, bold: true });

export function buildPvRichContent(
  rental: RentalFullDetail,
  phase: "handover" | "return",
  docDate: Date = new Date(),
): PvRichContent {
  const today = format(docDate, "dd.MM.yyyy");
  const ownerName = rental.owner_name || "Proprietar";
  const renterName = rental.renter_name || "Chirias";
  const ownerPhone = rental.owner_phone || "0740 000 000";
  const renterPhone = rental.renter_phone || "0740 000 000";
  const ownerEmail = rental.owner_email || "owner@rentli.ro";
  const renterEmail = rental.renter_email || "renter@rentli.ro";
  const title = phase === "handover"
    ? "PROCES-VERBAL DE PREDARE-PRIMIRE"
    : "PROCES-VERBAL DE RETURNARE";

  const introRuns: PvRun[] = [
    T("Incheiat astazi, "), B(today),
    T(", intre domnul/doamna "), B(ownerName),
    T(", in calitate de "), B("Proprietar"),
    T(", telefon "), B(ownerPhone),
    T(", email "), B(ownerEmail),
    T(", si domnul/doamna "), B(renterName),
    T(", in calitate de "), B("Chirias"),
    T(", telefon "), B(renterPhone),
    T(", email "), B(renterEmail),
    T("."),
  ];

  const cat = rental.product_category || "-";
  const objectRuns: PvRun[] = [
    T("Prin prezentul proces-verbal, Proprietarul preda, iar Chiriasul primeste spre utilizare temporara, prin intermediul platformei de renting peer-to-peer Rentli, urmatorul bun: "),
    B(rental.product_title || "-"),
    T(", din categoria "), B(cat),
    T(", pentru o perioada de "), B(`${rental.rental_days} zile`),
    T(", cu costul total de "), B(`${rental.subtotal} lei`),
    T(" ("), B(`${rental.daily_price} lei/zi`),
    T(")."),
  ];

  const items = rental.product_included_items || [];
  const accessoriesRuns: PvRun[] | null = items.length > 0
    ? [
        T("Bunul este insotit de urmatoarele accesorii: "),
        B(items.join(", ")),
        T(phase === "handover"
          ? ". La momentul predarii au fost realizate fotografii pentru confirmarea starii acestuia: "
          : ". La momentul returnarii au fost realizate fotografii pentru confirmarea starii acestuia: "),
        B("DA"),
        T("."),
      ]
    : null;

  const startTime = rental.pickup_time || "10:00";
  const endTime = "18:00";
  const periodRuns: PvRun[] = [
    T("Perioada de utilizare convenita intre parti este de la data si ora "),
    B(`${format(new Date(rental.start_date), "dd.MM.yyyy")}, ora ${startTime}`),
    T(" pana la data si ora "),
    B(`${format(new Date(rental.end_date), "dd.MM.yyyy")}, ora ${endTime}`),
    T("."),
  ];

  const responsibilityRuns: PvRun[] = [
    T(phase === "handover"
      ? "Chiriasul declara ca a verificat bunul si il accepta in starea mentionata, obligandu-se sa il utilizeze conform destinatiei sale, sa il pastreze in bune conditii si sa il returneze la termenul stabilit, in aceeasi stare, cu exceptia uzurii normale. Chiriasul isi asuma raspunderea pentru orice deteriorare, pierdere sau furt survenite pe perioada utilizarii si se obliga sa notifice imediat Proprietarul in cazul aparitiei unor defecte sau incidente."
      : "Chiriasul restituie bunul catre Proprietar, iar Proprietarul confirma primirea acestuia in starea documentata prin fotografiile anexate. Eventualele daune constatate la momentul returnarii vor fi reglementate prin intermediul platformei Rentli, conform termenilor si conditiilor agreate."),
  ];

  const finalClauseRuns: PvRun[] = [
    T("Eventualele neintelegeri vor fi solutionate conform termenilor si conditiilor platformei Rentli. Prezentul proces-verbal a fost incheiat in doua exemplare, cate unul pentru fiecare parte, avand aceeasi valoare juridica."),
  ];

  return {
    title,
    ownerName,
    renterName,
    introRuns,
    objectRuns,
    accessoriesRuns,
    periodRuns,
    responsibilityRuns,
    finalClauseRuns,
    todayLabel: today,
  };
}