## Ce se schimbă

Cardul galben „Mod admin — testare" cu butonul „Plătește cu card de test (4242)" e momentan pe `/checkout`, la pasul de trimitere a cererii. La acel pas însă nu se face nicio plată reală — cererea doar se trimite proprietarului. Plata propriu-zisă apare în `RentalDetailPage`, după ce proprietarul acceptă (cardul „Proprietarul a acceptat cererea" cu butonul „Plătește X RON"). Acolo trebuie mutat și cardul de test.

## Modificări

**1. `src/pages/Checkout.tsx`**
- Șterg blocul `{isAdmin && (...)}` cu cardul galben de testare (liniile ~264–287).
- Șterg handler-ul `handleStripeTestCheckout` și import-ul `createRentalWithStripeTestCheckout` care nu mai sunt folosite.
- Curăț import-urile rămase neutilizate (`FlaskConical`, `useIsAdmin` dacă nu mai e folosit altundeva în fișier).

**2. `src/pages/RentalDetailPage.tsx`**
- Adaug `useIsAdmin` pentru utilizatorul curent.
- În secțiunea `needsPayment` (cardul „Proprietarul a acceptat cererea"), adaug sub butonul „Plătește X RON" un sub-card galben identic vizual cu cel actual din checkout, vizibil doar dacă `isAdmin` e true.
- Butonul de test apelează edge function-ul existent `create-test-checkout-session` direct cu `rental.id` (rental-ul există deja, nu se mai creează unul nou) și redirectează la URL-ul Stripe returnat. Marchez `is_test_payment` rămâne setat de edge function ca până acum.
- Afișez aceeași notă „Nu se debitează bani reali. Rezervarea va fi marcată „Test"...".

## Detalii tehnice

- Funcția `createRentalWithStripeTestCheckout` din `rentalsApi.ts` creează un rental nou + sesiune. În noul flux rental-ul există deja, deci în `RentalDetailPage` voi invoca direct `supabase.functions.invoke("create-test-checkout-session", { body: { rental_id: rental.id } })`, păstrând fallback-ul de eroare.
- Butonul de test e ascuns dacă `rental.payment_status` nu mai e `pending` (folosim deja flag-ul `needsPayment`, deci e suficient să fie sub el).
- Nu schimb edge function-ul `create-test-checkout-session` — semnătura cu `rental_id` rămâne aceeași.

## Ce NU se schimbă

- Logica de plată reală (`payForConfirmedRental`).
- Edge functions Stripe.
- Fluxul cererii pentru utilizatori non-admin.
