## Account Hub Redesign — Plan

Pagina `AccountTab.tsx` a fost deja restructurată într-un hub cu secțiuni, dar nu atinge încă nivelul "premium marketplace" cerut (Airbnb/Revolut/Stripe). Acest plan finalizează redesign-ul cu accent pe ierarhie vizuală, trust, realtime și mobile-first.

### 1. Account Overview — card hero premium
Componentă nouă `AccountOverviewCard.tsx` afișată sus, full-width:
- Avatar mare cu inel gradient (primary → accent), buton cameră flotant
- Nume + handle + "Membru din {luna an}"
- Trust score vizual (cerc semicircular 0–100) + label ("Excelent / Bun / În progres")
- 4 trust pills inline: Email ✓, Telefon ✓, Identitate ✓/⏳/⚠, IBAN ✓/⚠
- Bara de progres "X% cont completat" cu următorul pas sugerat ca CTA ("Adaugă IBAN →")
- Stats row: rentals completed, review score (★), response rate, member since

### 2. Section Nav — sticky premium
- Pe desktop: tab bar sticky sub header, scroll-spy activ, indicator gradient sub tab activ
- Pe mobile: chips orizontale scroll-snap, plus un FAB "Salvează" sticky bottom când există modificări nesalvate

### 3. Personal Information — card editorial
- Layout pe 2 coloane (desktop) / stack (mobile)
- Live validation cu iconițe inline (verde/roșu) și mesaje subtle
- "Salvează" cu animație succes (checkmark draw)
- Sub fotografie: hint "Adaugă o fotografie clară pentru mai multă încredere"
- Cropper modern: dialog `AvatarCropperDialog.tsx` cu zoom slider, pan, preview cerc

### 4. Verification Center — redesign KYC
- Înlocuiește "LEVEL 1/2/3" cu carduri status:
  - "Identitate verificată" (verde, BadgeCheck)
  - "În curs de verificare" (amber, pulse animation)
  - "Verificare necesară pentru închirieri >X RON" (slate)
- Mini-stepper orizontal: Date → Document → Selfie → Aprobat
- Trust copy: "De ce verificăm identitatea" — accordion scurt

### 5. Security Center — evidențiat
- Card cu fundal subtle gradient (slate)
- Listă acțiuni cu iconițe: Schimbă parola (activ), 2FA (badge "În curând"), Sesiuni active (placeholder), Login history (placeholder), Trusted devices (placeholder)
- Fiecare item: icon + titlu + descriere + chevron / status pill
- Pulse pe badge-uri pending

### 6. Payments vs Payouts — separare clară
- **Payment Methods**: empty state cu mock card visual (Visa/MC), CTA "Adaugă card" (disabled cu tag "În curând" — Stripe SetupIntent nu e implementat). Notă onestă.
- **Payout Methods**: form IBAN cu mască RO## #### #### #### #### ####, status badge (Verificat / În verificare / Lipsă), copy clar despre folosire

### 7. Notification Center
- Grupuri: Tranzacționale (always on, disabled toggle), Rental updates, Chat, Marketing
- Toggle-uri animate (framer-motion), toast la modificare, debounce save 500ms
- Canale per grup: Email / SMS (real) / Push (badge "În curând")

### 8. Support & Safety
- 3 carduri compacte: Centru ajutor, Deschide ticket, Plăți sigure (link explicativ)
- Iconițe în cerc primary/10, hover lift

### 9. Danger Zone
- Collapsible, default închis, border destructive subtle
- Dezactivare cont (existent), copy clar despre consecințe

### 10. Realtime & micro-interactions
- Subscribe la `profiles` pentru user curent → invalidare React Query la UPDATE (sincronizare cross-device)
- Skeleton loaders pentru toate secțiunile la mount
- Framer-motion: fade+slide-in pe secțiuni la scroll, stagger pe trust pills
- Toast confirmations cu iconițe contextuale

### Files

**New:**
- `src/components/profile/account/AccountOverviewCard.tsx`
- `src/components/profile/account/TrustScoreRing.tsx`
- `src/components/profile/account/SectionNav.tsx`
- `src/components/profile/account/PersonalInfoSection.tsx`
- `src/components/profile/account/VerificationSection.tsx`
- `src/components/profile/account/SecuritySection.tsx`
- `src/components/profile/account/PaymentMethodsSection.tsx`
- `src/components/profile/account/PayoutMethodsSection.tsx`
- `src/components/profile/account/NotificationCenterSection.tsx`
- `src/components/profile/account/SupportSection.tsx`
- `src/components/profile/account/DangerZoneSection.tsx`
- `src/components/profile/account/AvatarCropperDialog.tsx`
- `src/components/profile/account/MobileSaveBar.tsx`
- `src/hooks/useProfileCompletion.ts`
- `src/hooks/useProfileRealtime.ts`

**Edited:**
- `src/components/profile/AccountTab.tsx` → orchestrator slim (~150 linii)
- `src/data/uxCopy.ts` → copy bilingv pentru toate label-urile noi

### Out of scope (necesită backend separat)
- 2FA real, login history, trusted devices, suspicious login detection
- Stripe SetupIntent pentru payment methods
- Push notifications (web push / FCM)
- Email OTP după 30 zile inactivitate

Aceste zone vor avea UI complet cu badge "În curând" și sunt pregătite pentru wiring viitor.
