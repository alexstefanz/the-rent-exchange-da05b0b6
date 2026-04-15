

## Plan: Corectare link-uri meniu offcanvas

### Problema
Link-urile din meniul offcanvas folosesc rute vechi cu hash (`/profile#contul-meu`, `/profile#inchirieri`, `/profile#mesaje`, `/profile#favorite`) care toate duc practic la pagina `/profile` (Contul meu). Secțiunile au fost deja mutate în pagini dedicate.

### Modificări

**`src/components/layout/Navbar.tsx`** — actualizez rutele din meniul mobil:

| Link | Rută veche | Rută corectă |
|---|---|---|
| Contul meu | `/profile#contul-meu` | `/contul-meu` |
| Rezervări | `/profile#inchirieri` | `/rezervari` |
| Mesaje | `/profile#mesaje` | `/mesaje` |
| Favorite | `/profile#favorite` | `/favorite` |

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/layout/Navbar.tsx` | 4 link-uri actualizate (liniile 437, 453, 461, 474) |

