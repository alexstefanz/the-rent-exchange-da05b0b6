## Context — sistemul SMS este deja conectat

Toate cele **5 evenimente** apelează deja `send-sms-notification`:
1. `rental_request_owner` — cerere nouă (proprietar)
2. `rental_accepted` — acceptată (chiriaș)
3. `rental_rejected` — refuzată (chiriaș)
4. `rental_cancelled` — anulată (proprietar)
5. `return_reminder` — reminder ziua returnării (chiriaș)

## Problema reală (diagnostic din DB)

Din 17 useri:
- **doar 2 au telefon completat** în profil (`profiles.phone`)
- **15 useri primesc `skipped: invalid_phone`** și nu vor primi niciodată SMS

Logurile confirmă: ultima cerere a fost marcată `skipped/invalid_phone` (telefon gol).

Cauza: telefonul este opțional la signup și mulți useri nu îl completează în profil. Edge function-ul îl normalizează corect la `+40XXXXXXXXX` și sare peste useri fără telefon valid (comportament corect — nu putem trimite SMS fără număr).

## Plan — 3 pași pentru activare reală

### 1. Telefon obligatoriu la KYC + acțiuni critice
- La submit KYC, validare frontend că `profiles.phone` e completat și valid RO (`+40XXXXXXXXX` sau `0XXXXXXXXX`).
- La crearea unei rezervări (renter) și la publicarea unui produs (owner), banner non-blocking dacă lipsește telefonul: "Adaugă numărul de telefon ca să primești notificări SMS despre rezervări". Link spre `/cont` (AccountTab).

### 2. UI explicit în setări cont
- În `AccountTab.tsx`: badge clar lângă câmpul Telefon — verde "SMS activ" dacă e completat și `sms_notifications_enabled=true`, gri "SMS inactiv" altfel, cu mesaj explicativ ("Vei primi SMS la cereri noi, acceptare, anulare, reminder returnare").
- Validare format la salvare: doar formate RO acceptate, mesaj de eroare clar.

### 3. Email de tip "completează profilul"
- Edge function nouă (one-shot, manuală din Admin) `prompt-missing-phone`: trimite email branded către userii fără telefon, cu link spre `/cont`, explicând beneficiul SMS-urilor pentru rezervări.
- Buton în AdminDashboard: "Trimite reminder telefon utilizatorilor fără SMS" (cu confirmare + counter).

## Aspecte tehnice

- Edge function-ul `send-sms-notification` și template-urile rămân neschimbate — funcționează corect, dovedit de SMS-ul de test primit.
- `sms_notifications_enabled` rămâne default `true` (deja așa în DB) — userii pot opta out din `NotificationsTab`.
- Validare telefon RO reutilizată din helper deja existent (`normalizePhoneRO` — îl portez pe frontend ca util în `src/lib/inputValidation.ts`).
- Niciun cost suplimentar SMS până când userii nu adaugă telefon real.

## Ce NU schimb
- Logica din cele 4 edge functions care invocă SMS — deja corectă.
- Template-urile SMS — rămân ASCII fără diacritice, sub 160 caractere.
- Tabela `sms_logs` și RLS — deja corecte.

## Rezultat așteptat
După aplicare: orice user nou care completează telefonul primește automat toate cele 5 tipuri de SMS-uri tranzacționale, fără configurări suplimentare. Userii existenți primesc un prompt vizual + email opțional pentru a-și completa numărul.

**Aprobă planul ca să trec în Build mode și să implementez.**