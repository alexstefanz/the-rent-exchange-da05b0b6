# Fix: cardurile din offcanvas mobile nu navighează

## Problema

În `src/components/layout/mobile-drawer/MobileDrawer.tsx`, componenta `AccountHubBody` este randată cu:

```tsx
<AccountHubBody onNavigate={onClose} />
```

`onClose: () => void` ignoră argumentul `path`, deci toate cardurile (Produsele mele, Închirieri, Balanță/Retrage, Finalizează contul, Adaugă anunț, Panou Admin, etc.) doar închid drawer-ul fără să navigheze către ruta corespunzătoare.

## Soluție

Pasează un handler care întâi navighează la `path`, apoi închide drawer-ul:

```tsx
const navigate = useNavigate();
const handleNavigate = (path: string) => {
  navigate(path);
  onClose();
};
...
<AccountHubBody onNavigate={handleNavigate} />
```

Adaug `useNavigate` din `react-router-dom` (deja folosit prin `Link` în fișier).

## Fișiere modificate

- `src/components/layout/mobile-drawer/MobileDrawer.tsx` — import `useNavigate`, wrapper `handleNavigate`, pass la `AccountHubBody`.

## Verificare

- Deschid drawer mobil → click pe „Produsele mele" → navighează la `/anunturi` și închide drawer-ul.
- La fel pentru „Închirieri" (`/rezervari`), cardul Balanță (`/castiguri`), „Adaugă anunț" (`/owner/new-product`), „Panou Admin" (`/admin`).
