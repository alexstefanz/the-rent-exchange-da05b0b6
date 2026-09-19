# „Ce este inclus" — scriere pe rânduri

## Problema
La completarea anunțului, accesoriile se adaugă doar unul câte unul, dintr-un câmp de o singură linie. Nu poți scrie mai multe elemente, unul sub altul.

## Soluția
Înlocuim câmpul de o linie cu o casetă mare de text, în care fiecare rând este un element din listă:

- Scrii liber și apeși Enter pentru fiecare element nou.
- Poți lipi un text cu mai multe rânduri — se împarte automat în elemente.
- Rândurile goale și duplicatele se ignoră; spațiile de la început/sfârșit se curăță.
- Dacă rândul începe cu „-", „•" sau „1." , simbolul se elimină automat.
- Sub casetă rămâne previzualizarea elementelor salvate (etichetele existente), ca să vezi exact ce va apărea în anunț.

Pe pagina anunțului, elementele continuă să apară ca listă cu bife, unul sub altul — acolo nu se schimbă nimic.

Aceeași modificare se aplică automat și la editarea unui anunț existent, pentru că folosesc același formular. Vom folosi aceeași abordare și pentru „Reguli de utilizare", care are exact aceeași problemă.

## Detalii tehnice
- `src/components/publish/PublishWizard.tsx`: secțiunile „Ce este inclus" și „Reguli de utilizare" trec de la `Input` + buton „+" la `Textarea` (aprox. 5 rânduri).
- Textul din casetă se ține într-un state local sincronizat cu `data.included_items` / `data.usage_rules` (join cu `\n`); la fiecare `onChange` se face split pe `\n`, trim, curățare prefixe de listă, eliminare rânduri goale și duplicate, apoi `update(...)`.
- Se păstrează afișarea etichetelor existente (cu ștergere prin „x"), sincronizate cu conținutul casetei.
- Fără modificări de bază de date: câmpurile rămân `text[]`.
- Verificare finală cu `tsgo --noEmit`.
