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

export const PV_CHECKLIST_EN = [
  "Exterior / housing / material",
  "General functionality",
  "Moving parts / mechanisms",
  "Cables / power / battery (if any)",
  "Wheels / brakes / components (if applicable)",
  "Cleanliness / hygiene / odours",
];

export const PV_DECLARATIONS = [
  "Locatorul declara ca este proprietarul bunului sau ca are dreptul de a-l inchiria.",
  "Locatarul confirma ca a verificat bunul si accesoriile la preluare si ca le primeste in starea descrisa in prezentul proces-verbal.",
  "Locatarul se obliga sa utilizeze bunul conform destinatiei sale, instructiunilor de utilizare si conditiilor convenite intre parti.",
  "La restituire, bunul si accesoriile vor fi verificate prin raportare la starea si inventarul consemnate la predare, tinandu-se cont de uzura normala.",
  "Orice deteriorare, pierdere sau lipsa constatata la restituire se va consemna in prezentul proces-verbal si se va solutiona conform contractului / termenilor platformei.",
  "Procesul verbal este completat cu fotografii ale defectelor atat in cazul predarii, cat si in cazul restituirii bunului. Lipsa acestor fotografii duce la nulitatea procesului verbal si implicit la lipsa acoperirii prin asigurare.",
];

export const PV_DECLARATIONS_EN = [
  "The Lessor declares that they own the item or have the right to rent it out.",
  "The Lessee confirms having checked the item and accessories at pickup and receives them in the condition described in this report.",
  "The Lessee undertakes to use the item according to its purpose, the instructions for use and the conditions agreed between the parties.",
  "On return, the item and accessories will be checked against the condition and inventory recorded at handover, taking normal wear into account.",
  "Any damage, loss or shortage found on return will be recorded in this report and settled according to the agreement / platform terms.",
  "The report is completed with photos of defects both at handover and at return. Missing photos make the report void and consequently remove insurance coverage.",
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
  lang: "ro" | "en" = "ro",
): PvRichContent {
  const L = (ro: string, en: string) => (lang === "en" ? en : ro);
  const today = format(docDate, "dd.MM.yyyy");
  const time = format(docDate, "HH:mm");
  const ownerName = rental.owner_name || L("Proprietar", "Owner");
  const renterName = rental.renter_name || L("Chirias", "Renter");
  const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy");
  const items = rental.product_included_items || [];
  const financials = getPvFinancials(rental);
  const isReturn = phase === "return";
  const pvNo = `${rental.public_id}-${isReturn ? "R" : "P"}`;
  const place = val(rental.pickup_location || rental.product_location_city);
  const idDoc = L("verificat prin Stripe Identity", "verified via Stripe Identity");

  const title = isReturn
    ? L("PROCES-VERBAL DE PREDARE-PRIMIRE (RESTITUIRE)", "HANDOVER REPORT (RETURN)")
    : L("PROCES-VERBAL DE PREDARE-PRIMIRE", "HANDOVER REPORT");
  const subtitle = L("BUN / OBIECT INCHIRIAT – PLATFORMA DE INCHIRIERE INTRE PERSOANE", "RENTED ITEM – PEER-TO-PEER RENTAL PLATFORM");

  const headerTable: PvTable = {
    kind: "kv",
    rows: [
      [L("Nr. proces-verbal", "Report no."), pvNo, L("Data", "Date"), today],
      [L("Locul predarii", "Handover place"), place, L("Ora", "Time"), time],
    ],
  };
  const headerRuns: PvRun[] = [
    ...KV("Nr. proces-verbal", pvNo), T("   "), ...KV("Data", today), T("   "),
    ...KV("Ora", time), T("   "), ...KV("Locul predarii", place),
  ];

  const inventoryRows = items.length
    ? items.map((it, i) => [String(i + 1), it, "1", L(`${box(true)} bun  ${box(false)} uzat`, `${box(true)} good  ${box(false)} worn`), L("conform fotografiilor", "as per photos")])
    : [["1", L("Nu au fost declarate accesorii", "No accessories declared"), "-", "-", "-"]];

  const disputed = rental.dispute_status === "open";
  const returnRows: string[][] = isReturn
    ? [
        [L("Data / ora restituirii", "Return date / time"), L(`${today} ora ${time}`, `${today} at ${time}`), "", ""],
        [
          L("Stare la restituire", "Condition on return"),
          L(`${box(!disputed)} conform predarii\n${box(disputed)} cu defecte: ${disputed ? "vezi disputa si fotografiile" : "……."}`, `${box(!disputed)} as at handover\n${box(disputed)} with defects: ${disputed ? "see dispute and photos" : "……."}`),
          L("Accesorii", "Accessories"),
          L(`${box(!disputed)} complete\n${box(disputed)} lipsuri`, `${box(!disputed)} complete\n${box(disputed)} missing`),
        ],
      ]
    : [
        [L("Data / ora restituirii", "Return date / time"), L("____/____/______  ora ______", "____/____/______  time ______"), "", ""],
        [L("Stare la restituire", "Condition on return"), L(`${box(false)} conform predarii\n${box(false)} cu defecte: …….`, `${box(false)} as at handover\n${box(false)} with defects: …….`), L("Accesorii", "Accessories"), L(`${box(false)} complete\n${box(false)} lipsuri`, `${box(false)} complete\n${box(false)} missing`)],
      ];

  const sigTable = (left: [string, string, string], right: [string, string, string], sign: string): PvTable => ({
    kind: "kv",
    rows: [
      [left[0], left[1], right[0], right[1]],
      [L("Nume:", "Name:"), left[2], L("Nume:", "Name:"), right[2]],
      [L("Semnatura:", "Signature:"), sign, L("Semnatura:", "Signature:"), sign],
    ],
  });

  const sections: PvSection[] = [
    {
      heading: L("1. PARTILE", "1. PARTIES"),
      table: {
        kind: "kv",
        rows: [
          [L("PROPRIETAR / LOCATOR", "OWNER / LESSOR"), L(`Nume si prenume: ${ownerName}`, `Full name: ${ownerName}`), L("CHIRIAS / LOCATAR", "RENTER / LESSEE"), L(`Nume si prenume: ${renterName}`, `Full name: ${renterName}`)],
          [L("C.I. / document", "ID / document"), idDoc, L("C.I. / document", "ID / document"), idDoc],
          [L("Telefon", "Phone"), val(rental.owner_phone), L("Telefon", "Phone"), val(rental.renter_phone)],
          ["E-mail", val(rental.owner_email), "E-mail", val(rental.renter_email)],
        ],
      },
      paragraphs: [],
    },
    {
      heading: L("2. DATELE INCHIRIERII", "2. RENTAL DETAILS"),
      table: {
        kind: "kv",
        rows: [
          [L("Bunul inchiriat", "Rented item"), val(rental.product_title), L("Categorie", "Category"), (lang === "en" ? (rental.product_category || "-") : templateCategoryLine(rental.product_category))],
          [L("Perioada", "Period"), L(`De la ${fmt(rental.start_date)} ora ${rental.pickup_time || "10:00"}`, `From ${fmt(rental.start_date)} at ${rental.pickup_time || "10:00"}`), L("Pana la", "Until"), L(`${fmt(rental.end_date)} ora 18:00`, `${fmt(rental.end_date)} at 18:00`)],
          [L("Nr. contract", "Contract no."), val(rental.public_id), L("Pret inchiriere/zi", "Rental price/day"), `${Number(rental.daily_price ?? 0).toFixed(2)} lei`],
          [L("Subtotal inchiriere", "Rental subtotal"), pvMoney(financials.subtotal), L("Comision platforma", "Platform fee"), pvMoney(financials.platformFee)],
          [L("Taxa Stripe", "Stripe fee"), pvMoney(financials.stripeFee), L("Taxa asigurare", "Insurance fee"), financials.insuranceFee > 0 ? pvMoney(financials.insuranceFee) : "-"],
          [L("Total chirias (taxe incluse)", "Renter total (fees incl.)"), pvMoney(financials.total), L("Nr. zile", "Days"), String(rental.rental_days)],
        ],
      },
      paragraphs: [],
    },
    {
      heading: L("3. IDENTIFICAREA BUNULUI", "3. ITEM IDENTIFICATION"),
      table: {
        kind: "kv",
        rows: [
          [L("Denumire / model", "Name / model"), val(rental.product_title), L("Marca", "Brand"), "-"],
          [L("An fabricatie", "Year of manufacture"), "-", "", ""],
          [L("Nr. serie / identificare", "Serial / ID no."), val((rental as any).product_serial_number), L("Suma asigurata", "Insured amount"), rental.product_deposit_value ? `${rental.product_deposit_value} lei` : "-"],
          [L("Accesorii incluse", "Included accessories"), items.length ? items.join(", ") : "-", L("Ambalaj / husa", "Packaging / case"), L(`${box(false)} Da   ${box(false)} Nu`, `${box(false)} Yes   ${box(false)} No`)],
        ],
      },
      paragraphs: [],
    },
    {
      heading: L("4. STAREA BUNULUI LA PREDARE", "4. CONDITION AT HANDOVER"),
      note: L("Se bifeaza situatia constatata la predare. Defectele / urmele existente se descriu concret la „Observatii”.", "Tick the condition found at handover. Existing defects / marks are described in “Remarks”."),
      table: {
        kind: "grid",
        widths: [4, 1, 1.4, 4],
        rows: [
          [L("Element verificat", "Checked element"), L("Bun", "Good"), L("Cu urme / uzura", "Marks / wear"), L("Observatii / defecte existente", "Remarks / existing defects")],
          ...(lang === "en" ? PV_CHECKLIST_EN : PV_CHECKLIST).map((c) => [c, box(false), box(false), L("conform fotografiilor anexate", "as per attached photos")]),
        ],
      },
      paragraphs: [],
    },
    {
      heading: L("5. INVENTAR SI ACCESORII PREDATE", "5. INVENTORY AND ACCESSORIES HANDED OVER"),
      table: {
        kind: "grid",
        widths: [0.6, 4, 0.8, 2, 3],
        rows: [[L("Nr.", "No."), L("Obiect / accesoriu", "Item / accessory"), L("Cant.", "Qty"), L("Stare", "Condition"), L("Observatii", "Remarks")], ...inventoryRows],
      },
      paragraphs: [],
      signaturesAfter: !isReturn,
    },
    ...(isReturn
      ? [{
          heading: L("SEMNATURI Predare", "SIGNATURES Handover"),
          table: sigTable([L("PREDAT DE", "HANDED OVER BY"), L("PROPRIETAR / LOCATOR", "OWNER / LESSOR"), ownerName], [L("PRIMIT DE", "RECEIVED BY"), L("CHIRIAS / LOCATAR", "RENTER / LESSEE"), renterName], L(`semnat la predare (PV ${rental.public_id}-P)`, `signed at handover (report ${rental.public_id}-P)`)),
          paragraphs: [],
        } as PvSection]
      : []),
    {
      heading: L("6. CONSTATAREA LA RESTITUIRE", "6. FINDINGS ON RETURN"),
      table: { kind: "kv", rows: returnRows },
      paragraphs: [],
      signaturesAfter: isReturn,
    },
    ...(!isReturn
      ? [{
          heading: L("SEMNATURI Restituire", "SIGNATURES Return"),
          table: sigTable([L("PREDAT DE", "HANDED OVER BY"), L("CHIRIAS / LOCATAR", "RENTER / LESSEE"), renterName], [L("PRIMIT DE", "RECEIVED BY"), L("PROPRIETAR / LOCATOR", "OWNER / LESSOR"), ownerName], L("se semneaza la restituire", "signed on return")),
          paragraphs: [],
        } as PvSection]
      : []),
    {
      heading: L("7. DECLARATII", "7. DECLARATIONS"),
      paragraphs: (lang === "en" ? PV_DECLARATIONS_EN : PV_DECLARATIONS).map((d, i) => [T(`${i + 1}. ${d}`)]),
    },
  ];

  const signatures: PvSignatureBlock = isReturn
    ? {
        heading: L("SEMNATURI Restituire", "SIGNATURES Return"),
        left: { action: L("PREDAT DE", "HANDED OVER BY"), role: L("CHIRIAS / LOCATAR", "RENTER / LESSEE"), party: "renter", name: renterName },
        right: { action: L("PRIMIT DE", "RECEIVED BY"), role: L("PROPRIETAR / LOCATOR", "OWNER / LESSOR"), party: "owner", name: ownerName },
      }
    : {
        heading: L("SEMNATURI Predare", "SIGNATURES Handover"),
        left: { action: L("PREDAT DE", "HANDED OVER BY"), role: L("PROPRIETAR / LOCATOR", "OWNER / LESSOR"), party: "owner", name: ownerName },
        right: { action: L("PRIMIT DE", "RECEIVED BY"), role: L("CHIRIAS / LOCATAR", "RENTER / LESSEE"), party: "renter", name: renterName },
      };

  return { title, subtitle, ownerName, renterName, headerTable, headerRuns, sections, signatures, todayLabel: today };
}
