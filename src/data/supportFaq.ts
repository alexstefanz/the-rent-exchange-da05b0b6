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
      ro: "Mergi la **Rezervările mele** → alege rezervarea → apasă **Anulează**. Anulare gratuită cu cel puțin 48h înainte de începerea închirierii (rambursare 100%). Sub 48h se rambursează 50%. După ce începe perioada nu se mai acordă rambursare.",
      en: "Go to **My Rentals** → pick the reservation → tap **Cancel**. Free cancellation at least 48h before the rental starts (100% refund). Under 48h, 50% is refunded. No refund once the rental period has started.",
    },
  },
  {
    id: "refund",
    question: {
      ro: "Când primesc banii înapoi?",
      en: "When do I get my money back?",
    },
    answer: {
      ro: "Pentru rezervările anulate înainte de confirmare nu se reține nimic — autorizarea cardului expiră în 1-7 zile. Pentru returnări complete, banii revin în 5-10 zile lucrătoare în contul de pe care s-a făcut plata.",
      en: "For reservations cancelled before confirmation nothing is charged — the card hold expires in 1-7 days. For full refunds, the amount returns in 5-10 business days to the original card.",
    },
  },
  {
    id: "deposit",
    question: {
      ro: "Cum funcționează garanția (depozitul)?",
      en: "How does the security deposit work?",
    },
    answer: {
      ro: "Garanția nu e încasată — e doar **pre-autorizată** pe card. Dacă produsul revine în starea inițială, blocajul se eliberează automat. Dacă există daune, se rețin doar costurile dovedite cu poze și factură.",
      en: "The deposit isn't charged — it's only **pre-authorized** on your card. If the item is returned in original condition, the hold is released automatically. Damages are deducted only with photo proof and invoice.",
    },
  },
  {
    id: "handover",
    question: {
      ro: "Cum confirm predarea sau returnarea?",
      en: "How do I confirm pickup or return?",
    },
    answer: {
      ro: "Atât proprietarul cât și chiriașul trebuie să facă **10 poze** la predare și 10 la returnare, direct din aplicație. Apoi apasă **Confirmă predarea/returnarea** pentru a debloca următoarea fază.",
      en: "Both owner and renter must take **10 photos** at pickup and 10 at return, directly in the app. Then tap **Confirm pickup/return** to unlock the next phase.",
    },
  },
  {
    id: "fee",
    question: {
      ro: "Care e comisionul platformei?",
      en: "What is the platform fee?",
    },
    answer: {
      ro: "Rentli percepe **5%** din valoarea închirierii, suportat de proprietar. **Primele 3 închirieri sunt gratuite** pentru fiecare utilizator nou. Chiriașii nu plătesc niciun comision suplimentar.",
      en: "Rentli charges **5%** of the rental value, paid by the owner. **The first 3 rentals are free** for every new user. Renters pay no additional fees.",
    },
  },
];