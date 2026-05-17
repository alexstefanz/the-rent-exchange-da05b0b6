import { format } from "date-fns";
import type { RentalFullDetail } from "@/features/rentals/rentalDetailPageApi";

/**
 * Shared helpers + content builders for the Proces-Verbal (handover/return).
 * Used by the in-dialog rendered document, the PDF generator (jsPDF) and the
 * DOCX exporter so all three stay in sync.
 */

// TODO: replace fakeIdentity with real KYC data once available.
export function fakeIdentity(seed: string | null | undefined) {
  const s = (seed || "00000000").replace(/[^a-f0-9]/gi, "");
  const h = (offset: number, len: number, mod: number) => {
    let n = 0;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i) + offset) >>> 0;
    return String(n % mod).padStart(len, "0");
  };
  const cnp = `1${h(1, 2, 100)}${h(2, 2, 12).padStart(2, "0")}${h(3, 2, 28).padStart(2, "0")}${h(4, 6, 1000000)}`;
  const seriiCI = ["RR", "RX", "RT", "RK", "RD", "RZ"];
  const serie = seriiCI[parseInt(h(5, 1, 6), 10) || 0];
  const nr = h(6, 6, 1000000);
  const strazi = ["Florilor", "Mihai Eminescu", "Aviatorilor", "Stefan cel Mare", "Unirii", "Victoriei"];
  const strada = strazi[parseInt(h(7, 1, 6), 10) || 0];
  const nrCasa = parseInt(h(8, 2, 99), 10) || 1;
  const sector = parseInt(h(9, 1, 6), 10) || 1;
  const adresa = `Str. ${strada} nr. ${nrCasa}, Bucuresti, Sector ${sector}`;
  return { cnp, serie, nr, adresa };
}

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

export function buildPvContent(rental: RentalFullDetail, phase: "handover" | "return"): PvContent {
  const today = format(new Date(), "dd MMMM yyyy");
  const ownerId = fakeIdentity(rental.owner_id);
  const renterId = fakeIdentity(rental.renter_id);
  const ownerName = rental.owner_name || "Proprietar";
  const renterName = rental.renter_name || "Chirias";
  const ownerPhone = rental.owner_phone || "0740 000 000";
  const renterPhone = rental.renter_phone || "0740 000 000";
  const ownerEmail = rental.owner_email || "owner@rentli.ro";
  const renterEmail = rental.renter_email || "renter@rentli.ro";

  const title = phase === "handover" ? "PROCES-VERBAL DE PREDARE-PRIMIRE" : "PROCES-VERBAL DE RETURNARE";

  const intro =
    `Incheiat astazi, ${today}, intre domnul/doamna ${ownerName}, in calitate de Predator (proprietar), ` +
    `identificat cu CNP ${ownerId.cnp}, CI seria ${ownerId.serie} nr. ${ownerId.nr}, domiciliat in ${ownerId.adresa}, ` +
    `telefon ${ownerPhone}, email ${ownerEmail}, si domnul/doamna ${renterName}, in calitate de Primitor (chirias/utilizator), ` +
    `identificat cu CNP ${renterId.cnp}, CI seria ${renterId.serie} nr. ${renterId.nr}, domiciliat in ${renterId.adresa}, ` +
    `telefon ${renterPhone}, email ${renterEmail}.`;

  const cat = rental.product_category || "-";
  const object =
    `Prin prezentul proces-verbal, Predatorul preda, iar Primitorul primeste spre utilizare temporara, ` +
    `prin intermediul platformei de renting peer-to-peer Rentli, urmatorul bun: ${rental.product_title || "-"}, ` +
    `din categoria ${cat}, pentru o perioada de ${rental.rental_days} zile, cu costul total de ${rental.subtotal} lei ` +
    `(${rental.daily_price} lei/zi) si o garantie de ${rental.product_deposit_value ?? 0} lei.`;

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
    ? "Primitorul declara ca a verificat bunul si il accepta in starea mentionata, obligandu-se sa il utilizeze conform destinatiei sale, sa il pastreze in bune conditii si sa il returneze la termenul stabilit, in aceeasi stare, cu exceptia uzurii normale. Primitorul isi asuma raspunderea pentru orice deteriorare, pierdere sau furt survenite pe perioada utilizarii si se obliga sa notifice imediat Predatorul in cazul aparitiei unor defecte sau incidente."
    : "Primitorul restituie bunul catre Predator, iar Predatorul confirma primirea acestuia in starea documentata prin fotografiile anexate. Eventualele daune constatate la momentul returnarii vor fi reglementate prin intermediul platformei Rentli, conform termenilor si conditiilor agreate.";

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