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

/** Use the reservation's recorded charges, never today's fee rates. */
export function getPvFinancials(rental: Pick<RentalFullDetail, "subtotal" | "platform_fee" | "stripe_fee" | "insurance_fee">) {
  const subtotal = Number(rental.subtotal ?? 0);
  const platformFee = Number(rental.platform_fee ?? 0);
  const stripeFee = Number(rental.stripe_fee ?? 0);
  const insuranceFee = Number(rental.insurance_fee ?? 0);
  return {
    subtotal, platformFee, stripeFee, insuranceFee,
    total: Math.round((subtotal + platformFee + stripeFee + insuranceFee) * 100) / 100,
  };
}

const pvMoney = (amount: number) => `${amount.toFixed(2)} RON`;

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
  const financials = getPvFinancials(rental);
  const object =
    `Prin prezentul proces-verbal, Proprietarul preda, iar Chiriasul primeste spre utilizare temporara, ` +
    `prin intermediul platformei de renting peer-to-peer Rentli, urmatorul bun: ${rental.product_title || "-"}, ` +
    `din categoria ${cat}, pentru o perioada de ${rental.rental_days} zile, cu chiria de ${pvMoney(financials.subtotal)} ` +
    `(${pvMoney(rental.daily_price)}/zi), comisionul platformei de ${pvMoney(financials.platformFee)}, ` +
    `taxa Stripe de ${pvMoney(financials.stripeFee)}` +
    (financials.insuranceFee > 0 ? `, taxa de asigurare de ${pvMoney(financials.insuranceFee)}` : "") +
    ` si costul total pentru chirias de ${pvMoney(financials.total)}.`;

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

/**
 * A table of the official template.
 * - "kv":   4-column label/value grid (labels in columns 0 and 2 are bold).
 * - "grid": first row is a bold header row.
 * Cells are plain strings; checkboxes are written as "[X]" / "[ ]".
 */
export interface PvTable {
  kind: "kv" | "grid";
  rows: string[][];
  /** Relative column widths (sum arbitrary). */
  widths?: number[];
}

/** One section of the PV, in the exact order of the official template. */
export interface PvSection {
  heading: string;
  /** Italic hint shown under the heading. */
  note?: string;
  table?: PvTable;
  paragraphs: PvRun[][];
  /** Render the live signature block (signatures of this PV) right after this section. */
  signaturesAfter?: boolean;
}

/** Live signature block (template "SEMNATURI Predare" / "SEMNATURI Restituire"). */
export interface PvSignatureBlock {
  heading: string;
  left: { action: string; role: string; party: "owner" | "renter"; name: string };
  right: { action: string; role: string; party: "owner" | "renter"; name: string };
}

export interface PvRichContent {
  title: string;
  subtitle: string;
  ownerName: string;
  renterName: string;
  headerTable: PvTable;
  /** Kept for back-compat with plain renderers. */
  headerRuns: PvRun[];
  sections: PvSection[];
  signatures: PvSignatureBlock;
  todayLabel: string;
}

const T = (text: string): PvRun => ({ text });
const B = (text: string): PvRun => ({ text, bold: true });
const KV = (k: string, v: string | number | null | undefined): PvRun[] => [T(`${k}: `), B(v === null || v === undefined || v === "" ? "-" : String(v))];
const val = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "-" : String(v));
const box = (checked: boolean) => (checked ? "[X]" : "[ ]");

export const PV_CHECKLIST = [
  "Aspect exterior / carcasa / material",
  "Functionalitate generala",
  "Elemente mobile / mecanisme",
  "Cabluri / alimentare / baterie (daca exista)",
  "Roti / frane / componente (daca este cazul)",
  "Curatenie / igiena / mirosuri",
];

export const PV_DECLARATIONS = [
  "Locatorul declara ca este proprietarul bunului sau ca are dreptul de a-l inchiria.",
  "Locatarul confirma ca a verificat bunul si accesoriile la preluare si ca le primeste in starea descrisa in prezentul proces-verbal.",
  "Locatarul se obliga sa utilizeze bunul conform destinatiei sale, instructiunilor de utilizare si conditiilor convenite intre parti.",
  "La restituire, bunul si accesoriile vor fi verificate prin raportare la starea si inventarul consemnate la predare, tinandu-se cont de uzura normala.",
  "Orice deteriorare, pierdere sau lipsa constatata la restituire se va consemna in prezentul proces-verbal si se va solutiona conform contractului / termenilor platformei.",
  "Procesul verbal este completat cu fotografii ale defectelor atat in cazul predarii, cat si in cazul restituirii bunului. Lipsa acestor fotografii duce la nulitatea procesului verbal si implicit la lipsa acoperirii prin asigurare.",
];

const TEMPLATE_CATEGORIES: Array<[string, RegExp]> = [
  ["casnic", /casa|casnic|gradin|bucatar|electrocasnic|home/i],
  ["sport", /sport|bicicl|fitness|ski|trotinet/i],
  ["camping", /camp|cort|outdoor|drumet/i],
  ["hobby", /hobby|foto|muzic|joc|gaming|instrument/i],
];

export function templateCategoryLine(category: string | null | undefined): string {
  const match = TEMPLATE_CATEGORIES.find(([, re]) => re.test(category || ""))?.[0] ?? "altul";
  const opts = ["casnic", "sport", "camping", "hobby", "altul"].map((o) => `${box(o === match)} ${o}`).join("  ");
  return match === "altul" && category ? `${opts} (${category})` : opts;
}

/**
 * Builds the PV exactly after the official template "Proces_verbal_UNICA"
 * (header table, sections 1–7, signature blocks for handover and return).
 * The same document serves both phases: the live signatures are placed in
 * "SEMNATURI Predare" (handover) or "SEMNATURI Restituire" (return).
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
  const financials = getPvFinancials(rental);
  const isReturn = phase === "return";
  const pvNo = `${rental.public_id}-${isReturn ? "R" : "P"}`;
  const place = val(rental.pickup_location || rental.product_location_city);
  const idDoc = "verificat prin Stripe Identity";

  const title = isReturn
    ? "PROCES-VERBAL DE PREDARE-PRIMIRE (RESTITUIRE)"
    : "PROCES-VERBAL DE PREDARE-PRIMIRE";
  const subtitle = "BUN / OBIECT INCHIRIAT – PLATFORMA DE INCHIRIERE INTRE PERSOANE";

  const headerTable: PvTable = {
    kind: "kv",
    rows: [
      ["Nr. proces-verbal", pvNo, "Data", today],
      ["Locul predarii", place, "Ora", time],
    ],
  };
  const headerRuns: PvRun[] = [
    ...KV("Nr. proces-verbal", pvNo), T("   "), ...KV("Data", today), T("   "),
    ...KV("Ora", time), T("   "), ...KV("Locul predarii", place),
  ];

  const inventoryRows = items.length
    ? items.map((it, i) => [String(i + 1), it, "1", `${box(true)} bun  ${box(false)} uzat`, "conform fotografiilor"])
    : [["1", "Nu au fost declarate accesorii", "-", "-", "-"]];

  const disputed = rental.dispute_status === "open";
  const returnRows: string[][] = isReturn
    ? [
        ["Data / ora restituirii", `${today} ora ${time}`, "", ""],
        [
          "Stare la restituire",
          `${box(!disputed)} conform predarii\n${box(disputed)} cu defecte: ${disputed ? "vezi disputa si fotografiile" : "……."}`,
          "Accesorii",
          `${box(!disputed)} complete\n${box(disputed)} lipsuri`,
        ],
      ]
    : [
        ["Data / ora restituirii", "____/____/______  ora ______", "", ""],
        ["Stare la restituire", `${box(false)} conform predarii\n${box(false)} cu defecte: …….`, "Accesorii", `${box(false)} complete\n${box(false)} lipsuri`],
      ];

  const sigTable = (left: [string, string, string], right: [string, string, string], sign: string): PvTable => ({
    kind: "kv",
    rows: [
      [left[0], left[1], right[0], right[1]],
      ["Nume:", left[2], "Nume:", right[2]],
      ["Semnatura:", sign, "Semnatura:", sign],
    ],
  });

  const sections: PvSection[] = [
    {
      heading: "1. PARTILE",
      table: {
        kind: "kv",
        rows: [
          ["PROPRIETAR / LOCATOR", `Nume si prenume: ${ownerName}`, "CHIRIAS / LOCATAR", `Nume si prenume: ${renterName}`],
          ["C.I. / document", idDoc, "C.I. / document", idDoc],
          ["Telefon", val(rental.owner_phone), "Telefon", val(rental.renter_phone)],
          ["E-mail", val(rental.owner_email), "E-mail", val(rental.renter_email)],
        ],
      },
      paragraphs: [],
    },
    {
      heading: "2. DATELE INCHIRIERII",
      table: {
        kind: "kv",
        rows: [
          ["Bunul inchiriat", val(rental.product_title), "Categorie", templateCategoryLine(rental.product_category)],
          ["Perioada", `De la ${fmt(rental.start_date)} ora ${rental.pickup_time || "10:00"}`, "Pana la", `${fmt(rental.end_date)} ora 18:00`],
          ["Nr. contract", val(rental.public_id), "Pret inchiriere/zi", `${Number(rental.daily_price ?? 0).toFixed(2)} lei`],
          ["Subtotal inchiriere", pvMoney(financials.subtotal), "Comision platforma", pvMoney(financials.platformFee)],
          ["Taxa Stripe", pvMoney(financials.stripeFee), "Taxa asigurare", financials.insuranceFee > 0 ? pvMoney(financials.insuranceFee) : "-"],
          ["Total chirias (taxe incluse)", pvMoney(financials.total), "Nr. zile", String(rental.rental_days)],
        ],
      },
      paragraphs: [],
    },
    {
      heading: "3. IDENTIFICAREA BUNULUI",
      table: {
        kind: "kv",
        rows: [
          ["Denumire / model", val(rental.product_title), "Marca", "-"],
          ["An fabricatie", "-", "", ""],
          ["Nr. serie / identificare", "-", "Suma asigurata", rental.product_deposit_value ? `${rental.product_deposit_value} lei` : "-"],
          ["Accesorii incluse", items.length ? items.join(", ") : "-", "Ambalaj / husa", `${box(false)} Da   ${box(false)} Nu`],
        ],
      },
      paragraphs: [],
    },
    {
      heading: "4. STAREA BUNULUI LA PREDARE",
      note: "Se bifeaza situatia constatata la predare. Defectele / urmele existente se descriu concret la „Observatii”.",
      table: {
        kind: "grid",
        widths: [4, 1, 1.4, 4],
        rows: [
          ["Element verificat", "Bun", "Cu urme / uzura", "Observatii / defecte existente"],
          ...PV_CHECKLIST.map((c) => [c, box(false), box(false), "conform fotografiilor anexate"]),
        ],
      },
      paragraphs: [],
    },
    {
      heading: "5. INVENTAR SI ACCESORII PREDATE",
      table: {
        kind: "grid",
        widths: [0.6, 4, 0.8, 2, 3],
        rows: [["Nr.", "Obiect / accesoriu", "Cant.", "Stare", "Observatii"], ...inventoryRows],
      },
      paragraphs: [],
      signaturesAfter: !isReturn,
    },
    ...(isReturn
      ? [{
          heading: "SEMNATURI Predare",
          table: sigTable(["PREDAT DE", "PROPRIETAR / LOCATOR", ownerName], ["PRIMIT DE", "CHIRIAS / LOCATAR", renterName], `semnat la predare (PV ${rental.public_id}-P)`),
          paragraphs: [],
        } as PvSection]
      : []),
    {
      heading: "6. CONSTATAREA LA RESTITUIRE",
      table: { kind: "kv", rows: returnRows },
      paragraphs: [],
      signaturesAfter: isReturn,
    },
    ...(!isReturn
      ? [{
          heading: "SEMNATURI Restituire",
          table: sigTable(["PREDAT DE", "CHIRIAS / LOCATAR", renterName], ["PRIMIT DE", "PROPRIETAR / LOCATOR", ownerName], "se semneaza la restituire"),
          paragraphs: [],
        } as PvSection]
      : []),
    {
      heading: "7. DECLARATII",
      paragraphs: PV_DECLARATIONS.map((d, i) => [T(`${i + 1}. ${d}`)]),
    },
  ];

  const signatures: PvSignatureBlock = isReturn
    ? {
        heading: "SEMNATURI Restituire",
        left: { action: "PREDAT DE", role: "CHIRIAS / LOCATAR", party: "renter", name: renterName },
        right: { action: "PRIMIT DE", role: "PROPRIETAR / LOCATOR", party: "owner", name: ownerName },
      }
    : {
        heading: "SEMNATURI Predare",
        left: { action: "PREDAT DE", role: "PROPRIETAR / LOCATOR", party: "owner", name: ownerName },
        right: { action: "PRIMIT DE", role: "CHIRIAS / LOCATAR", party: "renter", name: renterName },
      };

  return { title, subtitle, ownerName, renterName, headerTable, headerRuns, sections, signatures, todayLabel: today };
}
