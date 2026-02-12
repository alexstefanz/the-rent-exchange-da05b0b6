
# Flow End-to-End: Inchiriere -> Plata Test -> Notificare Email

## Rezumat
Vom face functional intregul flow de checkout cu plata de test (fara procesator de plati real), vom salva rezervarea in baza de date, si vom trimite notificari email ambilor utilizatori (chirias si proprietar) la crearea unei rezervari.

## Ce se schimba

### 1. Metoda de plata "Test Mode"
In `PaymentMethodDialog.tsx`, vom adauga o optiune vizibila **"Card de test"** care pre-completeaza automat formularul cu date fictive (4242 4242 4242 4242, 12/28, 123, Test User). Aceasta permite testarea rapida fara a introduce date manual.

### 2. Checkout functional - salvare rezervare in DB
Acum `handleConfirmReservation` doar seteaza `isConfirmed = true` fara a salva nimic. Vom:
- Integra `useAuth` in `Checkout.tsx` pentru autentificarea reala (inlocuire `LoginDialog` simulat cu auth real)
- La pasul de confirmare, crea o inregistrare in tabela `rentals` cu:
  - `product_id`, `renter_id` (user logat), `owner_id` (din produs)
  - `start_date`, `end_date`, `rental_days`, `daily_price`
  - `subtotal`, `platform_fee`, `owner_payout` (calculate automat)
  - `status: 'pending'`, `payment_status: 'pending'`, `payment_method`
- Crea o inregistrare in tabela `transactions` (tip: 'rental_payment')
- Crea o conversatie + mesaj initial catre proprietar (daca s-a completat mesajul)
- Crea notificari in tabela `notifications` pentru ambii utilizatori

### 3. Edge function pentru notificari email
Vom crea o edge function `send-rental-notification` care:
- Primeste datele rezervarii (rental_id)
- Fetche-aza detaliile rezervarii, produsului, chiriasului si proprietarului
- Trimite email ambilor utilizatori folosind Supabase Auth (Resend, integrat nativ)
- Email catre **proprietar**: "Ai o noua cerere de inchiriere pentru [produs]"
- Email catre **chirias**: "Cererea ta de inchiriere a fost trimisa pentru [produs]"

### 4. LoginDialog integrat cu auth real
`LoginDialog` foloseste acum login simulat. Il vom conecta la `useAuth` din `AuthContext` pentru login/signup real cu email si parola.

---

## Detalii Tehnice

### Edge Function: `supabase/functions/send-rental-notification/index.ts`
- Primeste `rental_id` via POST
- Foloseste `SUPABASE_SERVICE_ROLE_KEY` pentru a accesa datele
- Trimite email via `supabase.auth.admin.sendRawEmail()` sau `Deno fetch` catre Resend API
- Necesita secret `RESEND_API_KEY` pentru trimitere email

### Fisiere noi
| Fisier | Scop |
|--------|------|
| `supabase/functions/send-rental-notification/index.ts` | Edge function email |
| `src/features/rentals/rentalsApi.ts` | Creare rental + transaction in DB |

### Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `src/pages/Checkout.tsx` | Integrare auth real, salvare rental in DB, apel edge function |
| `src/components/checkout/PaymentMethodDialog.tsx` | Adaugare buton "Card de test" cu auto-fill |
| `src/components/checkout/LoginDialog.tsx` | Integrare cu `useAuth` (login/signup real) |
| `supabase/config.toml` | Adaugare config edge function cu `verify_jwt = false` |

### Flow tehnic
```text
[Utilizator selecteaza produs si perioada]
        |
        v
[Checkout: 4 pasi]
  1. Alege momentul platii
  2. Mesaj catre proprietar
  3. Metoda de plata (cu optiune Test Card)
  4. Review si Confirma
        |
        v
[handleConfirmReservation]
  -> INSERT into rentals (status: pending)
  -> INSERT into transactions (type: rental_payment)
  -> INSERT into conversations + messages (daca mesaj)
  -> INSERT into notifications (pentru ambii)
  -> CALL edge function send-rental-notification
        |
        v
[Edge Function]
  -> Fetch rental details cu service role
  -> Trimite email proprietar
  -> Trimite email chirias
        |
        v
[BookingConfirmation screen]
```

### Nota despre email
Pentru trimiterea de emailuri avem nevoie de un API key Resend. Inainte de implementare, te voi intreba daca doresti sa configurezi acest secret.
