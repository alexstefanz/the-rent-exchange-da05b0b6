## Mutare bloc "Anulare gratuită"

Mut blocul de anulare gratuită din `BookingCard` (de sub calendar) sub poza produsului în pagina de produs.

### Modificări

1. **`src/components/product/BookingCard.tsx`**
   - Elimin blocul `<div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">...Anulare gratuită...</div>` plasat sub calendar/breakdown.
   - Restul cardului (preț, calendar, breakdown, CTA) rămâne neschimbat.

2. **`src/components/product/FreeCancellationNotice.tsx`** (nou)
   - Componentă mică reutilizabilă cu același conținut bilingv (RO/EN), iconiță `ThumbsUp` în cerc `bg-primary/10`, link către `/politica-anulare`.
   - Folosește `useLanguage` pentru text.

3. **`src/pages/ProductDetail.tsx`**
   - Import `FreeCancellationNotice`.
   - Mobile (după `<ProductImageGallery variant="mobile" ... />` la linia 234): adaug `<div className="lg:hidden px-[10px] mt-3"><FreeCancellationNotice /></div>`.
   - Desktop (în coloana stângă, imediat după `<ProductImageGallery variant="desktop" ... />` la linia 254): adaug `<FreeCancellationNotice />` (apare ca un card separat, înainte de `OwnerSectionWithStats`).

Rezultat: mesajul de anulare gratuită apare imediat sub poza produsului atât pe desktop cât și pe mobile, iar booking card-ul devine mai compact.