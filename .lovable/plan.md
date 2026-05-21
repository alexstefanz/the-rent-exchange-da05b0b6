## Plan: Alert vizibil pentru subcategoria lipsă la adăugare anunț

### Problemă
La pasul 1 din wizard-ul de publicare, dacă userul alege o categorie cu subcategorii dar nu selectează niciuna, validarea există dar afișează doar un toast discret — userul nu observă și pare că butonul „Continuă" nu reacționează.

### Fix — un singur fișier: `src/components/publish/PublishWizard.tsx`

**1. Propagă `errors` în `Step1Category`**
- Linia 408: `<Step1Category data={data} update={update} errors={errors} />`
- Semnătura componentei (491–497): adaugă `errors: Record<string, string>`.

**2. Mesaj inline roșu + border-destructive pe cardul de subcategorie** (560–586)
- Adaug `id="subcategory-section"` și clasă `border-destructive` pe wrapper când `errors.subcategory`.
- Sub lista de pills:
```tsx
{errors.subcategory && (
  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
    <AlertCircle className="h-4 w-4" /> {errors.subcategory}
  </p>
)}
```

**3. Toast mai explicit** (linia 279)
- Mesaj dedicat când eroarea e pe subcategorie: „Te rugăm să alegi și o subcategorie din lista de mai jos înainte de a continua." (variant destructive).

**4. Auto-scroll la secțiunea subcategorie** (după `setErrors(flat)`)
```ts
if (flat.subcategory) {
  setTimeout(() => {
    document.getElementById("subcategory-section")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}
```

### Ce nu modific
- Logica de validare existentă (Zod / `stepValidators`).
- Lista de categorii / subcategorii.
- Restul wizard-ului (pași 2–6).