# Refactor UI centru de notificări

Rafinare vizuală a panoului existent de notificări (dropdown desktop, sheet mobil, pagina /notificari). Logica, datele, API-urile, statusurile și navigarea rămân neschimbate — se modifică doar layout-ul și stilurile.

## Ce se schimbă

### Header fix
Rămâne titlul "Notificări", subtitlul "Ai X notificări noi", iconul de setări și "Citește toate". Header-ul și filtrele rămân fixe; doar lista scrollează.

### Filtre mai discrete
Tab-urile Toate / Necitite / Citite trec de la pill negru la tab-uri text cu underline portocaliu pentru starea activă, pe o linie subtilă comună. Numerele rămân, dar mai mici și în gri, nu ca badge-uri colorate dominante. Filtrul pe categorii (select) rămâne, aliniat discret în dreapta rândului de tab-uri (pe mobil trece pe rândul următor).

### Listă compactă în loc de carduri
Fiecare notificare devine un rând de listă: fără fundal propriu, fără border-radius mare, fără bară de accent laterală. Separator subtil între rânduri. Structura rândului:

```text
[icon]  Titlu notificare                     ●
        23 minute în urmă
        Descriere pe maximum 2 rânduri...
```

Padding vertical redus, icon container mic (32px, rounded, tentă subtilă), descriere limitată la 2 rânduri cu ellipsis.

### Necitit vs. citit
Necitit = titlu semibold + punct portocaliu în dreapta. Citit = titlu normal, text mai discret. Fără fundal portocaliu pe rând. Hover: fundal foarte light + cursor pointer.

### Grupare temporală
Se păstrează grupurile ASTĂZI / IERI / SĂPTĂMÂNA ACEASTA / MAI VECHI, cu header mic, uppercase, gri, urmat de o linie subtilă.

### CTA doar când e nevoie
Butoanele de acțiune se afișează doar pentru notificările acționabile (cerere de închiriere, cerere acceptată/plată, mesaj, inspecție, ticket). Notificările pur informative (confirmări, anulări confirmate, recenzii) nu mai primesc buton. Butonul rămâne compact, outline.

### Footer
Butonul portocaliu full-width "Vezi toate notificările" este înlocuit cu un link discret centrat, cu săgeată la dreapta.

### Înălțime și scroll
Panoul desktop primește o înălțime maximă mai mică (aprox. 560px / 70vh) ca să nu ocupe tot ecranul; doar zona listei scrollează. Pe mobil sheet-ul rămâne pe toată înălțimea, cu aceeași structură fix/scroll. Pagina /notificari păstrează comportamentul actual de scroll al paginii.

### Iconografie
Se refolosesc culorile existente pe categorie (rezervare verde, mesaj albastru, plată mov, suport/anulare portocaliu, sistem gri/albastru), doar dedurizate: halo mai subtil, icon mai mic.

## Detalii tehnice

Fișiere atinse (doar prezentare):
- `src/components/notifications/NotificationCard.tsx` — rescris ca rând de listă compact; se păstrează `onSelect` / `onMarkRead` și `getQuickAction`, restrâns la tipurile acționabile.
- `src/components/notifications/NotificationGroup.tsx` — headere de grup mai discrete, separatoare între rânduri.
- `src/components/notifications/NotificationFilters.tsx` — tab-uri cu underline portocaliu în locul pill-urilor.
- `src/components/notifications/NotificationCenter.tsx` — înălțime max redusă pentru varianta popover, footer ca link discret; logica de filtrare/counts rămâne identică.
- `src/components/notifications/NotificationSkeleton.tsx` — aliniat la noua densitate.

Nu se modifică: `useNotifications`, `notificationsApi`, `mapLink`, `notificationCategory` (doar eventual valorile de tentă), `NotificationBell`, `NotificationsPage`. Culorile folosesc tokenii existenți din design system.
