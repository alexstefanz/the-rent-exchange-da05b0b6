# Configurare redirecturi OAuth mobile pentru Google

## Scop
Permite logarea cu Google în aplicația mobilă prin adăugarea URL-urilor de redirect necesare în backend-ul gestionat de Lovable Cloud.

## Context verificat
- Proiectul folosește Lovable Cloud, deci dashboard-ul Supabase nu este accesibil direct.
- Aplicația mobilă folosește `supabase-js` direct și apelează `supabase.auth.signInWithOAuth` cu `redirectTo = Linking.createURL("/auth/callback")`.
- Pe web, Google OAuth funcționează deja.
- Mobile nativ generează `rentli://auth/callback`, iar în Expo Go URL-ul începe cu `exp://`.

## Pași

1. **Confirmă valorile exacte** de redirect folosite în codul mobil (`mobile-template/lib/auth.tsx`):
   - `rentli://auth/callback`
   - `rentli://**`
   - `exp://**`
2. **Verifică** că providerul Google rămâne activ în Lovable Cloud.
3. **Pregătește cererea către suportul Lovable** cu:
   - domeniul publicat (`rentli.ro`);
   - URL-urile exacte de adăugat (fără a șterge redirecturile web existente);
   - mențiunea că e pentru Google OAuth pe iOS/Android.
4. **Dacă Lovable nu poate adăuga scheme URI personalizate**, evaluează alternativele:
   - migrare pe propriu Supabase (BYOC) cu control deplin;
   - sau un pod web de OAuth cu deep-link înapoi în aplicație.
5. **După actualizarea din backend**, testează:
   - logare Google în Expo Go;
   - logare Google în build nativ iOS/Android;
   - logare Google pe web să continue să meargă.

## Ce nu face acest plan
- Nu adaugă cod nou în aplicație; nu sunt necesare modificări dacă schemele coincid.
- Nu migrează proiectul pe Supabase propriu decât dacă suportul Lovable confirmă că nu poate adăuga redirecturi mobile.
