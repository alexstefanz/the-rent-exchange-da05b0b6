## Schimbare

În `src/lib/notify.tsx`, funcția `notify.rental(...)` trece la:
- `position: "bottom-center"`
- `duration: 10000` (10 secunde, dacă nu e suprascris explicit prin parametru)

Restul toast-urilor globale (`success`, `error`, `info`) rămân pe `top-center` / 3s, conform configurației din `src/components/ui/sonner.tsx`. Doar cardul de tip „rental" (cu imaginea produsului) se mută jos-centru.

Nicio altă modificare.