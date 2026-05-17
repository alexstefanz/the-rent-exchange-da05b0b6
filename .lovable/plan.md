## Fix popup-uri care depășesc viewport-ul pe mobil

### Diagnostic

În screenshot, dialogul "Solicită anularea comenzii" și fundalul (Sumar financiar) depășesc lățimea ecranului — butonul "Trimite cererea" și textul "2 RON" sunt tăiate la dreapta. Cauza: în `DialogContent` și `AlertDialogContent` din shadcn folosim `w-full max-w-lg`. Pe mobil, dacă pagina are orice overflow orizontal, `w-full` se ia raportat la `<body>` (nu la viewport), iar dialogul ajunge mai lat decât ecranul, dând impresia de "zoom in".

### Modificări

**`src/components/ui/dialog.tsx`** — în `DialogContent`:
- Înlocuiesc `w-full max-w-lg` cu `w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto` pentru a clampa lățimea la viewport minus marjă de siguranță și a permite scroll vertical pe ecrane mici.

**`src/components/ui/alert-dialog.tsx`** — în `AlertDialogContent`:
- Aceeași schimbare: `w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto`.

**`src/index.css`** — adaug o gardă globală împotriva overflow-ului orizontal care declanșează problema:
```css
html, body { overflow-x: hidden; }
```
(Doar pe axa X — nu afectează scroll-ul vertical.)

### Detalii tehnice

- `w-[calc(100%-2rem)]` lasă 1rem stânga/dreapta, identic cu marginea folosită deja în `MutualCancellationCard` și restul dialogurilor de anulare.
- `max-h-[calc(100dvh-2rem)] overflow-y-auto` previne ca un dialog cu mult conținut (ex: anulare cu sumar financiar + checkbox) să fie tăiat pe înălțime pe mobil.
- Fix-ul în `dialog.tsx` și `alert-dialog.tsx` rezolvă **toate** popup-urile din aplicație într-o singură lovitură (anulare rezervare, return anticipat, OTP telefon, retragere, raport mesaj, etc.) — nu trebuie atinse individual.
- Nu modific `sheet.tsx` (folosit pentru chat mobil), unde s-a făcut deja fix-ul separat.
- Nu schimb meta viewport — `initial-scale=1.0` rămâne corect.
