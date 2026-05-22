## Problem
Pe pagina de produs, zilele rezervate apar gri în calendar fără explicație. Când utilizatorul încearcă să selecteze o perioadă care conține zile rezervate, primește doar un toast scurt „Există zile rezervate în interval", fără să știe care zile sunt blocate sau ce să facă.

## Soluție

### 1. Legendă vizibilă sub calendar (`PremiumBookingCard.tsx` + `BookingCard.tsx`)
Adaugă o mică legendă explicativă chiar sub calendar, vizibilă din start:
- pătrat gri → „Indisponibil / Rezervat" 
- pătrat portocaliu → „Selectat"
- pătrat negru → „Astăzi"

Astfel utilizatorul înțelege de la prima vedere ce înseamnă fiecare culoare.

### 2. Alert detaliat la conflict (`ProductDetail.tsx` + `BookingCard.tsx`)
În `handleDateSelect`, când `hasBookedDateInRange` întoarce `true`:
- Calculează lista exactă de zile rezervate din interval (filtrare pe `bookedDates`).
- Înlocuiește toast-ul simplu cu un **AlertDialog** (shadcn) care:
  - Titlu: „Perioada conține zile rezervate"
  - Listează maxim 6 zile blocate formatate frumos (ex: „15 mar, 16 mar, 22 mar…"), cu „și încă N zile" dacă sunt mai multe.
  - Mesaj clar: „Te rugăm să alegi o altă perioadă care nu se suprapune."
  - Buton „Alege altă perioadă" → resetează `startDate`/`endDate` și închide dialogul.

### 3. Tooltip pe zilele gri (calendar)
Pe `<DayContent>` custom în `CalendarComponent`, adaugă `title` HTML nativ pe zilele rezervate: „Rezervat — alege altă zi". E un win rapid, accesibil și fără cost de bundle.

### Localizare
Toate textele noi vor folosi `t(ro, en)` pentru bilingv RO/EN, conform standardului proiectului.

### Fișiere atinse
```text
src/pages/ProductDetail.tsx              (alert dialog state + listă zile blocate)
src/components/product/PremiumBookingCard.tsx  (legendă + tooltip pe zile)
src/components/product/BookingCard.tsx          (același tratament pentru cardul vechi)
```

Nu se modifică nicio logică de business, RLS sau API — strict UX pe frontend.