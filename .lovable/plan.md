

## Plan: Îmbunătățiri pagina profil utilizator

### 1. Mutare filtre + search lângă "Sortează după" (eliminare sidebar)

**`src/pages/UserProfile.tsx`**
- Eliminare sidebar-ul `<aside>` cu "Filtrează anunțurile" și "Caută pe această pagină"
- Mutare search input în bara de sus, lângă sort/view controls
- Convertire filtrele de categorii într-un `<Select>` dropdown (cu opțiunea "Toate anunțurile" + categoriile disponibile)
- Toate controalele pe un singur rând: Search | Categorie dropdown | Sort dropdown | View toggle | Pagination
- Grid-ul de produse devine full-width → `lg:grid-cols-4` pe grid mode
- Layout-ul `flex-col lg:flex-row gap-8` cu aside se elimină complet

### 2. Recenzii funcționale — rating real pe profil și pe pagina de produs

**`src/pages/ProductDetail.tsx`** (linia 227)
- OwnerSection primește rating/reviewCount hardcodate (`4.9`, `12`). Trebuie să fetch-uim statisticile reale ale owner-ului folosind `getUserStatistics(product.owner_id)` și să le pasăm ca props
- Adăugare `useUserStatistics` hook import și apel cu `product?.owner_id`
- Înlocuire `rating={4.9} reviewCount={12} memberSince="2024"` cu date reale din statistics

**`src/components/product/OwnerSection.tsx`**
- Eliminare default values hardcodate pentru rating/reviewCount (sau setare la 0)
- Afișare condițională: dacă reviewCount === 0, afișează "Fără recenzii" în loc de rating

### 3. Buton "Distribuie" funcțional

**`src/pages/UserProfile.tsx`** (linia 294)
- Implementare Web Share API (navigator.share) cu fallback pe clipboard copy
- Share URL = `window.location.href`, title = numele utilizatorului
- Toast de confirmare "Link copiat!"

### 4. Etichetă "Membru nou" / "Membru standard" bazată pe vechime

**`src/pages/UserProfile.tsx`** (linia 283)
- Verificare `statistics.member_since`: dacă diferența față de `now()` < 3 luni → "Nou" (verde), altfel → "Membru standard" sau fără etichetă
- Aceeași logică aplicată și în `OwnerSection.tsx` — adăugare prop opțional `memberSinceDate` pentru calcul

### Fișiere modificate
- `src/pages/UserProfile.tsx` — restructurare layout (sidebar → dropdown), share button, etichetă membru
- `src/pages/ProductDetail.tsx` — fetch real owner stats, pass to OwnerSection
- `src/components/product/OwnerSection.tsx` — afișare condițională rating, etichetă membru bazată pe dată

