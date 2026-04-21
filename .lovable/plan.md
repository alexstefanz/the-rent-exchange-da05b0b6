

## Plan: Eliminare text reasigurare de sub calendar

### Modificare

În `src/components/product/BookingCard.tsx` (componenta cardului de rezervare de pe pagina produsului), elimin textul "Nu vei fi taxat până când proprietarul acceptă cererea" afișat sub calendar / sub butonul de rezervare.

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/product/BookingCard.tsx` | Șterg linia/blocul cu textul de reasigurare + import-urile devenite nefolosite (dacă e cazul) |

### Rezultat

Cardul de rezervare nu mai afișează mesajul respectiv. Restul layout-ului (preț, calendar, total, buton "Rezervă") rămâne identic.

