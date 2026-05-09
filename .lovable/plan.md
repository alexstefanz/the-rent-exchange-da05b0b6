## Redesign pagina "Cum funcționează Rentli"

Refacere completă a `src/pages/HowItWorks.tsx` într-un ghid premium, mobile-first, care explică toate flow-urile noi (proces verbal digital, poze obligatorii, dispute, suport).

### Structură nouă a paginii (de sus în jos)

1. **Hero premium** — titlu nou ("Închiriază simplu, sigur și transparent"), subtitle, 2 CTA (Caută produse / Listează gratuit) și 4 trust badges sub hero (Plăți securizate, Utilizatori verificați, Proces verbal digital, Suport dedicat). Background subtil cu gradient orange/cream conform brand.

2. **Process Overview Timeline (10 pași)** — timeline orizontal pe desktop, vertical pe mobil, cu animații `animate-fade-in` staggerate, iconuri Lucide premium și conector colorat între pași. Pașii: Alegi produsul → Trimiți cererea → Proprietarul aprobă → Predare → **Proces verbal predare** → Folosire → Returnare → **Proces verbal returnare** → Finalizare → Review.

3. **Tabs "Pentru chiriași / Pentru proprietari"** — un singur component cu Tabs (shadcn) ce comută între cele două flow-uri detaliate (10 pași fiecare). Mai compact decât două secțiuni separate, evită scroll lung. Sub fiecare tab: o casetă "Bună de știut" care explică rolul pozelor în dispute.

4. **Proces verbal digital** (secțiune dedicată, nouă) — layout 2 coloane:
   - stânga: explicație + checklist (poze obligatorii predare/returnare, observații, timestamp, dovadă în dispute)
   - dreapta: card mock-up vizual cu mini-preview de 4 thumbnail-uri (placeholder), badge "Dovadă salvată automat" și pill cu timestamp
   
5. **Plăți & garanție** (refăcută) — card cu Lock icon, lista actualizată: plată securizată Stripe, fonduri blocate până la confirmare predare, payout după finalizare, politică anulări, dispute → blocare temporară.

6. **Comunicare în siguranță** (nouă) — card cu MessageSquare icon: chat în platformă, recomandare păstrare conversație, suport în dispute, marcare linkuri suspecte, trimitere poze.

7. **Suport & dispute** (nouă) — card cu LifeBuoy/Headphones icon: ticket suport, AI Assistant, analiză rezervare/timeline/chat/proces verbal, evaluare echipă.

8. **De ce este Rentli sigur?** — grid 7 carduri (Verificați, Proces verbal, Poze obligatorii, Plăți, Chat în platformă, Suport, Reviews) — refolosește style-ul existent de benefits.

9. **FAQ redesign** — 10 întrebări noi, cu:
   - Input search (filtrare client-side după întrebare/răspuns)
   - Tabs pe categorii: Toate / Chiriași / Proprietari / Plăți / Dispute
   - Accordion shadcn cu animație
   - Empty state când search-ul nu returnează nimic

10. **CTA final premium** — gradient bg, "Gata să începi?", două CTA-uri, text final.

11. **Sticky CTA mobil** — bară fixă jos (ascunsă pe desktop) cu "Caută produse" și "Listează gratuit", apare după scroll de hero.

### Detalii tehnice

- **Fișier principal**: refactor `src/pages/HowItWorks.tsx` (~600 linii → split în sub-componente).
- **Sub-componente noi în `src/components/how-it-works/`**:
  - `HeroSection.tsx`
  - `LifecycleTimeline.tsx` (10 pași, responsive horizontal/vertical)
  - `RoleFlowsTabs.tsx` (Tabs chiriași/proprietari)
  - `DigitalHandoverSection.tsx` (cu mock card)
  - `InfoCardSection.tsx` (reutilizabil pt Plăți, Chat, Suport)
  - `TrustGrid.tsx`
  - `FaqSection.tsx` (cu search + tabs + accordion)
  - `StickyMobileCta.tsx`
- **Copy bilingv**: extindere `src/data/uxCopy.ts` cu noua secțiune `howItWorksPage` (păstrăm cheile vechi unde se suprapun, adăugăm: `digitalHandover*`, `payments*`, `chat*`, `support*`, noile întrebări FAQ cu `category`, sticky CTA, etc.). Toate textele RO/EN.
- **Iconografie**: Lucide — `Search, Send, CheckCircle2, Truck, ClipboardCheck, Package, Undo2, FileCheck2, Trophy, Star, Lock, MessageSquare, ShieldCheck, Camera, Clock, AlertTriangle, LifeBuoy, Sparkles`.
- **Animații**: `animate-fade-in` staggerat pe timeline (delay via inline style), `hover-scale` pe CTA-uri, `accordion-down/up` pentru FAQ.
- **Tokens**: doar `primary`, `secondary`, `card`, `muted-foreground`, `border`, gradient `from-primary to-[#F98715]` (consistent cu codul existent). Border radius 12-16px, shadow `shadow-card`.
- **SEO**: `useSEO` cu titlu nou (<60 char) și meta description (<160 char), H1 unic în hero, breadcrumb păstrat.
- **Performance**: skeleton loaders nu sunt necesari (pagină statică); FAQ search e pur in-memory.
- **Mobile-first**: testat la 390px (viewport curent user); timeline vertical, tabs full width, sticky CTA jos cu `safe-area-inset-bottom`.

### Out of scope

- Modificări de DB / RLS / edge functions.
- Componente reale pentru proces verbal (folosim doar mock vizual).
- Modificări la pagina FAQ separată sau la centrul de suport.
