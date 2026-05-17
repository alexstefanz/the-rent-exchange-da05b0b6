# Actualizare "Reguli de utilizare" pe pagina produs

Refresh strict de copy în `src/data/uxCopy.ts` (cheia `usageRules`) pentru a reflecta procesul actual de închiriere. Componenta `src/components/product/UsageRules.tsx` rămâne neschimbată — folosește deja iconițele și structura potrivită.

## Reguli noi (RO / EN)

1. **Plată securizată cu card (escrow)** — Plata se face exclusiv cu cardul prin Stripe. Suma + garanția se blochează la rezervare și se capturează doar după ce proprietarul acceptă cererea și confirmă predarea. Fără numerar, fără transfer bancar.

2. **Acceptare de către proprietar** — Rezervarea devine activă doar după ce proprietarul o acceptă din contul lui. Dacă nu răspunde sau refuză, suma blocată se eliberează automat înapoi pe card.

3. **Comunicare doar în chat-ul Rentli** — Toate discuțiile rămân pe platformă. Telefonul și datele de contact se deblochează automat doar după ce rezervarea este plătită și acceptată. Anunțurile cu telefon, email sau linkuri externe sunt blocate automat.

4. **Predare și returnare cu 10 poze obligatorii** — Ambele părți încarcă până la 10 fotografii la preluare și la returnare, direct în aplicație. Acestea sunt singura dovadă acceptată în caz de dispută sau daune.

5. **Anulare flexibilă până la predare** — Rambursare 100% atâta timp cât produsul nu a fost predat fizic și confirmat în aplicație. După confirmarea predării nu se mai acordă rambursare.

6. **Returnare la termen, în aceeași stare** — Produsul se returnează la data stabilită, în aceeași stare ca la preluare. Întârzierile, lipsurile sau daunele documentate prin pozele de retur duc la rețineri din garanție.

Boxul garanție (afișat când există depozit) primește copy actualizat: „Garanția este blocată pe card prin Stripe și se eliberează automat în 24–48h după ce proprietarul confirmă returnarea fără probleme."

## Modificări tehnice

- `src/data/uxCopy.ts` → cheia `usageRules`:
  - rescriere `paymentDesc`, `cancellationDesc`, `handoverDesc`, `communicationDesc`, `returnDesc`, `depositReturn` (RO + EN)
  - adăugare două chei noi: `ownerApproval` + `ownerApprovalDesc`
- `src/components/product/UsageRules.tsx`:
  - adăugare import `ShieldCheck` din lucide-react
  - inserare regulă „Acceptare de către proprietar" în `defaultRules` pe poziția 2 (între plată și comunicare)
  - reordonare pentru flow logic: Plată → Acceptare → Comunicare → Predare poze → Anulare → Returnare

Fără alte modificări de business logic, layout sau styling.
