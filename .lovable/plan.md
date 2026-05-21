## Plan: Elimin blocul „Câștig estimat" din pasul 5

### Fix — `src/components/publish/PublishWizard.tsx` (liniile 1222–1228)

Șterg cardul:
```tsx
<div className="rounded-2xl border border-border bg-card p-5">
  <p ...>Câștig estimat</p>
  <p ...>~{monthlyEstimate} RON / lună</p>
  <p ...>La 8 zile închiriate, fără comisioane suplimentare. Plata e săptămânală în contul tău.</p>
</div>
```

Rămâne `QualityScoreCard` + lista `ReviewRow`-uri. Dacă `monthlyEstimate` nu mai e folosit nicăieri, șterg și calculul/variabila respectivă pentru a evita warning-uri de lint.

### Ce nu modific
Restul pasului 5 (header, calitate, review rows, footer).