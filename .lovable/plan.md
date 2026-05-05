# Dropdown Județ + Localitate la adăugare/editare anunț

## Ce se schimbă

În pagina "Adaugă anunț" (și pentru consistență, "Editează anunț"), secțiunea de Locație nu mai are inputuri text + câmp "Țară". În loc apar:

- **Județ** — dropdown cu toate cele 42 de județe (din `src/data/romaniaLocations.ts`)
- **Localitate** — dropdown care se populează dinamic cu localitățile județului selectat. Dezactivat până se alege un județ.

Câmpul "Țară" dispare complet din UI. În baza de date `location_country` rămâne salvat automat ca `"Romania"` (fără să fie editabil), pentru a nu strica datele existente și RLS-ul.

## Detalii tehnice

**`src/pages/NewProduct.tsx`**
- Schema zod: înlocuiesc `location_city` cu o validare care cere `location_county` (județ) și `location_city` (localitate). Păstrez `location_country` ca default `"Romania"` în payload, scos din formular.
- State pentru județul selectat (sau `form.watch("location_county")`) ca să resetez `location_city` când se schimbă județul.
- UI: două componente `Select` (din `@/components/ui/select`) populate din `judete` (import din `src/data/romaniaLocations.ts`). Localitățile se mapează din `judete.find(j => j.name === selectedCounty)?.localitati`.
- La submit, salvez `location_city` (localitatea), `location_country: "Romania"`. Dacă DB are coloană `location_county`, o salvez; altfel concatenez „Localitate, Județ" în câmpul `location_city` — verific tipul în `src/integrations/supabase/types.ts` înainte.

**`src/pages/EditProduct.tsx`**
- Aceeași înlocuire. La preîncărcare, dacă valoarea existentă din `location_city` se potrivește cu o localitate cunoscută, identific automat județul (caut în `judete`) și pre-selectez ambele dropdown-uri. Dacă nu se potrivește, las dropdown-urile goale și utilizatorul re-selectează.

**Fișiere atinse**
- `src/pages/NewProduct.tsx` — înlocuit blocul Locație + schema
- `src/pages/EditProduct.tsx` — același tratament + logică de preîncărcare
- `src/data/romaniaLocations.ts` — deja există, doar import

Nu se schimbă nimic în baza de date sau în alte pagini.
