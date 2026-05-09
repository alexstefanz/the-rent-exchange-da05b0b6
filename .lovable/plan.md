## Obiectiv

Când o închiriere ajunge în statusul **Finalizat**, butonul „Lasă un review" din `NextActionCard` (dashboard) trebuie să deschidă un dialog unic care permite utilizatorului să lase **două review-uri într-un singur flux**:

1. **Review produs** (multi-criteriu) — se salvează în `product_reviews`
2. **Review utilizator** (proprietar sau chiriaș, după caz) — se salvează în `user_reviews`

Astfel, atât proprietarul cât și chiriașul își pot evalua reciproc partenerul de tranzacție direct din lista de închirieri, fără să mai navigheze pe pagina produsului.

## Comportament dorit

- Butonul „Lasă un review" apare DOAR la rentals cu `status = 'completed'` (deja se întâmplă, e step 7 în `NextActionCard`).
- La click se deschide `LeaveReviewDialog` (NU mai face navigate la `/produs/...#review`).
- Dialogul detectează automat rolul curentului user în acel rental:
  - dacă userul = `renter_id` → review-ul e DESPRE proprietar (`review_type='owner'` în `product_reviews` + rating user pe owner în `user_reviews`)
  - dacă userul = `owner_id` → review-ul e DESPRE chiriaș (`review_type='renter'` în `product_reviews` + rating user pe renter în `user_reviews`)
- Dialogul are 2 secțiuni vizibile pe același ecran (scrollabile pe mobil):
  - **Despre produs / experiență** — 3 criterii (Stare produs / Comunicare / Punctualitate) + comentariu opțional 500 ch
  - **Despre [Nume contraparte]** — 1 stea generală 1–5 + comentariu opțional 500 ch
- Un singur buton „Trimite review" → execută INSERT în ambele tabele secvențial; dacă prima reușește și a doua eșuează, afișează toast cu eroare doar pentru ce nu a mers (idempotent — vezi mai jos).
- După succes:
  - toast „Mulțumim pentru feedback!"
  - invalidează queries `accountDashboard` și `userReviews` ca să dispară CTA-ul step 7 / să apară noile review-uri pe profilul contrapartidei.
- Dacă userul a lăsat deja review (verificat la deschiderea dialogului), afișează stare read-only: „Ai lăsat deja un review pentru această închiriere" + steluțele date, fără buton de submit.

## Detecție „deja review-uit"

Tabelele NU au `rental_id`. Dedup-ul se face pe combinația naturală existentă:

- `product_reviews`: `(reviewer_id = me, product_id = rental.product_id, review_type = roleAppropriate)` → există deja
- `user_reviews`: `(reviewer_id = me, reviewed_user_id = counterparty)` → există deja

Dacă AMBELE există, ascundem complet butonul (înlocuim cu badge „Review trimis ✓"). Dacă doar una există (ex: a făcut deja review pe produs dintr-o închiriere anterioară), pre-bifăm acea secțiune ca read-only și permitem doar submitul celei lipsă.

## Schimbări de cod (frontend-only, fără DB)

### Fișiere noi
- `src/components/dashboard/LeaveReviewDialog.tsx` (~250 linii) — dialog cu 2 secțiuni, logica de fetch existing reviews, submit dual, stare loading/disabled.

### Fișiere modificate
- `src/components/dashboard/RentalsTab.tsx` — `onLeaveReview` deschide dialogul (state local `reviewRental`), randează `<LeaveReviewDialog>` la finalul tab-ului. Trece `currentUserRole="renter"`.
- `src/components/dashboard/RentalsOutTab.tsx` — același pattern, dar cu `currentUserRole="owner"` (în prezent owner-ul vede butonul, dar îl trimite pe propriul produs unde `isOwnProduct=true` blochează formularul → bug rezolvat colateral).
- `src/components/dashboard/NextActionCard.tsx` — neschimbat (callback-ul `onLeaveReview` rămâne).

### Texte (RO + EN, prin `useLanguage()`)
- Titlu dialog: „Lasă un review" / „Leave a review"
- Subtitlu: „Părerea ta ajută comunitatea Rentli."
- Section 1 header: „Despre produs" / „About the product"
- Section 2 header: „Despre {full_name}" / „About {full_name}"
- Buton: „Trimite review" / „Submit review"

### Reutilizare logică
- Refolosim `createProductReview` din `productReviewsApi.ts` și `createUserReview` din `reviewsApi.ts` — nu duplicăm.
- Trigger-ele de notificare email/in-app se vor declanșa automat (există deja în ambele funcții).

## Out of scope

- NU se modifică tabele, RLS sau RPC-uri.
- NU se schimbă pagina `ProductDetail` / `ProductReviewsSection` — rămâne ca punct secundar de intrare pentru review-uri vechi.
- NU se adaugă coloană `rental_id` la review-uri (ar fi îmbunătățire, dar e schimbare DB nesolicitată).
