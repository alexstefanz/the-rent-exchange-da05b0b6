# Specificație completă a fluxului de închiriere (prompt pentru aplicația mobilă)

## Ce livrez

Un singur fișier markdown în proiect: `docs/RENTAL_FLOW_SPEC.md`, scris în română, la nivel **full tehnic**, care poate fi dat direct ca prompt unei alte aplicații (Emergent / app nativ) ca să reproducă identic procesul Proprietar ↔ Chiriaș din web app.

Nu se modifică niciun fișier de cod, nicio funcție de backend, nicio bază de date. Doar documentație.

## Structura documentului

1. **Context și reguli de bază** — model escrow, comision 15%, roluri (proprietar / chiriaș / admin), sursele de adevăr (RPC-uri, edge functions, triggere).
2. **Modelul de date** — tabelul `rentals` cu toate coloanele relevante, `rental_inspections`, `rental_pv_documents`, `rental_status_history`, `transactions`, `wallet_ledger`, `notifications`.
3. **Mașina de stări** — diagramă ASCII cu `status` (`pending → confirmed → active → completed`, plus `cancelled`) și `payment_status` (`pending → paid/captured → refund_pending → refunded/failed`), cu ce declanșează fiecare tranziție și cine are dreptul să o facă.
4. **Pas cu pas, per etapă** — pentru fiecare din cei 7 pași ai timeline-ului:
   - ce vede chiriașul / ce vede proprietarul (ecran, card, badge)
   - butoanele exacte cu textul RO din `uxCopy.ts`
   - ce apel se face (RPC / edge function) și cu ce parametri
   - ce se schimbă în DB
   - ce notificări pleacă (email / SMS / in-app) și către cine
   - pop-up-urile care apar și condițiile lor
5. **Etape detaliate acoperite**:
   - Creare cerere + checkout (plată wallet vs. Stripe hold, calcul preț și comision)
   - Acceptare / refuz de către proprietar (`respond-rental-request`, refund automat la refuz)
   - Stabilire predare (`propose_pickup` / `confirm_pickup`, `pickup_agreed_at`)
   - PV de predare (minim 3 poze per parte, checklist, declarație, semnături, `confirm_rental_handover`)
   - Perioada activă + memento-uri de retur
   - PV de retur + captura plății + `confirm_rental_return`
   - Finalizare, payout proprietar, recenzii multi-criteriu
6. **Sub-fluxuri** — anulări (tier-uri FREE / LIMITED / LOCKED cu formule de refund), retur anticipat (ambele aprobări, recalcul subtotal), dispute (`open_rental_dispute`, blocare plată, rezolvare admin).
7. **Catalog complet de notificări** — tabel cu toate cele ~27 `event_key`, destinatar, canale, template email/SMS, plus regula de allow-list pentru emailurile către proprietar.
8. **Pop-up-uri și realtime** — `get_rental_popups`, condițiile de afișare, `renter_seen_confirmation`, canalele realtime la care trebuie să se aboneze aplicația mobilă.
9. **Checklist de paritate** — listă de verificat punct cu punct ca aplicația mobilă să nu aibă discrepanțe față de web.

## Detalii tehnice

Înainte de a scrie documentul, mai fac o trecere de verificare peste zonele rămase neconfirmate în explorare, ca specificația să fie exactă și nu aproximativă:

- `Checkout.tsx` — pașii exacți și ramura de plată din wallet
- schema `rental_pv_documents` + regulile de blocare a PV-ului după semnare
- numele reale ale triggerelor pe `rentals` (preț, restricții proprietar/chiriaș)
- sistemul de recenzii multi-criteriu (tabele `product_reviews` / `user_reviews`)
- payout / `wallet_ledger` / `withdrawal_requests`
- restul catalogului de template-uri din `notify-rental-event`
- componentele de UI din `src/components/dashboard` și `src/components/rentals` pentru textele exacte ale butoanelor

Documentul va cita nume reale de RPC-uri, edge functions, coloane și `event_key`-uri, astfel încât aplicația mobilă să apeleze exact aceleași endpoint-uri Lovable Cloud ca web app-ul — fără logică duplicată în client.
