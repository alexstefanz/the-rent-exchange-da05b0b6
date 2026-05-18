## Problema

Când chiriașul apasă **Confirm primirea** pe pagina rezervării, se apelează doar RPC-ul `confirm_handover_received` care setează `handover_confirmed_at` și `status = 'active'`. Nu se declanșează nicio notificare către proprietar, deși edge function-ul `notify-rental-event` definește deja event-ul `handover_confirmed` (in-app + email pentru ambele părți, template `handover-confirmed`).

Același lucru e valabil și pentru funcția legacy `confirmHandover` din `ownerRentalsApi.ts` (folosită încă în `InspectionDialog`) — face update direct pe `rentals` fără să trimită notificare.

## Soluție

După ce confirmarea se face cu succes, invocăm `notify-rental-event` cu `event_key: "handover_confirmed"`, fire-and-forget (non-blocking, ca în `confirmReturn`).

### Fișiere modificate

- `src/features/rentals/rentalDetailPageApi.ts` → în `confirmHandoverReceived`, după RPC-ul reușit, apel best-effort către `supabase.functions.invoke("notify-rental-event", { body: { rental_id, event_key: "handover_confirmed" } })`.
- `src/features/rentals/ownerRentalsApi.ts` → același pattern în `confirmHandover` după update-ul reușit, pentru consistență (path-ul folosit de `InspectionDialog`).

Nu sunt necesare modificări de schemă, RPC sau edge function — `handover_confirmed` există deja în registry și template-ul `handover-confirmed` e deployed (am văzut în logs că funcționează pentru alte fluxuri).

## Validare

- Confirmare primire ca chiriaș → proprietarul primește notificare in-app + email (când domeniul va fi verificat) cu titlul „Predarea a fost confirmată".
- Idempotență păstrată: dacă RPC-ul răspunde fără modificare (deja confirmat), notificarea totuși se trimite o singură dată pentru că UI-ul nu redeschide dialogul.