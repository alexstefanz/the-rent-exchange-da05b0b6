## Plan

1. **Unific sistemul de toasturi**
   - Păstrez un singur Toaster montat global: `src/components/ui/sonner.tsx` prin `src/App.tsx`.
   - Nu reactivez vechiul toaster Radix; `useToast` rămâne doar bridge către sistemul actual.

2. **Elimin cauza fundalului dublu**
   - Toasturile custom din `src/lib/notify.tsx` au deja propriul card cu background/border/shadow.
   - Wrapper-ul Sonner aplică și el background/border/shadow, ceea ce produce efectul din screenshot.
   - Voi face wrapper-ul Sonner transparent doar pentru `toast.custom(...)`, astfel încât să rămână un singur card vizibil.

3. **Păstrez toasturile simple corecte**
   - `toast.success(...)`, `toast.error(...)` și celelalte apeluri directe din admin/user flows vor păstra styling-ul standard Sonner, fără card interior suplimentar.
   - Nu schimb textele, logica de business sau comportamentul notificărilor.

4. **Curăț compatibilitatea legacy**
   - Verific ca apelurile prin `useToast()` să treacă în continuare prin `notify`, dar fără wrapper dublat.
   - Vechiul `src/components/ui/toaster.tsx` rămâne nemontat și nu va genera notificări suprapuse.

5. **Verificare după implementare**
   - Testez vizual cel puțin un toast custom de succes, un toast custom de eroare și un toast direct Sonner.
   - Confirm că fiecare apare ca un singur card, fără fundal/chenar dublu.