

## Plan: Tab "Status plăți" pentru depanare tranzacții rental

### Context
Vrei un panou de diagnostic în timp real care arată întregul ciclu de viață al plății pentru un rental: de la autorizare până la capture/refund/payout. Util pentru admin (și opțional pentru proprietar/chiriaș) să identifice rapid blocaje sau discrepanțe între ce e în Stripe și ce e în baza de date.

### Acces
- **Admin**: vede tab-ul pentru orice rental (în `/admin/rezervari` la detaliu)
- **Proprietar/Chiriaș**: vede o versiune simplificată read-only pe rentalul propriu (în `RentalsTab` / `LendingsTab` — colaps/dialog "Status plată")

### Date afișate

#### 1. Sumar status (badge-uri colorate)
| Câmp | Sursă | Culori |
|---|---|---|
| Status rental | `rentals.status` | pending=galben, confirmed=albastru, active=verde, completed=gri, cancelled=roșu |
| Status plată | `rentals.payment_status` | pending/authorized/captured/refunded |
| Stripe sync | calcul live din Stripe API | ✅ sincronizat / ⚠️ discrepanță |

#### 2. Timeline cronologic (vertical) cu evenimente
Pentru fiecare moment cheie afișez timestamp + descriere + sursă:
- `created_at` → "Cerere creată" (sursă: rental insert)
- `authorized_at` → "Plată autorizată ($X RON pe card)" (sursă: Stripe Checkout completat)
- `confirmed_at` → "Cerere acceptată de proprietar"
- `handover_confirmed_at` → "Predare confirmată"
- `captured_at` → "Fonduri capturate de la Stripe"
- `return_confirmed_at` → "Returnare confirmată"
- `completed_at` → "Tranzacție finalizată"
- `refunded_at` → "Refund executat"
- `cancelled_at` → "Cerere anulată"

#### 3. Detalii Stripe (live fetch via edge function)
Pentru rentalurile cu `payment_intent_id`:
- Payment Intent ID (clickabil → Stripe Dashboard)
- Status PI (requires_capture, succeeded, canceled, etc.)
- Amount autorizat vs capturat vs refunded
- Charge ID + receipt URL
- Last error (dacă există)
- Card brand + last4 (din `payment_method_details`)

#### 4. Tranzacții asociate (din tabela `transactions`)
Tabel cu coloanele: tip (platform_fee/owner_payout/refund), amount, status, created_at, processed_at, description.

#### 5. Detector de discrepanțe
Comparație automată DB vs Stripe cu warning-uri:
- ⚠️ DB zice `authorized` dar Stripe zice `succeeded` (capturat necontrolat)
- ⚠️ DB zice `captured` dar nu există tranzacție `owner_payout`
- ⚠️ Există `refunded_at` dar Stripe nu are refund
- ✅ Totul sincronizat

### Edge function nouă: `get-rental-payment-status`

**Path**: `supabase/functions/get-rental-payment-status/index.ts`

**Input**: `{ rental_id: string }`

**Logică**:
1. Verifică auth (user e renter/owner sau admin)
2. Citește `rentals` row + `transactions` asociate
3. Dacă există `payment_intent_id`, apelează Stripe API: `stripe.paymentIntents.retrieve(pi_xxx, { expand: ['latest_charge', 'latest_charge.refunds'] })`
4. Calculează discrepanțe (compară amounts și statuses)
5. Returnează obiect structurat:
```json
{
  "rental": { ...db fields },
  "transactions": [...],
  "stripe": {
    "payment_intent": { id, status, amount, amount_received, amount_capturable },
    "charge": { id, amount_refunded, receipt_url, payment_method_details },
    "refunds": [...]
  },
  "discrepancies": [
    { "severity": "warning", "message": "..." }
  ],
  "events": [
    { timestamp, label, source, details }
  ]
}
```

### Componenta UI: `RentalPaymentStatus`

**Path**: `src/components/admin/RentalPaymentStatus.tsx` (folosit și de tab-urile non-admin în versiune simplificată via prop `mode="user" | "admin"`)

**Layout**:
- Header: badge-uri sumar + buton "Reîmprospătează" (refetch)
- Tab-uri interne (cu shadcn `Tabs`):
  1. **Cronologie** — vertical timeline cu evenimente
  2. **Stripe** — card cu detalii Payment Intent + Charge (doar admin)
  3. **Tranzacții** — tabel `transactions` (doar admin)
  4. **Discrepanțe** — listă warnings (doar admin) cu CTA "Acționează" pentru fix-uri viitoare

**Real-time**:
- Subscribe la canalul Supabase Realtime pe tabela `rentals` filtrat pe `id=rental_id` și `transactions` filtrat pe `rental_id`
- La orice modificare → invalidare query → refetch automat
- Indicator vizual "🔴 Live" în colțul header-ului

### Unde apare tab-ul

#### Admin (`src/pages/admin/AdminReservations.tsx`)
- Adaug coloană "Acțiuni" cu buton 👁️ "Detalii" → deschide dialog full-screen cu rental details
- În dialog: tab-uri "Sumar | Status plăți | Inspecții | Audit log"
- Tab "Status plăți" → `<RentalPaymentStatus rentalId={...} mode="admin" />`

#### Proprietar (`src/components/dashboard/LendingsTab.tsx`)
- Pe fiecare card de rental: collapsible/popover "Status plată" → versiune `mode="user"` (fără Stripe raw + fără discrepanțe)

#### Chiriaș (`src/components/dashboard/RentalsTab.tsx`)
- Similar — collapsible "Status plată" cu cronologie + sumar

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/functions/get-rental-payment-status/index.ts` | **NOU** — fetch + diff DB vs Stripe |
| `src/features/rentals/paymentStatusApi.ts` | **NOU** — wrapper client + tipuri TS |
| `src/hooks/queries/useRentalPaymentStatus.ts` | **NOU** — useQuery + realtime subscribe |
| `src/components/admin/RentalPaymentStatus.tsx` | **NOU** — componentă reutilizabilă admin/user |
| `src/components/admin/AdminRentalDetailDialog.tsx` | **NOU** — dialog cu tab-uri pe rental |
| `src/pages/admin/AdminReservations.tsx` | Adaug buton "Detalii" + dialog |
| `src/components/dashboard/LendingsTab.tsx` | Adaug collapsible "Status plată" pe card |
| `src/components/dashboard/RentalsTab.tsx` | Adaug collapsible "Status plată" pe card |
| `src/data/uxCopy.ts` | Texte RO/EN: labels timeline, statusuri, warnings |

### Securitate
- Edge function verifică explicit că user e participant la rental sau admin → 403 altfel
- Detaliile sensibile Stripe (raw PaymentIntent, refunds) returnate **doar** pentru admin
- Nu expun `client_secret` sau date complete de card (doar brand + last4)

### Note
- Realtime subscription e ieftin (un canal per rental deschis)
- Stripe API call cached 30s în client (evităm rate limit la refresh repetat)
- Tab-ul nu necesită modificări în webhook-uri existente — citește live din Stripe la cerere

