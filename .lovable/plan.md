## Problem

Pe pagina `/produs/:slug` (vizibilă în screenshot), când limba e setată pe EN:
1. **Titlul produsului** ("Ferestrau spada") rămâne în RO.
2. **Descrierea** ("Se inchiriaza fierastrau sabie...") rămâne în RO.
3. **Blocul "Anulare gratuită"** din sidebar-ul dreapta rămâne în RO.

## Cauze identificate

1. **Titlu/descriere**: La iterația anterioară s-au adăugat câmpurile `title_en` și `description_en` în tipul TypeScript `Product`, dar **nu există coloane reale în baza de date** (verificat — 0 coloane `_en` în tabelul `products`). Conținutul e introdus de utilizatori doar în RO, deci nu există sursă de traducere.
2. **"Anulare gratuită"**: Am tradus `BookingCard.tsx`, dar `src/pages/ProductDetail.tsx` (liniile 358–371) conține un **bloc duplicat hardcodat în RO** care e cel afișat efectiv pe desktop. Acela nu a fost atins.

## Soluție propusă

### 1. Auto-traducere RO → EN pentru titlu și descriere (DB + funcție)
- **Migrare DB**: adaug coloanele `title_en TEXT` și `description_en TEXT` pe tabelul `products` (nullable).
- **Edge function `translate-product`**: primește `productId`, citește `title` + `description`, apelează **Lovable AI** (`google/gemini-2.5-flash` — rapid, ieftin, fără API key) pentru traducere RO→EN, salvează rezultatul în `title_en` / `description_en`. Idempotent (nu retraduce dacă există deja, decât dacă `force=true`).
- **Trigger**: la `insert` și la `update` pe `title`/`description`, un trigger Postgres cheamă `pg_net` către edge function pentru a re-traduce asincron. (Sau, mai simplu pentru MVP: un buton "Re-traduce" în admin + apel automat la publicare.)
- **Backfill**: rulez funcția pentru toate produsele existente o singură dată (script one-shot prin admin sau cron edge function).

**Fallback frontend**: dacă `title_en` lipsește încă (translation pending), afișează `title` (RO) — codul existent în `ProductDetail.tsx` deja face asta corect.

### 2. Fix hardcoded "Anulare gratuită" în ProductDetail.tsx
Înlocuiesc blocul de la liniile 364–369 cu pattern-ul `language === "ro" ? ... : ...` (identic cu cel deja existent în `BookingCard.tsx`):
```tsx
<p className="font-semibold ...">
  {language === "ro" ? "Anulare gratuită" : "Free cancellation"}
</p>
<p className="text-xs ...">
  {language === "ro"
    ? "Anulează gratuit cu 48h înainte... Consultă"
    : "Cancel for free up to 48h before... See the"}{" "}
  <Link to="/politica-anulare">
    {language === "ro" ? "politica de anulare" : "cancellation policy"}
  </Link>{" "}
  {language === "ro" ? "pentru mai multe detalii." : "for more details."}
</p>
```

## Întrebare pentru tine

Pentru titlu/descriere produs, ce preferi?

**A. Auto-traducere AI completă** (recomandat): adaug coloane DB + edge function + backfill pentru toate produsele existente. Toate produsele vor avea EN automat, traducerea rulează la publicare. Cost: foarte mic (Gemini Flash).

**B. Doar fix UI** pentru "Anulare gratuită" acum, lăsăm titlu/descriere în RO (conținut user-generated rămâne în limba originală — abordare comună pe marketplace-uri).

**C. Manual**: adaug coloane DB + câmpuri EN opționale în formularul de creare/editare produs, ca user-ul să poată introduce manual versiunea EN.

Spune-mi A, B sau C și implementez.
