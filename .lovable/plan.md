## Plan: repar eroarea Stripe „Edge Function returned a non-2xx status code”

### Ce am găsit
- Checkout-ul Stripe se creează corect, dar confirmarea plății eșuează după redirect.
- Funcția `verify-stripe-payment` încă întoarce eroare când încearcă să actualizeze rezervarea: `Not allowed to modify payment/financial rental fields`.
- Cauza probabilă: triggerul de protecție pe `rentals` nu recunoaște în mod stabil actualizările făcute de funcțiile backend cu cheia internă, deci blochează câmpurile de plată.
- Există și o problemă secundară: `send-rental-notification` încearcă să creeze conversația printr-un RPC care cere utilizator autentificat și loghează `not authenticated`. Asta nu pare să fie eroarea toastului din imagine, dar trebuie făcută non-blocantă/sigură pentru fluxul post-plată.

### Implementare
1. **Migrare backend pentru triggerul de protecție**
   - Voi actualiza `enforce_rentals_participant_update()` astfel încât funcțiile backend trusted să poată modifica doar câmpurile necesare procesării plății.
   - În loc să depindă doar de `current_setting('request.jwt.claim.role')`, voi adăuga o verificare mai robustă pentru rolul intern folosit de Data API / PostgREST.
   - Mențin blocarea pentru utilizatorii normali: renter/owner nu pot modifica manual câmpuri financiare.

2. **Deploi funcțiile relevante**
   - Voi redeploya funcțiile de plată afectate, în special `verify-stripe-payment`; dacă e nevoie, și `create-checkout-session` / `create-test-checkout-session`.

3. **Îmbunătățesc mesajul de eroare din interfață**
   - Pe pagina de succes checkout, în loc de mesaj generic `Edge Function returned a non-2xx status code`, utilizatorul va vedea un mesaj clar în română și va putea reveni la rezervare / încerca din nou.

4. **Verificare**
   - Voi testa funcția de verificare pe cea mai recentă sesiune Stripe disponibilă în rezervări.
   - Voi verifica logurile pentru `verify-stripe-payment` după schimbare.
   - Voi confirma că rezervarea trece în `payment_status = authorized` sau `paid` și că nu mai apare toastul generic.

### Nu schimb
- Nu modific logica de prețuri/comision.
- Nu relaxez permisiunile pentru utilizatori normali.
- Nu schimb flow-ul escrow hold-and-capture Stripe.