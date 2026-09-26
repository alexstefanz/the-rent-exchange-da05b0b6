# Repară publicarea anunțurilor

## Cauza (confirmată)
Am reprodus publicarea cu datele anunțului tău cu bicicleta. Salvarea e respinsă de regula din baza de date care verifică telefonul. Regula e scrisă greșit: la anunțuri încearcă să citească și câmpul chiriașului, care există doar la închirieri. De aceea orice utilizator care nu e admin primește eroare la publicare, chiar dacă are telefonul verificat.

## Ce fac
1. **Rescriu regula de verificare a telefonului** ca să citească proprietarul la anunțuri și chiriașul la închirieri. Comportamentul rămâne același: fără telefon verificat nu poți publica sau închiria, iar adminii sunt scutiți.
2. **Afișez mesaje clare în locul textului generic „An error occurred”** pentru erorile cunoscute la publicare, de exemplu telefon neverificat sau date invalide.
3. **Verific**: repet salvarea de test cu datele bicicletei, fără să rămână nimic salvat, și confirm că trece. Apoi poți apăsa din nou „Publică anunțul”.

## Detalii tehnice
- Migrare nouă: `enforce_phone_verified_on_insert()` cu `IF TG_TABLE_NAME = 'products' THEN v_uid := NEW.owner_id; ELSE v_uid := NEW.renter_id; END IF;`. PL/pgSQL rezolvă ambele ramuri ale lui `CASE`, așa că `NEW.renter_id` crapă pe `products`.
- `productsApi.createProduct`: transmit mai departe mesajele `PHONE_NOT_VERIFIED` / `check_violation`, ca să nu fie înlocuite de mesajul generic din `getSecureErrorMessage`.
