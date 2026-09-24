# Telefon obligatoriu pentru conturile Google / Apple

## Problema
Acum, blocarea pentru telefon apare doar la plată și verifică doar dacă numărul arată corect, nu dacă a fost confirmat prin SMS. Cine intră cu Google/Apple nu e oprit nicăieri, deci poate publica anunțuri fără telefon.

## Ce se schimbă
1. **Fereastră obligatorie după logare** — orice utilizator logat (Google, Apple sau email) care nu are telefonul verificat vede imediat o fereastră „Adaugă numărul de telefon”, care nu se poate închide. Pași: introduce numărul românesc → primește codul prin SMS → îl introduce → fereastra dispare. Singura altă opțiune este „Deconectare”.
2. **Aceeași regulă și la acțiuni** — publicarea/editarea unui anunț, cererea de închiriere și plata cer telefon **verificat** (nu doar scris corect).
3. **Protecție și în baza de date** — un anunț nou sau o cerere de închiriere nu poate fi salvată dacă telefonul contului nu e verificat (excepție: administratorii).
4. Conturile existente fără telefon verificat (inclusiv aleczanderr20@gmail.com) vor vedea fereastra la următoarea vizită. Anunțurile deja publicate rămân.

## Detalii tehnice
- Componentă nouă `PhoneVerificationRequiredModal` montată global (în layout, lângă AuthProvider), afișată când `user` există și `profiles.phone_verified !== true`; reutilizează fluxul existent `send-phone-otp` / verificare cod din `Auth.tsx`.
- Nu se afișează pe rutele `/auth`, pagini legale și de resetare parolă.
- `usePhoneRequired` verifică `phone_verified === true`; se elimină fallback-ul pe `user_metadata.phone` și lista de excepții de test.
- Gate-ul adăugat în `PublishWizard` și în fluxul de rezervare.
- Migrație: trigger `BEFORE INSERT` pe `products` și `rentals` care aruncă `PHONE_NOT_VERIFIED` dacă profilul nu are `phone_verified = true` și nu are rol admin.
- Test: cont nou Google simulat fără telefon → fereastra apare; după verificare dispare; insert direct fără verificare e respins.
