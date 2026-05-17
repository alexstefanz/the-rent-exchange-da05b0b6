## Obiectiv

Înlocuim layout-ul actual tabelar al PV-ului (Predare / Returnare) cu formatul narativ din PDF-ul atașat: antet companie + paragrafe "Încheiat astăzi… între… în calitate de Predător/Primitor", urmate de fotografii și semnături.

Pentru că nu avem încă date din Cartea de Identitate, vom folosi **valori fictive** (CNP, serie/număr CI, adresă) pentru fiecare parte, urmând ca pe viitor să fie înlocuite cu date reale din modulul KYC.

## Modificări

### `src/components/rentals/PvSignatureDialog.tsx` — funcția `generatePdf`

Rescriem complet conținutul textual păstrând logica de fotografii, semnături, paginare și salvare.

1. **Antet** (centrat sus, font mic):
   - "Rentli Platform SRL"
   - "Str. Exemplu nr. 1, București"
   - "CUI: RO12345678 | J40/1234/2024"
   - "Tel: +40 740 000 000 | Email: contact@rentli.ro"
   - linie despărțitoare

2. **Titlu** centrat, bold, 14pt:
   - Handover: "PROCES-VERBAL DE PREDARE-PRIMIRE"
   - Return: "PROCES-VERBAL DE RETURNARE"

3. **Paragraf introductiv** (justified, splitTextToSize):
   > "Încheiat astăzi, {data curentă}, între domnul/doamna **{owner_name}**, în calitate de Predător (proprietar), identificat cu CNP {ownerCNP}, CI seria {ownerSerie} nr. {ownerNr}, domiciliat în {ownerAdresa}, telefon {owner_phone}, email {owner_email}, și domnul/doamna **{renter_name}**, în calitate de Primitor (chiriaș/utilizator), identificat cu CNP {renterCNP}, CI seria {renterSerie} nr. {renterNr}, domiciliat în {renterAdresa}, telefon {renter_phone}, email {renter_email}."

4. **Paragraf obiect**:
   > "Prin prezentul proces-verbal, Predătorul predă, iar Primitorul primește spre utilizare temporară, prin intermediul platformei de renting peer-to-peer Rentli, următorul bun: **{product_title}**, din categoria {product_category}, pentru o perioadă de {rental_days} zile, cu costul total de {subtotal} lei ({daily_price} lei/zi) și o garanție de {deposit} lei."

5. **Paragraf accesorii** (doar dacă `product_included_items` are valori):
   > "Bunul este însoțit de următoarele accesorii: {included_items.join(', ')}. La momentul predării au fost realizate fotografii pentru confirmarea stării acestuia: DA."

6. **Paragraf perioadă**:
   > "Perioada de utilizare convenită între părți este de la data {start_date} până la data {end_date}."

7. **Paragraf responsabilitate** (text fix, ușor adaptat handover vs. return):
   - Handover: textul din PDF-ul atașat despre acceptare în starea menționată, returnare la termen, răspundere pentru deteriorări/pierderi.
   - Return: text adaptat — Primitorul restituie bunul, Predătorul confirmă starea conform fotografiilor anexate, eventuale daune se reglementează prin platformă.

8. **Paragraf clauză finală** (fix, din PDF):
   > "Eventualele neînțelegeri vor fi soluționate conform termenilor și condițiilor platformei Rentli. Prezentul proces-verbal a fost încheiat în două exemplare, câte unul pentru fiecare parte, având aceeași valoare juridică."

9. **Secțiune "Fotografii la predare/returnare:"** — păstrăm grila 2-coloane existentă cu label `Predător / Primitor` în loc de `Proprietar / Chiriaș`.

10. **Semnături** (2 coloane jos):
    - Header: "Predător (proprietar)" | "Primitor (chiriaș)"
    - Imaginea semnăturii
    - Numele complet (owner_name / renter_name) sub linia de semnătură
    - Data semnării

### Date fictive — helper local în același fișier

```ts
function fakeIdentity(seed: string) {
  // deterministic pseudo-data based on user id hash
  // returns { cnp, serie, nr, adresa }
}
```

Generăm valori plauzibile dar clar fictive (ex. CNP 1900101223344, serie RX, nr. 456789, adresă "Str. Exemplu nr. X, București, Sector Y"), deterministice per user_id ca să rămână consistente între generări. Adăugăm un comentariu `// TODO: înlocuit cu date reale din KYC` deasupra helper-ului.

### Detalii tehnice

- Folosim `doc.splitTextToSize(..., W - 100)` pentru fiecare paragraf și verificăm `y + lines.length * 12 > H - 60` înainte de fiecare paragraf → `doc.addPage()`.
- Înlocuim diacriticele cu echivalente fără diacritice sau folosim font care le suportă; jsPDF Helvetica nu le redă bine — adoptăm aceeași abordare ca în restul codului (text fără diacritice pentru siguranță, ca în "Subsemnatii confirma...").
- Nu modificăm fluxul: upload poze → semnături → la a doua semnătură se generează PDF-ul nou.

## În afara scope-ului

- Câmpuri reale CNP/CI/adresă (vor veni din KYC).
- Modificări de DB sau RLS.
- Schimbări în notificările/email-urile asociate.
