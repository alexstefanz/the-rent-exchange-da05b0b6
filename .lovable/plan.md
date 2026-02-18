
## Adăugarea butonului de apel 3CX în Chat

### Cum funcționează integrarea 3CX

3CX suportă click-to-call prin protocolul standard `tel:` — același folosit de linkurile telefonice obișnuite. Când utilizatorul are:
- **Desktop**: extensia 3CX Click2Call instalată în browser → interceptează linkul `tel:` și inițiază apelul prin 3CX
- **Mobil**: aplicația 3CX instalată → se deschide aplicația pentru apel; altfel se deschide aplicația nativă de telefon

Nicio configurare suplimentară pe server nu este necesară — totul funcționează prin linkul `tel:+40XXXXXXXXX`.

---

### Ce se va schimba

#### 1. `src/components/messaging/ChatPanel.tsx`
- Se adaugă prop-ul `ownerId?: string` — ID-ul proprietarului conversației
- Se apelează funcția existentă `getOwnerContactInfo(ownerId)` (deja securizată: returnează date **doar dacă utilizatorul are o conversație activă cu acel proprietar**)
- Dacă numărul de telefon există în profilul proprietarului, în header-ul chat-ului apare un buton de telefon (iconița `Phone`)
- Butonul deschide `tel:<numar>` → 3CX sau aplicația nativă de telefon

**Design buton:**
```
[ ← ]  [Avatar]  Titlu produs      [ 📞 ]
                  Nume utilizator
```
- Butonul apare **doar dacă există număr de telefon** în profil
- Tooltip: "Apelează prin 3CX"
- Pe hover: culoare verde (`text-green-600`)

#### 2. `src/pages/Messages.tsx`
- Se transmite `ownerId` din obiectul `Conversation` selectat către `ChatPanel`

#### 3. `src/components/profile/MessagesTab.tsx`
- Același lucru — se transmite `ownerId` din conversația selectată

---

### Securitate

Funcția `getOwnerContactInfo` existentă apelează procedura de bază de date `get_contact_info_if_in_conversation` care verifică că utilizatorul curent **face parte din conversație** înainte de a returna datele de contact. Numărul de telefon nu este expus aleatoriu.

---

### Cine vede butonul?

- **Cumpărătorul** (cel care a inițiat conversația) → vede numărul **proprietarului** → poate apela prin 3CX
- **Proprietarul** → va vedea butonul dacă este implementat același mecanism în sens invers (poate fi adăugat ulterior cu o funcție DB separată)

În prima versiune, butonul este vizibil pentru ambii participanți la conversație, dar numărul returnat va fi întotdeauna cel al proprietarului produsului.

---

### Fișiere modificate
- `src/components/messaging/ChatPanel.tsx` — logica principală + UI
- `src/pages/Messages.tsx` — transmitere `ownerId`
- `src/components/profile/MessagesTab.tsx` — transmitere `ownerId`

Nu sunt necesare modificări la baza de date sau funcții backend noi.
