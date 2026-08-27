# Favicon vizibil în Google Search

## Ce am verificat acum
- Fișierele există și sunt servite corect pe rentli.ro (`favicon.ico` 256px, `favicon.png` 96px, `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png` 180px), toate cu status 200 și content-type corect pentru Googlebot.
- `robots.txt` nu blochează niciun fișier de favicon.
- În `index.html` sunt declarate 5 tag-uri de icon diferite, ultimul fiind `rel="shortcut icon"` către `favicon.ico`.

Concluzie: tehnic nu e nimic „stricat”, dar Google alege un singur icon dintre cele 5 declarate și preferă un icon pătrat, multiplu de 48px, cu fundal nontransparent. Declarațiile multiple + PNG-uri transparente sunt motivul cel mai probabil pentru care afișarea e inconsistentă.

## Ce voi face
1. **Un singur icon canonic pentru Google**: adaug `public/icon-48.png` (48x48, logo Rentli centrat, fundal alb solid — Google nu suportă bine transparența pe fundal închis) și îl declar primul în `<head>`.
2. **Curăț declarațiile din `index.html`**: păstrez ordinea clară
   - `rel="icon"` 48x48 (nou, pentru Google)
   - `rel="icon"` 192x192 și 512x512 (PWA/Android)
   - `rel="apple-touch-icon"` 180x180
   - `rel="shortcut icon"` `/favicon.ico` (legacy)
   Elimin duplicatul 96x96 care intră în concurență fără să aducă nimic.
3. **Cache/headers**: adaug în `public/_headers` o regulă de cache scurtă-medie pentru `/favicon*` și `/icon-48.png`, ca o schimbare viitoare de logo să nu rămână blocată în cache.
4. **JSON-LD**: verific ca `logo` din Organization să rămână un PNG pătrat accesibil (rămâne `favicon-512.png`).

## De știut despre timing
Google recrawlează favicon-ul separat de pagină, pe propriul program — poate dura de la câteva zile până la câteva săptămâni până apare noul icon în rezultate. Nu există buton de „forțare”; singurul accelerator e ca homepage-ul să fie recrawlat (se poate cere din Search Console → URL Inspection → Request indexing).

## Detalii tehnice
- Fișiere modificate: `index.html`, `public/_headers`
- Fișier nou: `public/icon-48.png` (derivat din logo-ul existent, redimensionat cu padding, fără stretch)
- Nicio schimbare de logică aplicație sau backend.
