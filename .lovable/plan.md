## Problem

În `src/lib/notificationCategory.ts`, funcția `categorize()` mapează orice tip care conține "kyc" la categoria `urgent` → halo/icon/accent roșu. Deci notificarea `kyc_approved` ("Identitate verificată") apare cu accent roșu, deși e o confirmare pozitivă.

## Fix

În `src/lib/notificationCategory.ts`:

1. Adaugă o nouă categorie `success` în `NotificationCategory` + `STYLES`, cu paletă verde (`bg-emerald-100` / `text-emerald-600` / `bg-emerald-500`), icon `ShieldCheck`, labels „Verificat" / „Verified".
2. În `categorize()`, înainte de regula existentă cu `kyc`, adaugă un check explicit: tipurile `kyc_approved` / `kyc_verified` / care conțin `approved`/`verified` legate de KYC → returnează `success`. Restul cazurilor KYC (ex. `kyc_rejected`, `kyc_action_needed`) rămân `urgent`.
3. Fără modificări în `NotificationCard` — folosește deja `getCategoryStyle(notification.type)`.

Nicio altă schimbare de logică sau backend.