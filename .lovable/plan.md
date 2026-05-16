## Modificări în `src/pages/RentalDetailPage.tsx`

### 1. Container "așteptăm plata" sub timeline (doar pentru proprietar)
Sub secțiunea Timeline (după linia 292), adaug un container vizibil când:
- `isOwner === true`
- `rental.status === "confirmed"`
- `rental.payment_status === "pending"` (chiriașul nu a plătit încă)

Conținut:
- Iconiță Clock + titlu: „Așteptăm plata chiriașului"
- Text: „Ai acceptat cererea. Chiriașul urmează să facă plata — te rugăm să aștepți. Vei fi notificat imediat ce plata este confirmată."
- Stil: card cu border `border-primary/30`, fundal `bg-primary/5`, în ton cu restul paginii.

### 2. Buton portocaliu „Vorbește cu..." în cardul „Produs închiriat"
În secțiunea „Produs închiriat" (linia 515–537), adaug sub conținutul existent un buton primar (portocaliu, `bg-primary`) pe lățime completă:
- Pentru proprietar: „Vorbește cu chiriașul"
- Pentru chiriaș: „Vorbește cu proprietarul"
- Iconiță `MessageSquare`, folosește handler-ul existent `handleChat`.

### 3. Curățare card „Counterparty" (Chirias / Proprietar)
Elimin butonul vag „Trimite mesaj" (linia 551–553) din cardul counterparty, deoarece acțiunea de chat este acum în cardul produsului (portocaliu, vizibil). Cardul rămâne pentru afișarea datelor de contact (după plată) și mesajul de gating.

### Note tehnice
- Nu modific logica de business sau API-uri.
- Toate textele sunt bilingve (RO/EN) prin helper-ul existent `t(...)`.
- Folosesc tokenele semantice existente (`primary`, `border`, `card`).
