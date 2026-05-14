## Goal
„Cum primești banii": IBAN-ul trebuie să aparțină titularului contului. Câmpul „Titular cont" dispare; numele se preia automat din `profiles.full_name` (read-only). Adaug avertisment vizibil că nu e permis să folosești IBAN-ul altei persoane.

## Changes — `src/components/profile/AccountTab.tsx`

1. **Section description** — schimb textul:
   - RO: „IBAN-ul trebuie să fie pe numele tău (titularul contului). Folosirea contului altei persoane nu este permisă și poate duce la suspendarea contului."
   - EN: „The IBAN must be in your name (the account holder). Using someone else's account is not allowed and may result in account suspension."

2. **`PayoutForm`** — refactor:
   - Elimin `holder` state + inputul „Titular cont".
   - Numele titularului = `profile.full_name` (citit la save și folosit pentru a popula `account_holder_name` în DB).
   - Înainte de `handleSave`: dacă `full_name` lipsește sau < 3 caractere → toast destructive cu CTA „Completează numele complet în secțiunea Profil" și nu se salvează.
   - Layout edit mode: un singur câmp lat IBAN + sub el un mic helper read-only „Titular: {full_name}" cu icon `User`.
   - Saved view (card existent): rămâne identic (afișează IBAN mascat + numele din `account_holder_name`).
   - Banner de avertisment în mod edit (sub IBAN, deasupra butoanelor): box `amber-50` cu icon `AlertCircle` și textul:
     - RO: „IBAN-ul trebuie să aparțină titularului contului Rentli. Conturile pe numele altor persoane nu vor putea fi validate la plată."
     - EN: „The IBAN must belong to the Rentli account holder. Accounts in another person's name will not be validated for payouts."

3. **Validare** — păstrez regex IBAN; adaug check pentru `full_name` lipsă.

## Out of scope
- Validare numerică Mod-97 a IBAN-ului (rămâne regex format).
- Verificare automată match nume-IBAN (necesită provider extern).
- Modificări în WithdrawalDialog sau WithdrawalMethodCard.