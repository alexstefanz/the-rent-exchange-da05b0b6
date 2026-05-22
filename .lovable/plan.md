# Alert pentru telefon/email în chat

## Comportament dorit

Când userul încearcă să trimită un mesaj care conține un **număr de telefon românesc** (`07XXXXXXXX`, cu sau fără spații/puncte/cratime) sau un **email**, mesajul NU se trimite și se afișează un `AlertDialog` modal care îi recomandă să păstreze conversația pe platformă, explicând că administratorii nu pot ajuta dacă conversația continuă în alt loc.

## Detecție

În `src/components/messaging/MessageInput.tsx` (înaintea `containsProfanity`):

- **Telefon RO**: regex care normalizează spații/puncte/cratime, apoi caută `07` urmat de 8 cifre. Implementare: `/(?:^|[^\d])0\s*[.\-]?\s*7(?:\s*[.\-]?\s*\d){8}/` aplicat pe textul brut.
- **Email**: regex standard `/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/`.

Helper local `containsContactInfo(text): { phone: boolean; email: boolean; hit: boolean }`.

## UI

Un singur `AlertDialog` reutilizat (`contactAlertOpen` state) cu titlu și descriere adaptate după ce s-a detectat:

- **Titlu**:
  - phone+email → „Date de contact detectate / Contact info detected"
  - doar phone → „Număr de telefon detectat / Phone number detected"
  - doar email → „Adresă de email detectată / Email address detected"
- **Descriere (bilingvă)**: „Te rugăm să păstrezi conversația pe Rentli. Dacă apar probleme cu o tranzacție, administratorii pot interveni doar dacă discuția rămâne pe platformă. Schimbul de date de contact înainte de plată este descurajat pentru siguranța ta." / EN echivalent.
- **Buton**: „Am înțeles / Got it".

În `handleSend`, după check de profanity:
```
const contact = containsContactInfo(content);
if (contact.hit) { setContactAlert({open: true, ...}); return; }
```

Mesajul rămâne în input pentru a fi corectat. Nicio modificare backend sau în alte fișiere.
