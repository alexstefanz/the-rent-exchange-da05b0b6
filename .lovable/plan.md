## Centrare pop-up cu fundal blurat

Modific `RentalPopupManager.tsx` pentru a transforma containerul fixat în bottom-right într-un overlay full-screen centrat, cu fundal întunecat și blur — exact ca în imaginea atașată.

### Modificări

**`src/components/rentals/RentalPopupManager.tsx`**
- Înlocuiesc wrapper-ul actual (`fixed inset-x-0 bottom-4 ... sm:bottom-6 sm:right-6`) cu un overlay full-screen:
  - `fixed inset-0 z-[120] flex items-center justify-center p-4`
  - Fundal: `bg-black/60 backdrop-blur-md` cu animație `animate-in fade-in`
  - Click pe fundal = `handleDismiss` (același comportament ca pe X)
- Cardul pop-up rămâne `pointer-events-auto` și oprește propagarea click-ului (`onClick={(e) => e.stopPropagation()}`) ca să nu se închidă când apeși pe el.

**`src/components/rentals/RentalRequestPopup.tsx`**
- Fără modificări la structură. Eventual ajustez animația de intrare de la `slide-in-from-bottom-6` la `zoom-in-95` ca să se potrivească cu poziționarea centrată.

### Ce rămâne la fel
- Logica de queue, realtime, accept/refuză/chat — neschimbată.
- Persistența și RPC-urile — neschimbate.
- Conținutul vizual al cardului (badge, avatar, produs, perioadă, sumă, mesaj, butoane).

### Ce NU include
- Nu transform în Dialog shadcn (overhead inutil; overlay-ul custom e suficient și păstrează animațiile actuale).
- Nu blochez scroll-ul body-ului (overlay-ul deja prinde input-ul; opțional pot adăuga dacă ceri).