## Goal
Extinde lista de cuvinte interzise în `src/lib/profanityFilter.ts` cu noi injurii românești și variante ofuscate (cu `*`, cifre, litere lipsă), astfel încât trimiterea mesajelor să fie blocată atât client-side cât și server-side.

## 1. Extindere listă RO în `src/lib/profanityFilter.ts`
Adaug termeni noi + derivate (toți normalizați — funcția existentă elimină deja `*`, spații, `.`, `_` și diacritice, deci `p*la`, `p.u.l.a`, `pwla` devin `pula`/`pwla` după normalizare):

- `sugi`, `sugio`, `sugiopula`, `sugimi`, `sugepula`, `sugepula`
- `pwla` (variantă cu `w` în loc de `u`), `poola`, `puwla`
- `mati` (separat) + combinații frecvente: `mortiimati`, `mortiimatii`, `crucea mati` → `cruceamati`, `bisericamati`, `dumnezeulmatii`, `dumnezeumati`, `paștelemati` → `pastelemati`, `familiamatii`, `neamulmatii`, `mortiitai`, `mamatii`, `mamadracului`
- Derivate suplimentare: `bagmiapula`, `bagpula`, `tragipula`, `linsemiapula`, `lapula`, `pulamea` (deja există — păstrat), `pulele`, `pulet`, `pizdamatii` (există), `pizdamasii`, `futumama`, `futumati`, `futumamata`, `futiomama`, `futiomorții` → `futiomortii`

## 2. Adăugare normalizare suplimentară pentru ofuscări comune
Extind `normalizeForProfanity` pentru a mapa câteva substituții frecvente *înainte* de strip-ul caracterelor non-alfanumerice:
- `0`→`o`, `1`→`i`, `3`→`e`, `4`→`a`, `5`→`s`, `7`→`t`, `@`→`a`, `$`→`s`
- `w` păstrat ca `w` (acoperit prin adăugarea explicită a `pwla`)

Astfel `p0l4`, `pul@`, `mu1e` etc. sunt prinse de aceleași intrări ca `pula`/`muie`.

## 3. Sincronizare cu trigger-ul Postgres
Migrația existentă conține funcția `check_message_profanity` cu o listă duplicată în SQL. Adaug o nouă migrație care:
- Înlocuiește lista din funcție cu varianta extinsă (aceleași cuvinte ca în TS).
- Adaugă aceleași substituții numerice (`translate(content, '0134578@$', 'oieasta as')`) în pasul de normalizare SQL pentru paritate cu clientul.

Astfel atât `MessageInput.handleSend` (client) cât și `INSERT`-ul direct (server) blochează aceleași variante și `Send` rămâne dezactivat la atingerea limbajului licențios.

## Out of scope
- Schimbări UI / copy-uri de toast (rămân cele actuale RO/EN).
- Sistem de raportare (deja implementat).
- Auto-ban după N încercări blocate.

## Tech notes
- Funcția `containsProfanity` rămâne O(n·m) pe substring — listă <150 cuvinte, impact neglijabil.
- Lista TS și lista SQL trebuie ținute sincron; voi adăuga un comentariu explicit în ambele fișiere.
