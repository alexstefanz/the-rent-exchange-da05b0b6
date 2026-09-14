# Login Google — stare verificată acum

## Ce funcționează

- Login-ul folosește credențialele tale Google (client ID `582322940802-…`), nu pe cele Lovable.
- Adresa de întoarcere este corectă: `https://tsffyecastudajmgrckt.supabase.co/auth/v1/callback`.
- Branding-ul a fost salvat: pe ecranul Google apar deja linkurile tale de Confidențialitate și Termeni.
- Redirecturile mobile (`rentli://auth/callback`, `rentli://**`, `exp://**`) sunt active, deci fluxul pe telefon merge.

## Ce nu apare încă

Pe ecranul Google scrie „to continue to tsffyecastudajmgrckt.supabase.co” în loc de „Rentli”.
Google afișează acolo domeniul adresei de întoarcere până când brandul este **verificat**. Nu este ceva ce se poate rezolva din cod sau din aplicație.

## Opțiuni

**A. Verificare brand la Google (recomandat, gratuit)**
- Google Cloud Console → OAuth consent screen → Branding: asigură-te că ai App name „Rentli”, logo încărcat, homepage `https://www.rentli.ro`, Authorized domains `rentli.ro` **și** `supabase.co`.
- Audience → „Publish app” (ieșire din Testing).
- Verification Center → trimite aplicația la verificare (Google cere dovada proprietății domeniului `rentli.ro` prin Search Console — este deja conectat).
- După aprobare (de la câteva zile la 2-3 săptămâni) Google va afișa „Rentli” și logo-ul.

**B. Fără verificare**
- Rămâne textul cu adresa tehnică. Login-ul funcționează normal, fără avertismente pentru utilizatori, pentru că scope-urile folosite (email, profil) nu sunt sensibile.

## Fără modificări în aplicație

Codul de login rămâne neschimbat, pe web și pe mobil. Nimic de implementat de partea mea în acest moment.
