

## Plan: Titluri mai mici + Acordeoane mobile-friendly pe toate paginile admin

### 1. Titluri mai mici pe 1 rând (toate paginile admin)

Schimbare pe toate cele 6 pagini: `text-3xl` → `text-xl`, icon `h-8 w-8` → `h-5 w-5`, titlu + descriere pe un singur rând flexibil.

**Fișiere afectate**: AdminUsers, AdminReservations, AdminTickets, AdminKYC, AdminFinances, AdminCategories

### 2. Acordeoane pe fiecare pagină (înlocuind tabelele cu horizontal scroll)

Același pattern ca AdminProducts — pe mobile se afișează carduri clickabile care se expandează cu detalii + acțiuni, iar pe desktop se păstrează tabelul dar cu rânduri expandabile.

#### AdminReservations
- Card mobil: Produs, Chiriaș, Perioadă, Sumă, Status badge
- Expand: Proprietar, Categorie, Oraș, Comision, Plată status, Acțiuni (Confirmă / Activă / Finalizată / Anulează)
- Desktop: rânduri clickabile, expand inline cu acțiuni (eliminare DropdownMenu)

#### AdminTickets  
- Card mobil: Public ID, Titlu, Prioritate badge, Status badge
- Expand: Categorie, Data, SLA indicator, buton "Vezi detalii" (navigare la ticket detail)

#### AdminUsers
- Card mobil: Avatar + Nume, Email, Rol badge, Status (Activ/Banat)
- Expand: Produse count, Rezervări count, KYC status, Data înregistrare, buton "Vezi profil"

#### AdminKYC
- Card mobil: Public ID, Nume utilizator, Status badge, Risk score
- Expand: Email, Rol, Nivel, Încercări, Data creare, buton "Vezi detalii"

#### AdminFinances (tab "Verificare Plăți")
- Card mobil: Tip, Sumă, Status badge
- Expand: Descriere, Data, Acțiuni (Verificat/Suspect/Rambursează)

#### AdminCategories
- Deja folosește Accordion — rămâne la fel, dar subcategoriile din interior vor fi și ele card-uri pe mobil în loc de table cu scroll

### Structura tehnică (pattern comun)

Fiecare pagină va folosi:
```text
<div className="hidden md:block">
  <Table>... (desktop, cu rânduri expandabile)</Table>
</div>
<div className="md:hidden space-y-3">
  {items.map(item => (
    <Card onClick={toggle} ...>
      <summary info>
      {expanded && <detail panel + actions>}
    </Card>
  ))}
</div>
```

### Fișiere modificate
- `src/pages/admin/AdminReservations.tsx` — acordeon + titlu mic
- `src/pages/admin/AdminTickets.tsx` — acordeon + titlu mic  
- `src/pages/admin/AdminUsers.tsx` — acordeon + titlu mic
- `src/pages/admin/AdminKYC.tsx` — acordeon + titlu mic
- `src/pages/admin/AdminFinances.tsx` — acordeon pentru tab plăți + titlu mic
- `src/pages/admin/AdminCategories.tsx` — titlu mic + subcategorii mobile-friendly

