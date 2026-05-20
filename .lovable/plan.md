## Fix

În `src/components/dashboard/LeaveReviewDialog.tsx` (linia 182), scoate toast-ul `toast.success("Mulțumim pentru feedback!")` care apare în colțul dreapta-jos după trimiterea unui review. Restul logicii (invalidate queries, închidere dialog, toast de eroare) rămâne intact — confirmarea vizuală e deja dată prin închiderea dialogului.

Nicio altă modificare.