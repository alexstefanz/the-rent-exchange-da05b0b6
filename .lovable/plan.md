## Context

Acum, pe pagina `/verificare`, dacă userul nu are număr de telefon valid:
- Apare banner roșu sus (PhoneRequiredGate)
- Butonul „Trimite documentele" e dezactivat la final
- Dar userul vede tot fluxul de upload, poate încărca toate documentele și abia la submit află că e blocat → frustrant și pierdere de timp

## Ce schimb

Transform blocarea într-un gate complet, vizibil de la început:

### `src/pages/KycVerification.tsx`

Când `!phoneGate.hasValidPhone && !phoneGate.isProfileLoading && !isVerified && !isAlreadySubmitted`:

1. **Ascund complet secțiunea de upload** (cardul „Documente necesare", tips-urile, butonul submit)
2. **Înlocuiesc** cu un card de blocare clar:
   - Iconiță Phone mare în orange/destructive
   - Titlu: „Adaugă numărul de telefon înainte de verificarea identității"
   - Text: „Avem nevoie de numărul tău pentru a-ți trimite SMS-uri legate de KYC și rezervări. Te rog adaugă-l în contul tău înainte de a continua cu verificarea."
   - Buton primar mare „Mergi la contul meu" → `navigate("/contul-meu")`
   - Buton secundar „Înapoi" → `navigate(-1)`
3. **Banner-ul existent** (`PhoneRequiredGate`) rămâne sus pentru context, dar mesajul principal e cardul de gate
4. Dacă userul e deja verificat sau în review (status VERIFIED/SUBMITTED), gate-ul nu apare — vede statusul normal

### `src/data/uxCopy.ts`

Adaug în `smsNotifications` cheile noi pentru cardul de gate KYC:
- `kycGateTitle`: „Adaugă numărul de telefon înainte de verificare"
- `kycGateDesc`: „Avem nevoie de numărul tău pentru notificări SMS despre statusul KYC și rezervări."
- `kycGateCta`: „Adaugă număr de telefon"
- `kycGateBack`: „Înapoi"

## Beneficiu

User-ul nu mai poate ajunge la pasul de upload fără telefon — înțelege imediat ce trebuie făcut, are un buton clar care îl duce la pagina corectă, fără să piardă timp încărcând documente care nu pot fi trimise.

## Ce NU schimb

- `PhoneRequiredGate` și `usePhoneRequired` rămân neatinse (folosite și pe Checkout, NewProduct, EditProduct)
- Logica de submit / RLS / edge functions — neatinse
- Comportamentul pentru userii cu telefon valid — identic
