## Obiectiv

Pe mobil, paginile **Rezervările mele** (`/rezervari`) și **Cereri primite** (`/inchirieri`) să arate mai curat și mai funcțional:
- Eliminăm cardurile de statistici (În așteptare / Active / Anulate / Cheltuit/Câștig luna asta)
- Le înlocuim cu o **bară de filtre** (`Toate`, `Active`, `În așteptare`, `Anulate`) + **sortare** (cele mai noi / cele mai vechi / sumă)
- Cardurile premium "Rezervările mele" / "Cereri de închiriere" devin **2 pe rând pe mobil** cu tipografie mai compactă, fără overlap

## Modificări

### 1. `src/components/dashboard/RentalsTab.tsx` (Rezervările mele - ca chiriaș)

**Înlocuim blocul stats** (liniile 168–185, grid 2-col cu 4 carduri) cu o bară unificată:

```text
[Toate (24)] [Active (3)] [În așteptare (1)] [Anulate (11)]   [Sortare ⌄]
```

- Pills/chips orizontale, scrollabile pe mobil (`overflow-x-auto`), cu `Badge`-uri pentru contoare
- Filtrul activ folosește `bg-primary text-primary-foreground`
- `Select` cu opțiuni: `Cele mai noi`, `Cele mai vechi`, `Suma (mare→mic)`, `Suma (mic→mare)`
- State local: `statusFilter: "all" | "active" | "pending" | "cancelled"`, `sortBy`

**Aplicăm filter+sort** atât pe blocul premium ("Rezervările mele") cât și pe accordion-ul de istoric. Logica curentă (premium = pending sau confirmed/active fără handover) rămâne, dar e intersectată cu filtrul de status.

**Grid premium** (linia 195): `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3` → `grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3`

**Densitate card pe mobil** (pentru a evita overlap-ul din imaginea 1):
- Padding card: `p-4` → `p-3 sm:p-4`
- Aspect imagine: `aspect-[16/10]` → `aspect-[4/3] sm:aspect-[16/10]`
- Titluri: `text-base` → `text-sm sm:text-base`
- Grila celor 3 mini-tiles (Perioadă/Zile/Total) pe mobil → 3 coloane rămân, dar `text-[10px]` label și `text-[11px]` valoare, `gap-1.5 sm:gap-2`, `p-1.5 sm:p-2`
- Badge-ul "În așteptare/Confirmată" din colț: `top-2 right-2 text-[10px] px-1.5 py-0.5` pe mobil
- Buton "Vezi detalii": `h-9 text-xs sm:text-sm`
- Buton "Solicită anularea cererii": rămâne dar pe mobil cu text mai scurt: `Anulează cererea`

### 2. `src/components/dashboard/RentalsOutTab.tsx` (Cereri primite - ca proprietar)

Aceleași schimbări:
- Eliminăm cele 4 carduri de stats (liniile 130–147)
- Adăugăm aceeași bară: `Toate / Active / În așteptare / Anulate` + sortare
- Grid premium: `grid-cols-2` pe mobil
- Aceleași tweak-uri de densitate

### 3. Istoric (accordion-ul de jos)

Filtrul de status + sortarea se aplică **și** pe `historyRentals` (nu doar pe cardurile premium). Astfel utilizatorul vede toate rezervările care matchează indiferent că sunt în secțiunea "premium" sau în istoric.

## Ce NU se schimbă

- Logica de business (status pending/confirmed/active/completed/cancelled, plățile, anulările)
- Realtime (`useRentalRealtime`)
- Desktop layout (4-col stats nu apare pentru că eliminăm complet stats — pe desktop rămâne tot bara de filtre, mai curat)
- Pagina `/anunțuri` (owner listings)

## Detalii tehnice

- Filtrele și sortarea sunt **pur client-side** (datele se încarcă deja toate)
- Nu adăugăm dependințe noi
- Componenta filtru o ținem inline în fiecare tab (sunt logici diferite: "Cheltuit" vs "Câștig" — am eliminat ambele oricum)
- Counter-ele de pe pills se calculează din arrays-urile existente (`pendingRentals.length` etc.)
