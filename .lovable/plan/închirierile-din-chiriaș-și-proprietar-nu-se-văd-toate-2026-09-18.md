# Închirierile din „Chiriaș" și „Proprietar" nu se văd toate

Am verificat cum sunt încărcate și filtrate închirierile în cele două secțiuni. Rezervările se aduc corect din baza de date (toate, fără limită), dar se pierd la afișare, din trei motive.

## Ce am găsit

1. **„Închirieri active" (Proprietar) arată doar o parte.** Butonul deschide pagina cu filtrul fixat pe „Active", iar acel filtru înseamnă strict rezervările confirmate care nu au fost încă predate. Cererile noi, închirierile aflate în derulare (produs predat) și cele întârziate sunt excluse, deși utilizatorul se așteaptă să le vadă pe toate cele în desfășurare.

2. **La „Chiriaș", istoricul e ascuns într-un acordeon închis.** Rezervările încheiate, anulate sau refuzate există în listă, dar sunt strânse într-o secțiune pliată, deci par lipsă. La Proprietar acordeonul a fost deja eliminat; la Chiriaș a rămas.

3. **Un tip de rezervare nu are categorie.** Închirierile aflate în „retur anticipat cerut" (3 în baza de date acum) nu se potrivesc în nicio categorie și cad pe o ramură de rezervă, deci apar nepotrivit și dau o avertizare în consolă.

## Ce voi face

- Filtrul „Active" (folosit și de buton) va însemna „toate în desfășurare": cereri noi, confirmate, în derulare și întârziate. Categoriile detaliate rămân disponibile separat în lista de filtre, pentru cine vrea să restrângă.
- La „Chiriaș" istoricul devine listă simplă, mereu vizibilă, identică cu cea de la Proprietar.
- Rezervările cu retur anticipat cerut vor fi tratate ca fiind în derulare, nu pe ramura de rezervă.
- Voi verifica numerele: suma categoriilor trebuie să dea totalul închirierilor, atât pentru chiriaș cât și pentru proprietar.

## Detalii tehnice

- `src/components/dashboard/rentalBucket.ts`: adaug `early_return_requested` (și statusurile în derulare înrudite) în ramura activă; păstrez partiția exclusivă pe cele 6 categorii.
- `src/components/dashboard/RentalsFilterBar.tsx`: opțiunea „Active" devine un grup („ongoing"), cu opțiune separată „Confirmate" pentru bucket-ul strict; contorul grupului = suma sub-categoriilor.
- `src/components/dashboard/RentalsOutTab.tsx`: `matchesStatus` suportă filtrul de grup; `VALID_STATUS_FILTERS` acceptă în continuare parametrul `status` din adresă.
- `src/components/dashboard/RentalsTab.tsx`: elimin `Accordion` din „Istoric închirieri" și afișez lista direct, cu același antet și număr; aplic același filtru de grup.

Fără modificări de date sau de logică de business — doar afișare și filtrare.
