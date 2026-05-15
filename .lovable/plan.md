## Change

În `src/components/dashboard/RentalsFilterBar.tsx`, înlocuiesc rândul orizontal de pills (Toate / Active / În așteptare / Anulate) cu un `Select` (dropdown) care arată label-ul + count.

Componenta e folosită deja atât de `RentalsTab.tsx` (Chiriaș) cât și de `RentalsOutTab.tsx` (Proprietar), deci o singură modificare acoperă ambele pagini. Nu schimb nimic în logică (filtre/sort/counts rămân la fel).

### Layout nou

```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-3">
  <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as RentalStatusFilter)}>
    <SelectTrigger className="w-full sm:w-[220px] h-9">
      <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      {items.map(it => (
        <SelectItem key={it.key} value={it.key}>
          {it.label} ({it.count})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={sortBy} ...> {/* neschimbat */} </Select>
</div>
```

- Adaug `Filter` din `lucide-react`.
- Pe mobil ambele dropdown-uri stivuite full-width, pe desktop aliniate orizontal.

### Files
- `src/components/dashboard/RentalsFilterBar.tsx`