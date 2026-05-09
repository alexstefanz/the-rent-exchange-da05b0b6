
# Redesign Account Hub — "Detalii cont"

Restructurez complet pagina `/contul-meu` într-un hub modern cu overview vizual, secțiuni clar separate (Identitate, Securitate, Verificare, Plăți, Payout, Notificări, Suport, Danger Zone) și interacțiuni premium. Folosesc datele existente; pentru funcționalitățile fără backend (2FA, sesiuni, login history, carduri Stripe) afișez UI-ul cu stare "În curând" pentru a păstra design-ul scalabil fără a inventa logică inexistentă.

## Structura nouă a paginii

```text
/contul-meu
├── 1. AccountHeroCard         ← NOU (overview premium)
├── 2. ProfileCompletionCard   ← NOU (progres + checklist)
├── 3. Tabs / Sections sticky nav
│    ├── Personal Information
│    ├── Verification Center (KYC redesign)
│    ├── Security Center
│    ├── Payment Methods       (placeholder UI)
│    ├── Payout Methods        (IBAN actual)
│    ├── Notification Center
│    └── Support & Safety
└── 4. Danger Zone (collapsible, jos)
```

## Secțiuni — comportament

### 1. AccountHeroCard
- Avatar mare cu inel gradient + buton cameră (cropper modal cu zoom — react-easy-crop deja disponibil ca dep dacă lipsește îl adaug).
- Nume, badge "Verified" (din `kyc_status=VERIFIED`), "Member since" (`created_at`).
- Trust score derivat din: KYC + telefon + email contact + IBAN + nr. review-uri (`get_user_statistics`).
- Stats inline: rentals completed, rating mediu, response rate (placeholder dacă nu există).

### 2. ProfileCompletionCard
- Progress bar animat (Framer Motion) 0–100%.
- Checklist cu iconițe verde/portocaliu:
  - ✓ Email cont, ✓ Telefon RO valid, ✓ Fotografie, ✓ Identitate (KYC), ⚠ IBAN.
- Click pe item → scroll la secțiunea relevantă.

### 3. Personal Information
- Form actual reorganizat: card cu spacing premium, live validation (zod onChange), toast subtil la save, sticky save bar pe mobile.
- Cropper avatar modal (zoom + preview rotund) înainte de upload.

### 4. Verification Center (KYC redesign)
- Înlocuiesc "LEVEL 1/2/3" cu badge-uri umane: "Identitate verificată" / "În curs de verificare" / "Verificare necesară".
- Mini-stepper vizual (3 pași) + CTA mare "Începe verificarea" → `/verificare-identitate`.
- Trust copy: "Verificarea crește încrederea și deblochează închirieri premium".

### 5. Security Center
- Card "Parolă" — buton "Schimbă parola" (folosește flow-ul existent recovery email).
- Carduri "În curând" pentru: 2FA, Sesiuni active, Trusted devices, Login history. Placeholder vizual cu badge `Coming soon` ca să nu mint funcționalitate.
- Indicator "Ultima conectare" din `user.last_sign_in_at`.

### 6. Payment Methods (placeholder)
- Empty-state elegant cu mock card preview Visa/Mastercard, CTA "Adaugă card" disabled cu tooltip "Disponibil curând". Justificat: integrarea Stripe customer cards nu există încă.

### 7. Payout Methods (IBAN — există)
- Refac IbanForm într-un card separat: input IBAN cu format mask `RO## #### #### #### #### ####`, holder, badge status (verificat dacă completat), copy clar despre rolul IBAN-ului.

### 8. Notification Center
- Toggle-uri animate: SMS (existent — `sms_notifications_enabled`), Email rental updates, Email marketing, Chat email digest.
- Pentru cele fără coloană DB încă, salvez în `profiles` (adaug coloane prin migrare separată dacă userul confirmă; momentan doar SMS este real, restul disabled cu tooltip).

### 9. Support & Safety
- Linkuri rapide: Centru suport, Deschide ticket (`/tichete`), Politici, Plăți sigure.

### 10. Danger Zone
- Collapsible (Radix `Collapsible`) închis by default, border destructiv subtil.
- Conține: Dezactivare cont (logica existentă `request-account-deactivation`).

## Fișiere

**Noi:**
- `src/components/profile/account/AccountHeroCard.tsx`
- `src/components/profile/account/ProfileCompletionCard.tsx`
- `src/components/profile/account/SectionNav.tsx` (sticky tab nav cu scroll-spy)
- `src/components/profile/account/PersonalInfoSection.tsx`
- `src/components/profile/account/VerificationSection.tsx`
- `src/components/profile/account/SecuritySection.tsx`
- `src/components/profile/account/PaymentMethodsSection.tsx`
- `src/components/profile/account/PayoutMethodsSection.tsx`
- `src/components/profile/account/NotificationCenterSection.tsx`
- `src/components/profile/account/SupportSection.tsx`
- `src/components/profile/account/DangerZoneSection.tsx`
- `src/components/profile/account/AvatarCropperDialog.tsx`
- `src/hooks/useProfileCompletion.ts`

**Editate:**
- `src/components/profile/AccountTab.tsx` — devine orchestrator slim (compune secțiunile noi).
- `src/data/uxCopy.ts` — copy bilingv pentru toate secțiunile noi.

## Note tehnice
- Toate culorile prin design tokens (primary `#F59E0B`, semantic), border radius 12px.
- Framer Motion pentru progress bar + scale-in carduri (deja folosit în proiect).
- Mobile-first: stack vertical, sticky save bar, bottom-sheet (Drawer) pentru editări rapide pe mobile.
- Zero schimbări de schemă DB în acest pas. Coloane noi (notif preferințe, sesiuni, 2FA) sunt out-of-scope și marcate "În curând" în UI.

## Out of scope (necesită backend separat)
- 2FA real, login history, trusted devices, suspicious login detection.
- Stripe SetupIntent pentru carduri salvate.
- Push notifications (web push / FCM).
- Verificare IBAN automată.

Acestea pot fi următoarele sprinturi după ce shell-ul UI e aprobat.
