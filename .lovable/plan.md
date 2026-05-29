## Problem

1. Toast-ul pentru `kyc_submitted` ("Verificare identitate trimisă") apare cu icon `XCircle` roșu, sugerând respingere — ar trebui să fie un icon KYC galben (cerere în curs de revizuire).
2. Pozițiile toast-urilor sunt inconsistente: `sonner` global e setat pe `bottom-right`, dar `notify.tsx` forțează `bottom-center`. Toate notificările trebuie să apară uniform tip toast în dreapta jos.

## Cauză

În `src/lib/notify.tsx`, `variantFromNotificationType("kyc_submitted")`:
- nu match-uiește pe `confirm/approved`, nici pe `reject/cancel`
- `categorize("kyc_submitted")` din `notificationCategory.ts` returnează `urgent` (fallback pe `t.includes("kyc")`)
- → mapat pe `cancellation` (XCircle, roșu)

## Plan

### 1. `src/lib/notify.tsx`
- Adaugă o nouă variantă `kyc` cu:
  - `Icon: ShieldCheck` (lucide)
  - paletă galbenă: `halo: "bg-amber-500/15"`, `icon: "text-amber-600"`, `accent: "bg-amber-500"`, `badgeBg: "bg-amber-500"`
- În `variantFromNotificationType`, înainte de regula `reject/cancel`, adaugă o ramură explicită pentru KYC "în așteptare":
  - `kyc_submitted`, `kyc_pending`, `kyc_under_review`, `kyc_needs_manual_review` și orice tip care conține `kyc` și nu este `approved/verified/rejected` → `"kyc"`
  - `kyc_approved` / `kyc_verified` rămân `confirmation` (verde)
  - `kyc_rejected` rămâne `cancellation` (roșu)
- Schimbă `position` în apelul `toast.custom` din `"bottom-center"` în `"bottom-right"` pentru ca toate toast-urile (notify wrapper + sonner direct) să apară uniform în dreapta jos.

### 2. `src/lib/notificationCategory.ts`
- Pentru consistență (icon în NotificationCenter dropdown), când `type === "kyc_submitted"` / `kyc_pending` / `kyc_under_review`, returnează stilul KYC galben (sau categoria `system` cu icon `ShieldCheck` ambră). Concret:
  - Adaug în `getTypeIcon` mapare `kyc_submitted` → `ShieldCheck`
  - Adaug o categorie ușoară de "kyc pending" (sau reutilizez stilul existent `success` dar cu paletă ambră) — preferabil un mic style override în map: nou case în `categorize` care întoarce o nouă categorie `"kyc"` cu halo/icon ambră.
- Astfel notificarea apare cu același icon/culoare și în dropdown, și în toast.

### 3. Verificare regresii
- Toast-uri existente care folosesc `notify.success/error/confirmation/...` continuă să funcționeze (doar poziția se schimbă din `bottom-center` în `bottom-right`).
- `RentalPopupManager` (modal centrat) nu este afectat.
- `sonner` global rămâne `bottom-right` → toate toast-urile sunt acum aliniate.

## Out of scope
- Schimbări la backend / tipuri de notificări noi.
- Modificări la `RentalRequestPopup` (modal explicit, nu toast).
