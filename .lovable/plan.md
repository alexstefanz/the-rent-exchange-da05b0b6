
## Plan: Eliminare opțiune „Plătește 0 RON acum"

### Ce se schimbă

**Fișier: `src/pages/Checkout.tsx`**

1. **Eliminare Step 1** (selecția metodei de plată — „Plătește acum" / „Plătește mai târziu") — tot blocul cu RadioGroup dispare
2. **Reducere la 2 pași**: Mesaj către proprietar → Plată cu cardul
3. Variabila `paymentOption` și logica `pay-later` / `pay-now` se elimină complet
4. `currentStep` pornește de la 1, dar acum Step 1 = Mesaj, Step 2 = Plată
5. Steps array devine `[messageStep, paymentStep]` (2 elemente)
6. Se elimină și `payLaterDate` care nu mai e necesar

### Rezultat
Utilizatorul vede doar 2 pași: scrie un mesaj opțional → plătește cu cardul via Stripe. Fără alte opțiuni de plată.
