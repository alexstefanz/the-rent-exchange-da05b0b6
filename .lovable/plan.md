## Obiectiv

În wizardul de publicare (creare + editare), adaug butonul **„Previzualizează anunțul"** care deschide într-un tab nou pagina reală a anunțului, completă, cu un banner sus „Previzualizare — anunțul nu e încă vizibil public" (RO/EN).

## Componente noi / modificate

### 1. `src/pages/ProductPreview.tsx` (nou)
- Rută dedicată: `/publica/previzualizare`.
- Citește draftul din `sessionStorage` (cheia `publish:preview`) pus de wizard chiar înainte de `window.open`.
- Construiește un obiect `Product` sintetic din `PublishFormData` (folosind aceleași câmpuri ca în `LivePreviewCard` + restul: descriere, included_items, usage_rules, deposit, pickup, delivery, blocked_dates etc.).
- Randează exact aceeași compoziție ca `ProductDetail` (gallery, title, accordion, owner card, location, booking card sticky) — extragem partea de „render" din `ProductDetail` într-un sub-component reutilizabil **sau** mai simplu: importăm direct componentele copil deja existente (`ProductImageGallery`, `PremiumBookingCard`, `OwnerTrustCard`, `ProductInfoAccordion`, `SocialProofStrip`, `LocationCard`) și replicăm layoutul minim (fără realtime, fără favorite, fără chat — toate butoanele disable-uite cu tooltip „Disponibil după publicare").
- Pune `useSEO({ noindex: true })` ca să nu fie indexat.
- Dacă nu există draft în sessionStorage, redirect la `/owner`.

### 2. `src/components/product/PreviewBanner.tsx` (nou)
- Banner sticky sus (sub navbar): icon `Eye` + text bilingv:
  - RO: „Previzualizare — anunțul nu este încă publicat. Doar tu vezi această pagină."
  - EN: „Preview — this listing isn't published yet. Only you can see this page."
- Buton dreapta: „Închide previzualizarea" → `window.close()` (fallback `navigate(-1)`).
- Stil: bg `primary/10`, border-bottom `primary/20`, text `foreground`. Folosit atât în `ProductPreview` cât și în `ProductDetail` când URL-ul are `?preview=1` (pentru edit mode, vezi mai jos).

### 3. `src/pages/ProductDetail.tsx`
- Citește `useSearchParams().get("preview") === "1"`.
- Când `isPreview` e true și user-ul e owner-ul, randează `<PreviewBanner />` sus, indiferent de `approval_status` (banner-ul existent „pending/rejected" rămâne pentru cazurile fără `?preview`).
- Setează `useSEO({ noindex: true })` când `isPreview`.

### 4. `src/components/publish/PublishTopBar.tsx`
- Adaug prop `onPreview?: () => void` și un buton „Previzualizează" (icon `Eye`) între statusul de salvare și butoanele de exit (vizibil pe md+; pe mobile devine icon-only).
- Disable cu tooltip dacă `!canPreview` (transmis prin prop boolean) — minim trebuie titlu + cel puțin o imagine + categorie.

### 5. `src/components/publish/PublishWizard.tsx`
- Adaug handler `handlePreview`:
  - **Edit mode** (avem `initialProduct?.slug` sau `id`): `window.open(`${getProductUrl(initialProduct)}?preview=1`, "_blank")`.
  - **Create mode**: serializez `data` curent + `feePercent` în `sessionStorage.setItem("publish:preview", JSON.stringify({ data, feePercent, ownerId: user.id, savedAt: Date.now() }))`, apoi `window.open("/publica/previzualizare", "_blank")`.
- `canPreview = !!data.title && !!data.category && data.images.length > 0` (același minim ca pentru `LivePreviewCard` să arate ceva real).
- Pasez `onPreview` și `canPreview` în `<PublishTopBar />`.
- Opțional: și un buton secundar „Previzualizează" în Step 5 (Summary), lângă „Publică", pentru descoperire mai bună — folosește același handler.

### 6. `src/App.tsx`
- Adaug ruta `/publica/previzualizare` → `<ProductPreview />` (lazy import), între rutele existente de publicare.

### 7. `src/data/uxCopy.ts`
- Adaug chei sub `publish.preview.*` (RO/EN):
  - `previewCta`: „Previzualizează anunțul" / „Preview listing"
  - `previewDisabledHint`: „Adaugă titlu, categorie și o imagine pentru a previzualiza" / „Add title, category and one image to preview"
  - `previewBannerTitle`, `previewBannerSubtitle`, `previewClose`.

## Note tehnice

- Nu modific RLS / DB / edge functions — totul e frontend.
- `ProductPreview` nu face niciun call în DB pentru produs (totul vine din sessionStorage); doar profilul ownerului poate fi încărcat pentru `OwnerTrustCard` printr-un `get_product_owner_public_info(user.id)`.
- Booking-card-ul în preview e read-only: butonul „Rezervă" disabled cu tooltip „Disponibil după publicare".
- `?preview=1` în edit mode reutilizează randarea existentă din `ProductDetail`, deci e zero risc de divergență față de pagina reală.
- SEO: `noindex,follow` activ în preview ca să nu fie crawl-uit accidental.
