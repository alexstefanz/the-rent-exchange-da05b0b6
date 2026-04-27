## Obiectiv

Transform banner-ul actual de avertizare într-o **blocare reală**: niciun user nu poate face acțiuni critice fără un număr de telefon RO valid în profil. Telefonul e necesar pentru SMS-urile tranzacționale (cerere, acceptare, refuz, anulare, reminder returnare).

## Acțiuni blocate

1. **Postarea unui produs** (`/produs-nou`)
2. **Editarea unui produs** (`/editeaza-produs/:id`)
3. **Crearea unei rezervări** (`/checkout` — la pasul plății)
4. **Trimiterea dosarului KYC** (`/verificare`)

## Comportamentul de blocare (uniform pe toate cele 4)

- Banner roșu permanent în partea de sus a paginii: „Ai nevoie de un număr de telefon valid pentru a continua. Vom folosi acest număr pentru notificări SMS despre rezervări."
- Butonul principal de submit (Plătește / Publică / Salvează / Trimite KYC) este **dezactivat** atât timp cât profilul nu are `isValidRomanianPhone(phone) === true`.
- Dacă userul totuși forțează (ex. tastatură), `handleSubmit` verifică din nou și afișează un dialog modal cu:
  - Titlu: „Adaugă numărul de telefon"
  - Text explicativ
  - Buton primar: „Mergi la contul meu" → `navigate("/contul-meu")`
  - Buton secundar: „Anulează"
- După ce userul completează telefonul în AccountTab și se întoarce, banner-ul dispare și butonul devine activ.

## Componentă nouă reutilizabilă

`src/components/profile/PhoneRequiredGate.tsx`
- Hook intern: folosește `useCurrentUserProfile` + `isValidRomanianPhone`.
- Expune:
  - `<PhoneRequiredGate>` — banner roșu (înlocuiește `SmsPhonePromptBanner` în cele 4 pagini cu un ton mai ferm)
  - `usePhoneRequired()` — hook care întoarce `{ hasValidPhone, requirePhone(): boolean }` (deschide dialog dacă lipsește)
  - `<PhoneRequiredDialog>` — modal global cu redirect spre `/contul-meu`

## Modificări per fișier

### `src/components/profile/PhoneRequiredGate.tsx` (nou)
- Banner roșu + dialog + hook într-un singur fișier export.
- Folosește `useUxCopy` pentru toate textele (RO/EN).

### `src/pages/Checkout.tsx`
- Înlocuiesc `<SmsPhonePromptBanner>` cu `<PhoneRequiredGate>`.
- În `handleStripeCheckout`: înainte de Stripe, dacă telefonul lipsește → deschid dialog și `return`.
- Buton „Plătește" — adaug `disabled={!hasValidPhone}`.

### `src/pages/NewProduct.tsx`
- Idem ca mai sus, în `handleSubmit` blochez înainte de `createProduct`.
- Buton „Publică anunț" — `disabled={!hasValidPhone}`.

### `src/pages/EditProduct.tsx` (nou de adăugat)
- Adaug `<PhoneRequiredGate>` sus.
- Blochez submit-ul de update cu același pattern.

### `src/pages/KycVerification.tsx`
- Adaug `<PhoneRequiredGate>` sus.
- Blochez butonul „Trimite spre verificare" + check în handler.

### `src/data/uxCopy.ts`
- Adaug în `smsNotifications`:
  - `requiredTitle`: „Numărul de telefon este obligatoriu"
  - `requiredDesc`: „Adaugă un număr RO valid pentru a continua. Îl folosim pentru SMS-uri despre rezervări."
  - `dialogTitle`, `dialogDesc`, `goToAccount`, `cancel`

### `src/components/profile/SmsPhonePromptBanner.tsx`
- Rămâne neschimbat (folosit în alte locuri non-blocante, dacă există). Poate fi deprecated ulterior.

## Aspecte tehnice

- Validarea folosește `isValidRomanianPhone` deja existent (`+40XXXXXXXXX`, `0XXXXXXXXX`, `40XXXXXXXXX`, `0040XXXXXXXXX`).
- Nu modificăm RLS sau edge functions — toată logica e client-side, suficientă pentru UX (KYC + RLS protejează server-side oricum).
- Profilul e citit prin `useCurrentUserProfile` (deja include `phone`).
- Niciun cost suplimentar Twilio până când userii nu adaugă telefon real.

## Ce NU schimb

- Edge functions SMS — funcționează corect.
- Logica de KYC sau Stripe — neatinse.
- Procesul de signup — telefonul rămâne opțional la registration (forțăm doar la acțiuni critice).

## Rezultat

După aplicare: orice user care încearcă să posteze, să editeze, să rezerve sau să trimită KYC fără telefon valid e oprit cu un mesaj clar și un buton care îl duce direct la pagina unde îl poate adăuga.
