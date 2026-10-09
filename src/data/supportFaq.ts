export interface SupportFaqEntry {
  id: string;
  question: { ro: string; en: string };
  answer: { ro: string; en: string };
}

export const SUPPORT_FAQ: SupportFaqEntry[] = [
  {
    id: "cancel",
    question: {
      ro: "Cum anulez o rezervare?",
      en: "How do I cancel a reservation?",
    },
    answer: {
      ro: "Mergi la **Rezervările mele** → alege rezervarea → apasă **Anulează**. Reguli: **cu 24h+ înainte de start** = rambursare 100%. Sub 24h = prima zi și taxa platformei sunt nerambursabile. După predarea produsului = fără rambursare (folosește dispută sau contactează suportul). Excepție: dacă produsul nu corespunde descrierii, anunță-ne în 30 min de la preluare cu poze pentru rambursare integrală.",
      en: "Go to **My Rentals** → pick the reservation → tap **Cancel**. Rules: **24h+ before start** = 100% refund. Under 24h = first day and platform fee are non-refundable. After handover = no refund (use dispute or contact support). Exception: if the item doesn't match the listing, report it within 30 min of pickup with photos for a full refund.",
    },
  },
  {
    id: "refund",
    question: {
      ro: "Când primesc banii? (chiriaș & proprietar)",
      en: "When do I get my money? (renter & owner)",
    },
    answer: {
      ro: "**Chiriaș:** dacă rezervarea e anulată înainte de confirmare nu se reține nimic — autorizarea cardului expiră în 1-7 zile. La rambursări complete banii revin în 5-10 zile lucrătoare pe cardul de plată.\n\n**Proprietar:** după finalizarea închirierii (PV de returnare confirmat), suma intră în **portofelul** tău din Rentli. De acolo poți cere retragere oricând din **Câștigurile mele** — virarea se face în 1-3 zile lucrătoare.",
      en: "**Renter:** if cancelled before confirmation nothing is charged — the card hold expires in 1-7 days. Full refunds return in 5-10 business days to the original card.\n\n**Owner:** after the rental is finalised (return PV confirmed), the amount lands in your Rentli **wallet**. Request a payout anytime from **My Earnings** — bank transfer takes 1-3 business days.",
    },
  },
  {
    id: "handover",
    question: {
      ro: "Cum funcționează predarea și returnarea (PV digital)?",
      en: "How do pickup and return work (digital PV)?",
    },
    answer: {
      ro: "După confirmarea plății, proprietarul propune **locul și ora predării** din dashboard, iar chiriașul confirmă. La întâlnire, ambele părți completează **procesul verbal digital (PV)** direct în aplicație: **10 poze obligatorii** + observații. Același flux se repetă la returnare. Când ambii au semnat PV-ul, statusul trece automat la următoarea etapă (activ → finalizat). Primești notificare in-app, email și SMS la fiecare pas.",
      en: "After payment is confirmed, the owner proposes the **pickup time & place** from the dashboard, and the renter confirms. At the meeting, both parties fill in the **digital handover protocol (PV)** in the app: **10 mandatory photos** + notes. The same flow repeats at return. Once both have signed the PV, status moves automatically (active → completed). You get in-app, email and SMS notifications at every step.",
    },
  },
  {
    id: "fee",
    question: {
      ro: "Care e comisionul platformei?",
      en: "What is the platform fee?",
    },
    answer: {
      ro: "Rentli percepe **15%** din valoarea închirierii, suportat de proprietar. **Primele 3 închirieri sunt gratuite** pentru fiecare utilizator nou. Chiriașii nu plătesc niciun comision suplimentar.",
      en: "Rentli charges **15%** of the rental value, paid by the owner. **The first 3 rentals are free** for every new user. Renters pay no additional fees.",
    },
  },
  {
    id: "request",
    question: {
      ro: "Cum răspund la o cerere de închiriere?",
      en: "How do I respond to a rental request?",
    },
    answer: {
      ro: "Când primești o cerere, ai **24 de ore** să o accepți sau să o refuzi din **Închirierile mele** (sau direct din linkul primit pe SMS/email). Dacă nu răspunzi în acest interval, cererea expiră automat și autorizarea cardului chiriașului se eliberează. După acceptare, chiriașul finalizează plata și treceți împreună la programarea predării.",
      en: "When a request comes in, you have **24 hours** to accept or decline from **My Rentals** (or directly via the link in the SMS/email). If you don't respond, the request auto-expires and the renter's card hold is released. After you accept, the renter completes payment and you both move on to scheduling the pickup.",
    },
  },
  {
    id: "pv_dispute",
    question: {
      ro: "Ce fac dacă cealaltă parte nu completează procesul verbal?",
      en: "What if the other party doesn't complete the handover protocol?",
    },
    answer: {
      ro: "Dacă PV-ul rămâne blocat (cealaltă parte nu semnează predarea sau returnarea), poți **deschide o dispută** din pagina rezervării → **Deschide dispută**. Echipa Rentli intervine, analizează pozele și conversația din chat și decide următorul pas (deblocare PV, capturare/eliberare plată, rambursare parțială etc.).",
      en: "If the PV stays stuck (the other party won't sign pickup or return), you can **open a dispute** from the rental page → **Open dispute**. The Rentli team steps in, reviews photos and chat history, and decides the next step (unblock PV, capture/release payment, partial refund, etc.).",
    },
  },
  {
    id: "contact_rules",
    question: {
      ro: "De ce nu pot trimite număr de telefon sau email în chat?",
      en: "Why can't I send a phone number or email in chat?",
    },
    answer: {
      ro: "Pentru siguranța ta și acoperirea ofertei Rentli (dispute, rambursări), comunicarea trebuie să rămână **100% pe platformă**. Datele de contact directe (telefon, email, link-uri) sunt blocate automat în chat și anunțuri. După confirmarea unei rezervări active, contactul direct se deblochează automat în antetul conversației.",
      en: "For your safety and to keep Rentli's coverage active (disputes, refunds), all communication must stay **100% on-platform**. Direct contact details (phone, email, links) are auto-blocked in chat and listings. Once you have an active confirmed booking, direct contact unlocks automatically in the conversation header.",
    },
  },
];