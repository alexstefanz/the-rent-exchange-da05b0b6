## Problema

Validarea din `src/lib/inputValidation.ts` (`containsContactInfo`) e prea agresivă și dă fals-pozitive pe descrieri normale de produs care conțin cifre, dimensiuni, greutăți sau puncte în text (ex. „125 x 63.5 x 40 mm", „60 g", „HERO 25K", coduri produs, etc.). Regulile actuale:

- **Telefon**: `\+?\d[\d\s\-().]{6,}\d` → orice secvență de 7+ cifre/spații/puncte declanșează. „6 199 2024" sau „125.63.540" pot trece drept telefon.
- **URL**: `(\.[a-z]{2,4}\/)` → orice „ceva.xy/" e considerat link, chiar și în text fără domeniu real.

## Soluția

Restrâng regexurile din `containsContactInfo` să prindă doar tipare reale de contact, păstrând scopul de securitate:

1. **Telefon** — verific că substring-ul „candidate" conține **cel puțin 9 cifre efective** (lungime plauzibilă număr RO/internațional), nu doar 7 caractere mixte. Trec printr-un pas suplimentar de numărare digits, ignorând text cu litere adiacente (ex. „mm", „g", „HERO").
2. **URL** — cer un domeniu real: succesiune de litere `[a-z0-9-]+\.(ro|com|net|org|eu|io|co|uk|de|fr|it|es|info|biz|shop|store|online|app|dev)` (opțional cu `www.` sau `http(s)://`), nu orice `.xy/`. Elimin partea `\.[a-z]{2,4}\/` care matcha „63.5/…" în anumite cazuri.
3. **Email** — regulă păstrată; e specifică și rareori dă fals-pozitive.

## Fișiere modificate

- `src/lib/inputValidation.ts` — actualizez funcția `containsContactInfo`.

## Verificare

- Descrierea din screenshot (mouse Logitech cu dimensiuni și greutăți) trebuie să treacă fără warning.
- Testez rapid câteva cazuri:
  - „Sună la 0722 123 456" → detectat ca `phone` ✓
  - „Contact: john@doe.com" → detectat ca `email` ✓
  - „Vezi pe www.rentli.ro" → detectat ca `url` ✓
  - „125 x 63.5 x 40 mm, 60 g, HERO 25K" → curat ✓
  - „Model G-Pro 2024, versiune 1.2.3" → curat ✓
