## Plan

1. **Restrâng detecția de telefon**
   - Voi modifica `containsContactInfo` astfel încât să marcheze ca telefon doar formate realiste, precum `07xx xxx xxx`, `+40...`, `0040...` sau secvențe compacte de 9-15 cifre.
   - Voi evita ca dimensiuni, ani, modele sau specificații tehnice din titlu/descriere să fie interpretate drept numere de telefon.

2. **Păstrez blocarea reală pentru email și link-uri**
   - Emailurile și domeniile/link-urile reale vor rămâne blocate.
   - Nu voi relaxa regula de comunicare internă Rentli, doar voi elimina false-positive-urile.

3. **Verific scenarii concrete**
   - Voi testa exemple valide de anunț: modele cu cifre, dimensiuni, greutate, generații, coduri produs.
   - Voi testa și exemple interzise: telefon, email, `www...`, link cu domeniu.

4. **Ating doar fișierele relevante**
   - Schimbarea va fi concentrată în `src/lib/inputValidation.ts`, fără modificări de UI sau backend.