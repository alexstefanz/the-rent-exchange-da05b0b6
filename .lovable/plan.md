## Problem

Notificarea "Identitate verificată ✓" duce către pagina de recenzii (`/recenzii`).

Cauză:
1. Trigger-ul DB `notify_user_kyc_decision` salvează link-ul `/profile` pentru notificarea `kyc_approved`.
2. În `src/components/profile/NotificationsTab.tsx`, `mapLink` are regula `if (link === "/profile") return "/recenzii"`, deci orice notificare cu `/profile` ajunge pe Recenzii.

## Fix

### 1. Migrație DB
Recreez funcția `public.notify_user_kyc_decision` astfel încât notificarea `kyc_approved` să folosească link-ul `/owner/new-product` (pagina "Adaugă produs / Start listing"). Restul branch-urilor rămân neschimbate.

### 2. `src/components/profile/NotificationsTab.tsx`
- Elimin regula `if (link === "/profile") return "/recenzii"` din `mapLink` (era fix vechi care acum trimite greșit notificarea KYC).
- Las restul mapării intactă.

### 3. (Opțional, consistent) `supabase/functions/_shared/transactional-email-templates/kyc-approved.tsx`
Schimb butonul din email din "Vezi contul meu" → `/profile` în "Adaugă primul tău produs" → `/owner/new-product`, astfel încât emailul și notificarea in-app să ducă în același loc.

## Rezultat
Click pe notificarea "Identitate verificată ✓" duce la `/owner/new-product` (Adaugă produs).
