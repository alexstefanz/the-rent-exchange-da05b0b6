
# Fix auto-login după verificarea SMS

## Cauza reală (confirmată din auth logs)
Auth logs arată secvența:
1. `12:43:32` — signup + `immediate_login_after_signup` (sesiune creată) ✓
2. `12:43:47` — verify-phone-otp confirmă emailul ✓
3. `12:43:48` — `POST /token` grant=password → login reușit ✓
4. `12:43:48` — **`POST /logout`** ← contul e deconectat imediat

Sursa `signOut()`-ului: în `src/pages/Auth.tsx` (linia 789-796), handler-ul `onOpenChange` al `PhoneOtpDialog`:
```ts
onOpenChange={(o) => {
  setPhoneOtpOpen(o);
  if (!o && gatingLogin) {
    supabase.auth.signOut(); // ← se execută cu closure învechit
    ...
  }
}}
```
`PhoneOtpDialog.verify()` cheamă în ordinea: `signInWithPassword` → `onVerified(phone)` → `onOpenChange(false)`. `onVerified` setează `gatingLogin=false`, dar în React state-urile sunt async — handler-ul `onOpenChange` care se execută imediat după încă vede `gatingLogin=true` (closure vechi), deci deconectează utilizatorul chiar dacă tocmai s-a autentificat cu succes.

## Soluție

**`src/components/profile/PhoneOtpDialog.tsx`**
- În `verify()`, după `onVerified(phone)` **elimină** apelul redundant `onOpenChange(false)`. Închiderea dialogului este deja gestionată de callerul `onVerified` (care apelează `setPhoneOtpOpen(false)` în `handlePhoneVerified`). Astfel, `onOpenChange` se va apela doar când utilizatorul închide manual dialogul, nu automat după verificare reușită.

**`src/pages/Auth.tsx`**
- Adaugă un `useRef` (`gatingLoginRef`) sincronizat cu state-ul `gatingLogin`, iar handler-ul `onOpenChange` să citească din ref. Asta protejează împotriva oricărui viitor closure învechit similar și e o măsură defensivă.
- În plus, condiția devine: `if (!o && gatingLoginRef.current && pendingCredsRef.current)` — dacă `pendingCredsRef.current` e null, înseamnă că verificarea a reușit deja (a fost curățat de `handlePhoneVerified`), deci nu deconectăm.

## Rezultat
După verificarea codului SMS, utilizatorul rămâne autentificat, header-ul arată contul lui, iar homepage-ul răspunde ca utilizator logat — fără logout accidental.
