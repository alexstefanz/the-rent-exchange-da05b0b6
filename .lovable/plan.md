# Verificare redirecturi mobile pentru login Google

## Stare curentă

Login-ul cu Google funcționează pe web (`rentli.ro` / `www.rentli.ro`).
Rămâne de confirmat că backend-ul are configurată adresa de întoarcere în aplicația mobilă, altfel utilizatorul este aruncat pe site-ul web după autentificare.

## Ce trebuie verificat

În **Backend → Authentication → URL Configuration → Redirect URLs** trebuie să existe:

- `rentli://auth/callback`  
  (necesar pentru build-ul nativ al aplicației mobile)
- `exp://<adresa-generată-de-Expo-Go>`  
  (necesar când testezi în Expo Go; apare în terminal/QR-ul Expo sub forma `exp://...`)

## Pași

1. Deschide **Backend → Users → Auth Settings → URL Configuration**.
2. Verifică dacă `rentli://auth/callback` este deja în listă.
3. Dacă testezi în Expo Go, copiază URL-ul `exp://...` afișat de aplicație/terminal și adaugă-l în aceeași listă.
4. Salvează.
5. Spune-mi când ai terminat, ca să retestez login-ul cu Google pe mobil.

## Modificări în cod

Nu sunt necesare. Aplicația mobilă folosește deja `rentli://auth/callback` în `mobile-template/lib/auth.tsx`.
