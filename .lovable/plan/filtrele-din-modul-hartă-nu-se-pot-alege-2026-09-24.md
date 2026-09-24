# Filtrele din modul Hartă nu se pot alege

## Ce am găsit (verificat pe telefon, /categorie/electronice?view=map)
- Filtrele în sine funcționează: cu județul Iași din adresă, lista scade corect de la 8 la 6 anunțuri, atât pe hartă cât și în grilă.
- Problema e în panoul „Filtre”: când apeși pe Subcategorie, Județ, Localitate sau Sortează după, lista de opțiuni se deschide (43 de județe), dar **în spatele panoului**, deci e invizibilă și nu se poate apăsa. Pentru utilizator pare că nu se întâmplă nimic.
- Cauza: panoul lateral stă pe un strat mai sus decât listele derulante din interiorul lui.

## Ce repar
1. Listele derulante (și ferestrele mici de tip popover folosite în aceleași filtre) vor apărea deasupra panoului lateral, peste tot pe site (hartă, grilă, căutare).
2. „Caută în această zonă”: după ce schimbi un filtru, zona salvată de pe hartă se resetează, ca rezultatele noi să nu fie ascunse de o zonă aleasă anterior.
3. Dacă schimbi județul/localitatea, intervalul de preț se readaptează la anunțurile noi (în loc să rămână intervalul vechi care poate ascunde rezultate).

## Verificare
Test pe telefon și desktop: aleg Județ = Iași, o subcategorie, sortare după preț, apăs „Aplică filtrele” și confirm că numărul de anunțuri și pinii de pe hartă se schimbă.

## Detalii tehnice
- `src/components/ui/select.tsx`: `SelectContent` z-50 → z-[80] (sheet overlay z-[60], content z-[70]); la fel în `popover.tsx` dacă e cazul.
- `CategoryMapView.tsx`: `setAreaBounds(null)` când se schimbă lista `products` venită din filtre (efect separat, fără buclă cu filtrarea după zonă).
- `CategoryDetail.tsx`: resetare `priceTouched` la schimbarea județului/localității.
