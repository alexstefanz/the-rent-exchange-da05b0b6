## Adaug butonul „Adaugă" în ambele containere

Înțeleg acum — vrei ca **ambele butoane (Adaugă + Șterge) să fie vizibile mereu**, nu doar Șterge când există IBAN. Clic pe „Adaugă" deschide formularul pentru a introduce un IBAN nou (înlocuindu-l pe cel existent).

### 1. `src/components/profile/AccountTab.tsx`
În vizualizarea cu IBAN salvat (lângă butonul „Șterge"), adaug butonul „Adaugă" (`Plus` icon, variant outline) care setează `setIban("")` + `setEditing(true)` → deschide formularul de introducere.

### 2. `src/components/earnings/WithdrawalMethodCard.tsx`
Lângă butonul „Șterge", adaug butonul „Adaugă" (`Plus` icon) care navighează la `/contul-meu?section=payout` și deschide formularul (la fel ca empty state-ul actual).

Ordine: **Adaugă** (stânga) → **Șterge** (dreapta, destructive).
