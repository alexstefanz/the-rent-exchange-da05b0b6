## Problema

Dialogul „Ai un anunț nesalvat" apare lipit de marginea de jos a ecranului în loc să fie centrat. Cauza: în `src/components/publish/PublishWizard.tsx` (linia 463) `AlertDialogContent` primește `className="relative"`, iar Tailwind aplică `position: relative` peste `position: fixed` din componenta shadcn. Fără `fixed`, regulile `left-[50%] top-[50%] translate-…` nu mai centrează dialogul în viewport — el cade în fluxul DOM al portal-ului, la baza paginii.

`relative` a fost adăugat doar ca să ancoreze butonul X (`absolute right-4 top-4`), însă `AlertDialogContent` are deja un context de poziționare propriu (este `fixed`), deci `absolute` pe buton funcționează fără ajutorul nostru.

## Fix

Un singur fișier: `src/components/publish/PublishWizard.tsx`

- Înlocuiește `<AlertDialogContent className="relative">` cu `<AlertDialogContent>`.
- Restul (buton X cu `absolute right-4 top-4`, header, footer) rămâne neschimbat — butonul se va ancora corect față de containerul fixed.

## Validare

- Build TypeScript curat.
- Reproducere: cu un draft existent, intri pe `/owner/new-product` pe viewport 390×844 și 1440×900 → dialogul apare perfect centrat orizontal și vertical, fără a mai fi tăiat de marginea de jos.
- X-ul rămâne în colțul dreapta-sus al cardului.