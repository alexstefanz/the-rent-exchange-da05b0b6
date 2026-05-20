## Fix

În `src/lib/notificationCategory.ts`, funcția `getTypeIcon()` returnează iconul implicit al categoriei `urgent` (`AlertTriangle`) pentru `cancel_request_submitted`. Înlocuim cu un ceas (`Clock` din `lucide-react`) pentru a sugera „în revizuire / în așteptare".

Modificări:
1. Adaugă `Clock` în importul din `lucide-react`.
2. În `getTypeIcon()`, înainte de fallback, adaugă: dacă `t === "cancel_request_submitted"` → `Clock`.
3. Restul (categorizarea în `urgent` cu accent roșu) rămâne neschimbat — doar iconul se schimbă.

Nicio modificare în backend / edge functions.