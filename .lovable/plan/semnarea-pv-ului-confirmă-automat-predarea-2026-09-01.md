# Semnarea PV-ului confirmă automat predarea

## Situația actuală (verificată)

- **La returnare** lucrurile funcționează deja așa cum vrei: când proprietarul semnează PV-ul de retur, închirierea trece automat în „finalizat", iar plata se captează automat. Nu există pas suplimentar.
- **La predare** nu: chiar dacă ambele părți au semnat PV-ul de predare, chiriașul mai trebuie să apese încă o dată „Am primit produsul" ca rezervarea să devină activă. Regula din baza de date care făcea confirmarea automată a fost dezactivată la un moment dat și înlocuită cu acest pas manual.

## Ce se schimbă

Semnarea PV-ului de predare de către ambele părți = predare confirmată. Rezervarea devine automat activă, fără click suplimentar.

```text
ÎNAINTE:  PV predare semnat (proprietar + chiriaș) -> "Am primit produsul" -> Activ
DUPĂ:     PV predare semnat (proprietar + chiriaș) -> Activ
```

## Pași de implementare

1. **Backend** — se reactivează regula automată: la a doua semnătură pe PV-ul de predare se completează momentul predării și starea trece în „activ" (idempotent, fără efect dacă rezervarea e anulată/finalizată). Notificările existente de „predare confirmată" rămân neschimbate, declanșate de schimbarea de stare.
2. **Pagina rezervării** — se elimină cardul „Pasul 4 — Predare produs" cu butonul „Am primit produsul" și dialogul de confirmare a primirii. După semnare se trece direct la „Pasul 5 — Produsul este în folosire". Se scoate și textul cu auto-confirmarea în 24h, care nu mai are sens.
3. **Dashboard / carduri de acțiune** — se elimină acțiunile „Confirmă predarea" rămase (cardul principal de acțiune, cardurile smart din profil, pasul din dialogul de inspecție), astfel încât singura acțiune rămasă în etapa de predare să fie semnarea PV-ului.
4. **Texte** — se ajustează descrierile care mai spun că e nevoie de o confirmare separată după semnare.

## Detalii tehnice

- Migrație care restaurează corpul funcției `tg_pv_handover_progress`: la `phase = 'handover'` cu `owner_signed_at` și `renter_signed_at` non-null, setează `handover_confirmed_at = now()` și `status = 'active'` (doar dacă nu e deja `completed/cancelled/rejected/active`), cu `set_config('app.bypass_renter_lock','on',true)` ca la `tg_pv_return_progress`, ca să treacă de triggerele de protecție pe `rentals`.
- RPC-ul `confirm_handover_received` rămâne în DB (idempotent, folosit de eventuale fluxuri vechi/mobil), dar nu mai este apelat din UI web.
- Cron-ul `auto_confirm_overdue_handovers` devine no-op în practică; rămâne ca plasă de siguranță.
- Fișiere atinse: `src/pages/RentalDetailPage.tsx`, `src/components/dashboard/MainActionCard.tsx`, `src/components/dashboard/InspectionDialog.tsx`, `src/components/profile/dashboard/SmartCards.tsx`, `src/data/uxCopy.ts`.
