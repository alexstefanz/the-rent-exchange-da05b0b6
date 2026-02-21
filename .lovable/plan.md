
## Reducerea padding-ului lateral pe mobil

### Problema
Clasa `.container` din Tailwind are un padding fix de `2rem` (32px) pe toate ecranele. Pe mobil, acest padding este prea mare si contentul nu foloseste suficient spatiu.

### Solutia
Modificarea configuratiei `container` din `tailwind.config.ts` pentru a folosi padding responsiv:
- **Mobil (implicit)**: `5px` 
- **Desktop (md+)**: `2rem` (ramane la fel)

### Modificare tehnica

**Fisier: `tailwind.config.ts`**

Se schimba configuratia container de la:
```
padding: "2rem"
```
la:
```
padding: {
  DEFAULT: "5px",
  md: "2rem",
}
```

Aceasta modificare afecteaza automat **toate paginile** care folosesc clasa `container` (homepage, categorii, search, product detail, footer, etc.) — nu este nevoie sa modificam fiecare pagina in parte.

### Impact
- Toate sectiunile cu `.container` vor avea 5px padding stanga-dreapta pe mobil
- Pe tableta si desktop, padding-ul ramane 2rem ca inainte
- Navbar-ul deja are `px-[10px]` setat manual, deci nu este afectat
