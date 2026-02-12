

# Implementare Flow Checkout + Plata Test + Email Notificari

## Pas 1: Configurare RESEND_API_KEY
Inainte de orice cod, voi solicita adaugarea cheii Resend ca secret securizat in backend. Aceasta va fi disponibila doar in backend functions, nu in codul frontend.

## Pas 2: Test Card in PaymentMethodDialog
Adaugam un buton **"Card de test"** care completeaza automat formularul cu:
- Numar: 4242 4242 4242 4242
- Expirare: 12/28
- CVV: 123
- Nume: Test User

## Pas 3: API pentru rezervari (`src/features/rentals/rentalsApi.ts`)
Functie `createRental()` care:
- Insereaza in tabela `rentals` (status: pending, payment_status: pending)
- Apeleaza edge function-ul pentru notificari si creare transaction/notifications

## Pas 4: Checkout functional (`src/pages/Checkout.tsx`)
- Inlocuim logica simulata cu salvare reala in DB
- Integram `useAuth` pentru utilizatorul curent
- La confirmare: apelam `createRental()` apoi edge function

## Pas 5: LoginDialog cu auth real (`src/components/checkout/LoginDialog.tsx`)
- Conectam la `useAuth` din `AuthContext`
- Login/signup real cu email si parola

## Pas 6: Edge Function (`supabase/functions/send-rental-notification/index.ts`)
- Primeste `rental_id` via POST
- Foloseste service role pentru a:
  - Citi detaliile rezervarii, produsului, chiriasului, proprietarului
  - Insera in `transactions` (rental_payment)
  - Insera in `notifications` (pentru ambii utilizatori)
  - Trimite email via Resend API catre proprietar si chirias
- Config in `supabase/config.toml`: `verify_jwt = false`

## Fisiere noi
| Fisier | Scop |
|--------|------|
| `supabase/functions/send-rental-notification/index.ts` | Edge function email + transactions + notifications |
| `src/features/rentals/rentalsApi.ts` | Creare rental in DB |

## Fisiere modificate
| Fisier | Ce se schimba |
|--------|---------------|
| `src/pages/Checkout.tsx` | Auth real, salvare rental, apel edge function |
| `src/components/checkout/PaymentMethodDialog.tsx` | Buton "Card de test" |
| `src/components/checkout/LoginDialog.tsx` | Auth real cu useAuth |
| `supabase/config.toml` | Config edge function |

## Ordine implementare
1. Adaugare secret RESEND_API_KEY
2. Creare edge function
3. Creare rentalsApi.ts
4. Modificare PaymentMethodDialog (test card)
5. Modificare LoginDialog (auth real)
6. Modificare Checkout.tsx (flow complet)
7. Deploy + testare

