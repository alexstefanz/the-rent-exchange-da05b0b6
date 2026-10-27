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

/** One numbered section of the PV; each paragraph is a list of runs. */
export interface PvSection {
  heading: string;
  paragraphs: PvRun[][];
}

export interface PvRichContent {
  title: string;
  subtitle: string;
  ownerName: string;
  renterName: string;
  headerRuns: PvRun[];
  sections: PvSection[];
  todayLabel: string;
}

const T = (text: string): PvRun => ({ text });
const B = (text: string): PvRun => ({ text, bold: true });
const KV = (k: string, v: string | number | null | undefined): PvRun[] => [T(`${k}: `), B(v === null || v === undefined || v === "" ? "-" : String(v))];

const CHECKLIST = [
  "Aspect exterior / carcasa / material",
  "Functionalitate generala",
  "Elemente mobile / mecanisme",
  "Cabluri / alimentare / baterie (daca exista)",
  "Roti / frane / componente (daca este cazul)",
  "Curatenie / igiena / mirosuri",
];

const DECLARATIONS = [
  "Locatorul declara ca este proprietarul bunului sau ca are dreptul de a-l inchiria.",
  "Locatarul confirma ca a verificat bunul si accesoriile la preluare si ca le primeste in starea descrisa in prezentul proces-verbal.",
  "Locatarul se obliga sa utilizeze bunul conform destinatiei sale, instructiunilor de utilizare si conditiilor convenite intre parti.",
  "La restituire, bunul si accesoriile vor fi verificate prin raportare la starea si inventarul consemnate la predare, tinandu-se cont de uzura normala.",
  "Orice deteriorare, pierdere sau lipsa constatata la restituire se va consemna in prezentul proces-verbal si se va solutiona conform contractului / termenilor platformei.",
  "Procesul-verbal este completat cu fotografii ale defectelor atat in cazul predarii, cat si in cazul restituirii bunului. Lipsa acestor fotografii duce la nulitatea procesului-verbal si implicit la lipsa acoperirii prin asigurare.",
];

/**
 * Builds the PV according to the official Rentli template (sections 1–7).
 * The same document is used at handover and at return: at handover section 6
 * is marked as pending; at return it is filled in.
 */
export function buildPvRichContent(
  rental: RentalFullDetail,
  phase: "handover" | "return",
  docDate: Date = new Date(),
): PvRichContent {
  const today = format(docDate, "dd.MM.yyyy");
  const time = format(docDate, "HH:mm");
  const ownerName = rental.owner_name || "Proprietar";
  const renterName = rental.renter_name || "Chirias";
  const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy");
  const items = rental.product_included_items || [];

  const title = phase === "handover"
    ? "PROCES-VERBAL DE PREDARE-PRIMIRE"
    : "PROCES-VERBAL DE PREDARE-PRIMIRE (RESTITUIRE)";
  const subtitle = "BUN / OBIECT INCHIRIAT – PLATFORMA DE INCHIRIERE INTRE PERSOANE";

  const headerRuns: PvRun[] = [
    ...KV("Nr. proces-verbal", `${rental.public_id}-${phase === "handover" ? "P" : "R"}`), T("   "),
    ...KV("Data", today), T("   "),
    ...KV("Ora", time), T("   "),
    ...KV("Locul predarii", rental.pickup_location || rental.product_location_city),
  ];

  const sections: PvSection[] = [
    {
      heading: "1. PARTILE",
      paragraphs: [
        [B("PROPRIETAR / LOCATOR — "), ...KV("Nume si prenume", ownerName), T("; "), ...KV("Telefon", rental.owner_phone), T("; "), ...KV("E-mail", rental.owner_email), T("; C.I. / document: conform verificarii de identitate Rentli (Stripe Identity).")],
        [B("CHIRIAS / LOCATAR — "), ...KV("Nume si prenume", renterName), T("; "), ...KV("Telefon", rental.renter_phone), T("; "), ...KV("E-mail", rental.renter_email), T("; C.I. / document: conform verificarii de identitate Rentli (Stripe Identity).")],
      ],
    },
    {
      heading: "2. DATELE INCHIRIERII",
      paragraphs: [
        KV("Bunul inchiriat", rental.product_title),
        KV("Categorie", rental.product_category),
        [T("Perioada: de la "), B(`${fmt(rental.start_date)} ora ${rental.pickup_time || "10:00"}`), T(" pana la "), B(`${fmt(rental.end_date)} ora 18:00`), T(" ("), B(`${rental.rental_days} zile`), T(")")],
        KV("Nr. contract", rental.public_id),
        [...KV("Pret inchiriere/zi", `${rental.daily_price} lei`), T("; "), ...KV("Total", `${rental.subtotal} lei`)],
      ],
    },
    {
      heading: "3. IDENTIFICAREA BUNULUI",
      paragraphs: [
        KV("Denumire / model", rental.product_title),
        KV("Suma asigurata", rental.product_deposit_value ? `${rental.product_deposit_value} lei` : "-"),
        KV("Accesorii incluse", items.length ? items.join(", ") : "-"),
      ],
    },
    {
      heading: "4. STAREA BUNULUI LA PREDARE",
      paragraphs: [
        [T("Starea constatata la predare este documentata prin fotografiile anexate (Anexa 1). Defectele / urmele existente sunt vizibile in fotografii.")],
        ...CHECKLIST.map((c) => [T(`• ${c}: `), B("conform fotografiilor anexate")]),
      ],
    },
    {
      heading: "5. INVENTAR SI ACCESORII PREDATE",
      paragraphs: items.length
        ? items.map((it, i) => [T(`${i + 1}. `), B(it), T(" — cant. 1 — stare: conform fotografiilor")])
        : [[T("Nu au fost declarate accesorii.")]],
    },
    {
      heading: "6. CONSTATAREA LA RESTITUIRE",
      paragraphs: phase === "handover"
        ? [[T("Se completeaza la restituirea bunului, prin procesul-verbal de restituire semnat de ambele parti.")]]
        : [
            KV("Data / ora restituirii", `${today} ora ${time}`),
            [T("Stare la restituire: "), B("conform fotografiilor de restituire anexate (Anexa 2)"), T(", raportat la starea de la predare.")],
            [T("Accesorii: "), B(items.length ? items.join(", ") : "-"), T(" — verificate la restituire.")],
            [T("Eventualele defecte sau lipsuri se semnaleaza prin deschiderea unei dispute in platforma Rentli.")],
          ],
    },
    {
      heading: "7. DECLARATII",
      paragraphs: DECLARATIONS.map((d, i) => [T(`${i + 1}. ${d}`)]),
    },
  ];

  return { title, subtitle, ownerName, renterName, headerRuns, sections, todayLabel: today };
}