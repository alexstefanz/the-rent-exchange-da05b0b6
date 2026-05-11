
# Redesign premium „Adaugă produs / Creează anunț"

Transformăm `NewProduct.tsx` și `EditProduct.tsx` dintr-un formular CRUD vertical într-o experiență ghidată multi-step inspirată din Airbnb Host / Turo / Booking host setup, cu live preview, smart uploader, draft autosave, AI description, quality score și câmpuri noi (garanție, livrare, durată minimă, stare produs, reguli, calendar blocări).

## Arhitectură & rute

- O singură pagină nouă `src/pages/PublishProduct.tsx` care servește atât crearea (`/anunt-nou`) cât și editarea (`/produs/:slug/editeaza`). Rutele rămân, dar componentele actuale `NewProduct.tsx` și `EditProduct.tsx` devin wrappere subțiri care randează `<PublishWizard mode="create|edit" />`.
- Layout full-screen (fără Navbar standard) cu top bar minimal: logo Rentli, status draft („Salvat acum 3s"), buton „Salvează și ieși", buton „Renunță". Mai aproape de Airbnb host flow decât de admin form.

## Multi-step flow (6 pași)

```text
1. Categorie  →  2. Detalii   →  3. Foto & video  →  4. Locație
                                                        ↓
                            6. Review & publicare  ←  5. Preț, disponibilitate, reguli
```

Stepper modern sus pe desktop (numerotat + label, progres orange), bottom progress bar pe mobil. Tranziții smooth (framer-motion fade+slide). Fiecare pas are:
- titlu mare + subtitlu explicativ („Hai să începem cu ce închiriezi")
- formular focus pe ~3-5 câmpuri max
- CTA jos: „Înapoi" + „Continuă" (sticky pe mobil, full width)
- validare inline soft (verde check / orange hint), nu erori roșii agresive

### Pas 1 — Categorie
- Grid de cards cu iconuri Lucide (cele 12 grupuri din `platform_categories`)
- Search instant pe categorii și subcategorii
- După selecția categoriei → chips orizontale cu subcategorii
- Recomandare: „Cele mai populare în această categorie: …"

### Pas 2 — Detalii produs
- Titlu (helper: „Ex: Bicicletă MTB Trek 29 inch, full suspension")
- Descriere îmbunătățită:
  - Helper prompts ca chips: „Ce include", „Compatibilitate", „Dimensiuni", „Condiții utilizare" → click adaugă secțiune cu placeholder
  - Buton „Generează cu AI" (Lovable AI Gateway, gemini-3-flash-preview) — primește titlu + categorie + imagini și returnează draft RO
  - Counter caractere + quality hint „Adaugă încă 80 caractere pentru un anunț excelent"
- Stare produs (radio cards): Nou / Foarte bun / Bun / Cu urme de utilizare
- Accesorii incluse (chips list-builder, păstrăm UX-ul actual, dar cu pill input modern)
- Reguli utilizare (multi-select chips: „Doar interior", „Fără apă", „Fără animale", „Doar uz personal", „Permis profesional", + custom)
- Serial number (opțional, ascuns sub „Detalii avansate", marcat „Vizibil doar adminului")
- Validare anti-contact: blochează pe blur cu hint contextual sub câmp („Comunicarea se face doar prin Rentli — am detectat un număr de telefon")

### Pas 3 — Foto & video (Smart Media Uploader)
Component nou `src/components/publish/SmartMediaUploader.tsx`:
- Drag & drop zonă mare cu iconografie premium
- Grid 3×N de slot-uri cu prima cu overlay „Cover anunț"
- Drag-to-reorder (`@dnd-kit` deja folosit indirect? altfel `react-sortable-dnd` light sau implementare HTML5 nativ)
- Per imagine: progress bar upload, buton remove, buton „Setează ca cover", indicator size/dim
- Detectare blur (canvas + Laplacian variance simplu) → badge orange „Imagine ușor neclară"
- Reuse compresie existentă din `ImageUpload.tsx` (Canvas, max 1920px, JPEG 0.8)
- Crop modal cu `react-easy-crop` (lib nouă) doar la cerere (buton „Decupează")
- Mesaj clar sus: „Prima imagine va fi cover-ul anunțului"
- Min 3, recomandat 6, max 10 (creștem de la 5 la 10)

### Pas 4 — Locație
- Județ (combobox cu search) → Localitate (combobox dependent, Command/Popover, nu Select)
- Hartă mică (Leaflet — verificăm dacă e deja instalat; dacă nu, fallback iframe OpenStreetMap fără lib nouă) cu pin draggable centrat pe localitate
- Coordonate `pickup_lat`, `pickup_lng` salvate
- Adresa exactă opțională, sub disclosure: „Adresa exactă va fi comunicată chiriașului doar după confirmarea rezervării"
- Toggle: „Acest produs poate fi livrat?" → dezvăluie:
  - Cost livrare (RON)
  - Rază maximă (km)
  - Toggle „Ridicare personală disponibilă"

### Pas 5 — Preț, disponibilitate, reguli
- Smart pricing card:
  - Input preț pe zi
  - Live breakdown: „Tu primești X RON / zi", „Clientul plătește Y RON / zi", „Comision Rentli: Z%" (păstrăm logica existentă cu primele 3 anunțuri 0%)
  - Estimare câștig lunar: „La 8 zile închiriate/lună → ~X RON" (mic disclaimer)
  - Benchmark: „Produse similare în [categorie] se închiriază între A–B RON/zi" (RPC nouă `get_similar_pricing(category, subcategory)` care returnează percentile 25/75 din `daily_price_owner`)
- Garanție / depozit (radio): „Fără garanție" / „Sumă fixă (RON)" / „Procent din valoarea rezervării"
- Durată minimă (chip select): 1 zi / weekend / 3 zile / 7 zile / custom
- Disponibilitate calendar (`react-day-picker`, deja prezent):
  - Multi-select zile blocate
  - Toggle „Disponibil imediat" → adaugă badge pe anunț
- Toate câmpurile noi sunt opționale, cu default-uri sigure

### Pas 6 — Review & publicare
- Două coloane: stânga = checklist + earnings estimate, dreapta = preview final identic cu cardul real
- Quality score 0–100 (calculat client-side):
  - +20 titlu ≥ 20 char
  - +20 descriere ≥ 150 char
  - +20 ≥ 6 imagini
  - +10 stare produs setată
  - +10 reguli setate
  - +10 disponibilitate completată
  - +10 locație cu pin pe hartă
  - Bar orange + sugestii actionable: „Adaugă încă 2 imagini pentru +10 puncte"
- Recap pe secțiuni cu buton „Editează" lângă fiecare → întoarce direct la pasul respectiv
- CTA principal `Publică anunțul` mare, full-width pe mobile, cu sublabel „Anunțul va fi verificat de echipa Rentli (~2h)"
- După publish: pagina post-publish (vezi mai jos)

## Live preview

Component nou `src/components/publish/LivePreviewCard.tsx`:
- Desktop (≥ lg): coloană dreaptă sticky 380px, randează preview-ul cardului real (cover + titlu + preț + locație + categorie + badge-uri „Disponibil imediat", „Stare: Nou", „Livrare disponibilă")
- Mobil/Tablet: collapsible „Vezi cum arată anunțul" sus, sheet bottom cu același preview
- Update în timp real cu `react-hook-form` watch

## Draft system

- Tabel nou `product_drafts` (vezi DB section)
- Hook `useProductDraft()` cu debounce 1.5s autosave, status indicator în topbar:
  - „Se salvează…" (orange spinner) → „Salvat acum X" → „Toate modificările salvate"
- La intrare în `/anunt-nou`: dacă există draft activ → modal „Continuă unde ai rămas?" cu opțiune „Începe de la zero" (șterge draftul)
- Draft șters automat la publish reușit
- Recovery cross-device deoarece e server-side cu RLS pe owner

## Post-publish experience

Pagina nouă (sau full-screen state) `PublishSuccess`:
- Animație confetti subtilă (framer-motion, fără lib nouă)
- Card mare cu preview anunț live
- 4 acțiuni mari: „Vezi anunțul" / „Distribuie" (Web Share API + copy link) / „Editează" / „Boost listing" (placeholder, deschide ticket / coming soon)
- Section „Următorii pași": completează profilul, verifică KYC dacă lipsește, instalează app PWA
- Mini „Statistici după publicare" (placeholder vizual cu skeleton — analytics reale ulterior)

## Mobile-first detalii

- Sticky bottom bar cu CTA „Continuă" + buton small „Înapoi"
- Inputuri 48px min-height, font-size 16px (no zoom iOS)
- Accordion / collapsible pentru secțiunile opționale ale fiecărui pas
- Touch targets min 44px
- Map step → bottom sheet pentru hartă pe mobil

## Validare premium

- React Hook Form + Zod (deja folosite)
- Validare inline pe blur, nu pe fiecare keypress
- Hint-uri contextuale verzi/orange (nu roșii) până la submit
- Erorile roșii apar doar când userul încearcă „Continuă" pe câmp invalid
- Reuse `containsContactInfo` din `src/lib/inputValidation.ts`

## DB — toate câmpurile noi într-un singur shot

Migrare `add_product_publishing_fields`:

```sql
-- 1. Coloane noi pe products
ALTER TABLE public.products
  ADD COLUMN condition           text,            -- 'new' | 'very_good' | 'good' | 'used'
  ADD COLUMN deposit_type        text DEFAULT 'none',  -- 'none' | 'fixed' | 'percent'
  ADD COLUMN deposit_value       numeric(10,2),
  ADD COLUMN min_rental_days     integer DEFAULT 1,
  ADD COLUMN min_rental_preset   text,            -- '1_day' | 'weekend' | '3_days' | '7_days' | 'custom'
  ADD COLUMN delivery_available  boolean DEFAULT false,
  ADD COLUMN delivery_fee        numeric(10,2),
  ADD COLUMN delivery_radius_km  integer,
  ADD COLUMN pickup_available    boolean DEFAULT true,
  ADD COLUMN pickup_lat          numeric(9,6),
  ADD COLUMN pickup_lng          numeric(9,6),
  ADD COLUMN usage_rules         text[] DEFAULT '{}'::text[],
  ADD COLUMN serial_number       text,            -- vizibil doar adminului via RLS
  ADD COLUMN available_immediately boolean DEFAULT true,
  ADD COLUMN blocked_dates       date[] DEFAULT '{}'::date[],
  ADD COLUMN quality_score       integer DEFAULT 0;

-- 2. Tabel product_drafts
CREATE TABLE public.product_drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES public.products(id) ON DELETE CASCADE, -- null = create draft
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  step        integer NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own drafts" ON public.product_drafts
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins read drafts" ON public.product_drafts
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- 3. RPC pentru benchmark preț similar
CREATE OR REPLACE FUNCTION public.get_similar_pricing(p_category text, p_subcategory text)
RETURNS TABLE(p25 numeric, p50 numeric, p75 numeric, sample_size int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    percentile_cont(0.25) WITHIN GROUP (ORDER BY daily_price_owner)::numeric,
    percentile_cont(0.5)  WITHIN GROUP (ORDER BY daily_price_owner)::numeric,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY daily_price_owner)::numeric,
    count(*)::int
  FROM public.products
  WHERE is_active = true
    AND approval_status = 'approved'
    AND deleted_at IS NULL
    AND category = p_category
    AND (p_subcategory IS NULL OR subcategory = p_subcategory);
$$;

-- 4. View pentru a ascunde serial_number de la non-admin (sau gestionat în SELECT din apiClient)
```

`serial_number` rămâne în tabel; îl filtrăm în query-urile publice (`productsApi.ts`) și-l includem doar în query-urile admin / owner.

## Edge function nouă

`supabase/functions/generate-product-description/index.ts`:
- Input: `{ title, category, subcategory, condition, included_items, images? }`
- Apelează Lovable AI Gateway (`google/gemini-3-flash-preview`) cu prompt structurat RO
- Returnează `{ description: string }` (max 600 chars)
- Rate limit per user (3/min) prin tabel existent sau check simplu pe `created_at` în `notification_audit_log` analog
- `verify_jwt` activ (default), citim `auth.uid()` din header

## Fișiere noi (sumar)

- `src/pages/PublishProduct.tsx` (wrapper)
- `src/components/publish/PublishWizard.tsx` (orchestrator)
- `src/components/publish/PublishStepper.tsx`
- `src/components/publish/PublishTopBar.tsx`
- `src/components/publish/LivePreviewCard.tsx`
- `src/components/publish/SmartMediaUploader.tsx`
- `src/components/publish/QualityScoreCard.tsx`
- `src/components/publish/PriceBenchmarkCard.tsx`
- `src/components/publish/AvailabilityCalendar.tsx`
- `src/components/publish/MapPicker.tsx`
- `src/components/publish/PublishSuccess.tsx`
- `src/components/publish/steps/Step1Category.tsx` … `Step6Review.tsx`
- `src/hooks/useProductDraft.ts`
- `src/lib/qualityScore.ts`
- `src/features/publish/draftsApi.ts`
- `src/features/publish/aiDescriptionApi.ts`
- `src/features/publish/pricingBenchmarkApi.ts`
- `supabase/functions/generate-product-description/index.ts`
- 1 migrare DB

## Fișiere modificate

- `src/pages/NewProduct.tsx` → wrapper `<PublishWizard mode="create" />`
- `src/pages/EditProduct.tsx` → wrapper `<PublishWizard mode="edit" productSlug={...} />`
- `src/features/products/productsApi.ts` → `createProduct`/`updateProduct` acceptă noile câmpuri; query-urile publice exclud `serial_number`
- `src/components/product/BookingCard.tsx` / `PremiumBookingCard.tsx` → afișează badge „Disponibil imediat", min rental days, garanție, opțiune livrare
- `src/components/product/LocationCard.tsx` → folosește `pickup_lat/lng` dacă există
- `src/integrations/supabase/types.ts` se regenerează automat după migrare

## Out-of-scope (iterații viitoare)

- Boost listing real (acum doar placeholder UI)
- Analytics post-publish reale
- Video upload (uploaderul suportă structural, dar fără transcoding)
- Validare blur cu ML (folosim doar Laplacian basic)
