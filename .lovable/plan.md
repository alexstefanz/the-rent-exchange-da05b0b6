## Modificări

### 1. `src/components/product/OwnerTrustCard.tsx`
Elimină blocul `{!isOwnProduct && (<div className="mt-5 flex gap-2">...)}` (liniile 80-90) — scoate butoanele "Trimite mesaj" și "Vezi profil". Elimină și prop-urile/importurile devenite inutile (`onStartChat`, `Link`, `Button`).

### 2. `src/pages/ProductDetail.tsx`
- Linia 328: șterge `{!isOwnProduct && <QuickQuestionsChips onAsk={handleQuickQuestion} />}`.
- Linia 26: șterge importul `QuickQuestionsChips`.
- Șterge prop-ul `onStartChat={...}` transmis către `<OwnerTrustCard />` (linia 319+).
- Curăță `handleQuickQuestion` și `handleStartChat` dacă nu mai sunt folosite în altă parte (verific înainte).

### 3. `src/components/product/QuickQuestionsChips.tsx`
Șterge fișierul (nu mai e referit).

## Verificare
- Pagina produs nu mai afișează butoanele "Trimite mesaj" / "Vezi profil" în card-ul proprietarului și nici card-ul "Întrebări rapide".
- Restul card-ului (avatar, statistici, rating, KYC) rămâne identic.
- Mobile sticky bar (`MobileStickyBookingBar` cu `onAsk`) — verific dacă mai are nevoie de butonul "Întreabă" sau îl elimin pentru consistență.
