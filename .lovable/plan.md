
# Plan: Traducere Completa RO/EN a Platformei

## Problema
Language switcher-ul schimba limba in context, dar majoritatea textelor din aplicatie sunt hardcoded in romana. Fisierul centralizat `uxCopy.ts` contine doar texte in romana, iar paginile principale (Index, ProductDetail, Checkout, Categories, Auth, Footer, Search, etc.) nu folosesc deloc functia `t()`.

## Solutia

### Pas 1: Restructurare `uxCopy.ts` cu suport bilingv
Voi transforma `uxCopy.ts` dintr-un obiect cu stringuri simple intr-un obiect cu perechi `{ ro, en }` si voi crea un hook `useTranslatedCopy()` care returneaza automat textele in limba selectata.

Structura noua:
```typescript
const uxCopyBilingual = {
  search: {
    placeholder: { ro: "Cauta obiecte...", en: "Search items..." },
    noResults: { ro: "Nu am gasit...", en: "No results..." },
    // ...
  }
}
```

Un hook `useUxCopy()` va returna versiunea tradusa bazata pe limba curenta din `LanguageContext`.

### Pas 2: Traducere pagini principale

Fiecare pagina/componenta cu text hardcoded va fi actualizata:

**Pagini (8 fisiere):**
- `Index.tsx` - hero, categorii, "Cum functioneaza", CTA section
- `Search.tsx` - header, tabs, users results text
- `ProductDetail.tsx` - breadcrumbs, descriere, calendar, reviews, toast messages
- `Checkout.tsx` - headers, step titles, payment options, review, terms
- `Categories.tsx` - header, search placeholder, empty state
- `Auth.tsx` - login/register forms, validation messages, reset password dialog
- `HelpCenter.tsx` (deja are `t()`, dar trebuie verificat)
- `Profile.tsx` (deja are `t()`, partial tradus)

**Componente (15+ fisiere):**
- `Footer.tsx` - toate link-urile si textele
- `HeroSearchForm.tsx` - placeholder-uri, butoane select
- `FeaturedListings.tsx` - badge "Verificat"
- `OwnerSection.tsx` - texte hardcoded ("recenzii", "Raspunde in", mobile "Verificat")
- `ProductIncludes.tsx` - default items list
- `UsageRules.tsx` - default rules, deposit text
- `BookingCard.tsx` - "saptamana", "luna", "Sterge" button
- `BookingConfirmation.tsx` - timeline steps, action buttons
- `ProgressIndicator.tsx` - "Pasul X din Y"
- `RentalsTab.tsx` - "Proprietar:", "Contacteaza proprietarul"
- `LendingsTab.tsx` - "Produse active", "Cereri in asteptare", "Accepta", "Refuza", "Adauga anunt"
- `SearchFilters.tsx` - "Filtre", "Toate categoriile", "Aplica filtrele"
- `EmptySearchState.tsx` - "Exploreaza toate categoriile"
- `StatusBadge.tsx` - uses uxCopy (will be auto-translated)
- `NearbyProductsSlider.tsx` - daca are text hardcoded

### Pas 3: Traducere `uxCopy.ts` complet

Toate textele din `uxCopy.ts` vor primi echivalent EN:

| Sectiune | Exemplu RO | Exemplu EN |
|----------|-----------|-----------|
| search | "Cauta obiecte de inchiriat" | "Search items to rent nearby" |
| booking | "Trimite cerere de inchiriere" | "Send rental request" |
| trust | "Plati protejate" | "Secure payments" |
| dashboard | "Inchirierile mele" | "My Rentals" |
| status | "In asteptare" | "Pending" |
| home | "Inchiriaza ce ai nevoie" | "Rent what you need" |
| common | "Se incarca..." | "Loading..." |
| owner | "Trimite mesaj" | "Send message" |
| product | "Ce este inclus" | "What's included" |
| reassurance | "Plata ta este protejata" | "Your payment is protected" |

### Pas 4: Traducere date statice

- `categories.ts` si `subcategories` - adaugare camp `nameEn` sau abordare dictionar
- Review-uri mock din `ProductDetail.tsx` - traducere conditionata
- Validation messages din `Auth.tsx` (zod schemas)

---

## Detalii Tehnice

### Abordare pentru `uxCopy.ts`
Voi crea un nou format cu un hook dedicat:

```typescript
// uxCopy.ts - structura noua
export const uxCopyRo = { /* toate textele RO */ };
export const uxCopyEn = { /* toate textele EN */ };

// Hook: useUxCopy.ts
export const useUxCopy = () => {
  const { language } = useLanguage();
  return language === "ro" ? uxCopyRo : uxCopyEn;
};
```

Aceasta abordare:
- Pastreaza type safety
- Permite import direct fara context in componente non-React (StatusBadge etc.)
- Minimizeaza refactoring - doar schimbi importul

**Problema cu StatusBadge**: `statusConfig` este definit la nivel de modul, nu in componenta, deci nu poate folosi hooks. Solutia: mut config-ul in interiorul componentei sau il fac functie.

### Fisiere noi
| Fisier | Scop |
|--------|------|
| `src/hooks/useUxCopy.ts` | Hook pentru texte traduse |

### Fisiere modificate (~25 fisiere)
- `src/data/uxCopy.ts` - restructurare completa
- Toate paginile si componentele listate mai sus

### Estimare
- ~25 fisiere de modificat
- ~500+ stringuri de tradus
- Nu necesita modificari backend
