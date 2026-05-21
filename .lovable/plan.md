# Mutare "Anulare gratuită" în cardul "Reguli de utilizare"

## Ce se schimbă

1. **`src/components/product/UsageRules.tsx`**
   - Adaug o regulă nouă în `defaultRules` cu iconița `ThumbsUp` și titlul "Anulare gratuită" / "Free cancellation".
   - Descrierea preia textul din `FreeCancellationNotice` (RO/EN), inclusiv linkul către `/politica-anulare`.
   - Pentru a păstra linkul activ, schimb tipul `description` din `string` în `React.ReactNode` (sau adaug un câmp opțional `descriptionNode`). Renderul rămâne identic vizual.
   - O plasez prima în listă, ca să fie vizibilă imediat la deschiderea acordeonului "Reguli & politici".

2. **`src/pages/ProductDetail.tsx`**
   - Elimin cele două instanțe `<FreeCancellationNotice />` (mobile la linia ~275 și desktop la linia ~335) plus importul.
   - Nu mai e nevoie de wrapper-ul mobil `<div className="lg:hidden px-[10px] mt-3">`.

3. **`src/components/product/FreeCancellationNotice.tsx`**
   - Rămâne în repo (nu îl șterg) în caz de reutilizare, dar nu mai e folosit nicăieri. Dacă preferi, îl pot șterge — spune-mi.

## Rezultat

Cardul independent "Anulare gratuită" dispare de pe pagina produs (mobile + desktop). Conținutul apare ca primă intrare în secțiunea "Reguli & politici" din `ProductInfoAccordion`, în același stil ca celelalte reguli (icon rotund portocaliu + titlu + descriere + link "politica de anulare").
