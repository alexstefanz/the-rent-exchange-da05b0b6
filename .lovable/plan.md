

## Plan: Fix bugs descoperite în testarea E2E (Critical + Medium + Low)

### Bug #1 — CRITICAL: Owner payouts nu apar în balanță

**Cauză**: În `supabase/functions/capture-rental-payment/index.ts`, tranzacțiile `owner_payout` sunt create cu `status='pending'`, dar `BalanceCard.tsx` și logica de balanță (`useUserStatistics`, `EarningsTab`) numără doar `status='completed'`.

**Fix**:
- Modific `capture-rental-payment/index.ts` → la inserarea tranzacției `owner_payout`, setez `status='completed'` și `processed_at=now()`
- Astfel, în momentul în care proprietarul confirmă returnarea (pasul 6 — Finalizat) și fondurile sunt capturate de la Stripe, suma intră imediat în balanța proprietarului
- Restul logicii rămâne: proprietarul cere retragere via `withdrawal_requests`, admin aprobă manual

### Bug #2 — MEDIUM: `get_booked_dates` ignoră rezervările `pending`

**Cauză**: RPC-ul `get_booked_dates` include doar `status IN ('confirmed', 'active')`. O rezervare `pending` (cu plată autorizată dar neacceptată încă de proprietar) NU blochează datele → doi chiriași pot trimite cereri suprapuse pe aceleași date.

**Fix** (migrare SQL):
- Actualizez funcția `get_booked_dates` să includă și `pending` cu condiția `payment_status='authorized'` (plata e ținută în escrow):
```sql
WHERE r.product_id = p_product_id
  AND (
    r.status IN ('confirmed', 'active')
    OR (r.status = 'pending' AND r.payment_status = 'authorized')
  )
```
- Astfel, datele sunt blocate vizual din momentul în care un chiriaș a făcut plata, nu doar după acceptare
- Excludem `cancelled`, `completed`, `refunded` care nu mai țin datele ocupate

### Bug #3 — LOW: Rentals lungi capturează imediat (lipsă escrow)

**Cauză**: În `create-checkout-session/index.ts`, condiția folosește `capture_method: 'manual'` doar pentru rentaluri ≤7 zile (limita Stripe Auth). Pentru rentaluri >7 zile, plata e capturată imediat → pierdere control escrow.

**Fix**:
- Verific implementarea curentă în `create-checkout-session`
- Pentru rentaluri >7 zile, aplic strategia recomandată Stripe: capture_method='manual' + reautorizare automată via webhook înainte de expirarea celor 7 zile
- **Implementare simplificată (recomandată acum)**: setez explicit `capture_method='manual'` indiferent de durată; pentru rentaluri >7 zile adaug o **notificare proprietar + log** ca să fie monitorizat cazul. Reautorizarea automată o lăsăm ca task viitor (necesită Stripe webhook + flow complex)
- Alternativ, dacă logica curentă deja are fallback la capture imediat pentru >7 zile: documentez explicit și adaug warning în UI checkout pentru rentaluri lungi

### Acțiuni adiacente (consecințe ale fix-urilor)

- **Invalidare query**: după fix #1, balanța se actualizează automat prin invalidarea queries existente la `confirmReturn` (`my-rentals`, `ownerRentals`, `user-balance`)
- **Backfill istoric** (Bug #1): tranzacțiile `owner_payout` deja create cu `status='pending'` rămân blocate. Fac UPDATE manual prin migrare:
```sql
UPDATE transactions 
SET status = 'completed', processed_at = COALESCE(processed_at, now())
WHERE type = 'owner_payout' 
  AND status = 'pending'
  AND rental_id IN (SELECT id FROM rentals WHERE status = 'completed');
```

### Verificare după fix

Pentru fiecare bug:
1. Rulez query SQL să confirm starea așteptată în DB
2. Verific log-urile edge functions pentru `capture-rental-payment`
3. Test rapid manual: încarc balanța proprietarului în UI după un rental completat

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/functions/capture-rental-payment/index.ts` | `status='completed'` + `processed_at=now()` la insert `owner_payout` |
| Migrație SQL nouă | Update funcție `get_booked_dates` să includă `pending` + `authorized` |
| Migrație SQL — backfill | Update tranzacțiilor istorice `owner_payout` blocate în `pending` |
| `supabase/functions/create-checkout-session/index.ts` | Verific + ajustez logica `capture_method` pentru rentaluri lungi |

### Limitări recunoscute
- Fix #3 nu rezolvă complet limita Stripe de 7 zile pentru capture_method='manual'. Soluția completă (reautorizare via webhook) e un task de sine stătător. Aplicăm acum doar îmbunătățirea minimă (notificare/log) — vrei să planific și soluția completă separat?

