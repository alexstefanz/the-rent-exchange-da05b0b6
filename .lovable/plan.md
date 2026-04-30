## Problema

După ce adaugi numărul de telefon în "Contul meu", la checkout îți apare în continuare bannerul roșu "Numărul de telefon este obligatoriu". Cauza: query-ul `useCurrentUserProfile` are `staleTime: 5 minutes` și nu este invalidat după salvarea profilului — așa că `Checkout.tsx` citește încă datele vechi (fără telefon) din cache-ul React Query.

În plus, vrei un mic banner verde de confirmare ("Număr de telefon verificat") atunci când telefonul este valid, pentru claritate.

## Soluție

### 1. Invalidare cache după salvare profil
În `src/components/profile/AccountTab.tsx` și `src/components/profile/ProfileTab.tsx`, după update-ul reușit al profilului, invalidează query-ul:
```ts
queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
```
Astfel, la întoarcerea pe `/checkout/...`, `PhoneRequiredGate` recitește profilul actualizat și dispare bannerul roșu.

### 2. Banner verde "Număr de telefon verificat"
În `src/components/profile/PhoneRequiredGate.tsx`:
- În prezent, când telefonul e valid, componenta returnează `null`.
- Modific astfel: dacă telefonul e valid, randează un banner mic, verde, discret, cu iconul `CheckCircle2` (lucide) și textul localizat: "Număr de telefon verificat" / "Phone number verified", urmat de numărul mascat (ex: `+40 7XX XXX 123`).
- Stil: `border-emerald-500/40 bg-emerald-50 text-emerald-700`, padding redus (`p-2.5`), text `text-sm`, layout pe un singur rând.

### 3. Texte noi în `src/data/uxCopy.ts`
Adaug în `smsNotifications`:
- `verifiedTitle`: "Număr de telefon verificat" / "Phone number verified"

### 4. (Opțional) Reducere staleTime
Reduc `staleTime` în `useCurrentUserProfile` de la 5 min la 30s ca plasă de siguranță, fără cost real (profilul e mic).

## Fișiere modificate
- `src/components/profile/PhoneRequiredGate.tsx` — banner verde când telefonul e valid
- `src/components/profile/AccountTab.tsx` — invalidare cache după update
- `src/components/profile/ProfileTab.tsx` — invalidare cache după update
- `src/hooks/queries/useCurrentUserProfile.ts` — staleTime redus
- `src/data/uxCopy.ts` — text bilingv pentru bannerul verde

## Rezultat
- După ce salvezi telefonul în cont și revii la checkout, bannerul roșu dispare imediat și apare unul verde scurt: "Număr de telefon verificat".
- Dacă telefonul lipsește sau e invalid, bannerul roșu rămâne (cu butonul "Adaugă număr de telefon" deja existent).
