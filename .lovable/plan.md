## Problema
Pe homepage, `TrustBarPremium` (bara cu "utilizatori verificați / rating / plăți securizate / suport") folosește `-mt-8` ca să se suprapună elegant peste hero. Între timp, `SocialProofLive` (pilula verde "X închiriat în Y · acum Zh") a fost inserată între hero și TrustBar, deci marginea negativă trage bara USP peste pilula live → overlap vizibil.

## Soluția
Inversez ordinea celor două secțiuni în `src/pages/Index.tsx`: las `TrustBarPremium` imediat după hero (își păstrează efectul de overlap peste imagine, așa cum a fost gândit), iar `SocialProofLive` se mută dedesubt, cu spațiere proprie, ca pilulă autonomă vizibilă.

## Modificări

**`src/pages/Index.tsx`**
- Mut `<SocialProofLive />` din poziția curentă (sub `HeroDynamic`) după `<TrustBarPremium />`.

**`src/components/home/SocialProofLive.tsx`**
- Cresc puțin padding-ul vertical (`py-3` → `py-6`) ca pilula să respire între bara USP și grila de categorii.

Nicio modificare de logică, stil de pilulă, sau bara USP în sine.
