

# Adăugare "Ai uitat parola?" la pagina de autentificare

## Rezumat

Voi adăuga un link "Ai uitat parola?" sub câmpul de parolă în formularul de login. La click, se va deschide un dialog în care utilizatorul introduce email-ul, iar Supabase va trimite un email cu link de resetare parolă.

---

## Implementare

### Modificări în `src/pages/Auth.tsx`

**1. Import Dialog components și funcția de reset:**
- Adaug import pentru `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- Folosesc `supabase.auth.resetPasswordForEmail()` pentru trimiterea email-ului

**2. State nou pentru dialog:**
```typescript
const [showResetDialog, setShowResetDialog] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [isResetting, setIsResetting] = useState(false);
```

**3. Funcție de resetare parolă:**
```typescript
const handleResetPassword = async () => {
  setIsResetting(true);
  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  });
  setIsResetting(false);
  
  if (error) {
    toast({ title: "Eroare", description: error.message, variant: "destructive" });
  } else {
    toast({ title: "Email trimis", description: "Verifică inbox-ul pentru link-ul de resetare" });
    setShowResetDialog(false);
    setResetEmail("");
  }
};
```

**4. Link sub câmpul de parolă (linia ~157):**
```tsx
<div className="flex justify-end">
  <Button 
    type="button" 
    variant="link" 
    className="px-0 text-sm text-muted-foreground"
    onClick={() => setShowResetDialog(true)}
  >
    Ai uitat parola?
  </Button>
</div>
```

**5. Dialog pentru reset parolă:**
```tsx
<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Resetare parolă</DialogTitle>
      <DialogDescription>
        Introdu adresa de email și îți vom trimite un link pentru resetarea parolei.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="email@exemplu.ro"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
      </div>
      <Button 
        onClick={handleResetPassword} 
        className="w-full"
        disabled={isResetting || !resetEmail}
      >
        {isResetting ? "Se trimite..." : "Trimite link de resetare"}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## Flux Utilizator

1. Utilizatorul dă click pe "Ai uitat parola?"
2. Se deschide un dialog cu câmp de email
3. Introduce email-ul și apasă "Trimite link de resetare"
4. Supabase trimite email cu link de resetare
5. Toast de confirmare apare
6. Utilizatorul primește email și poate reseta parola

---

## Fișiere Modificate

| Fișier | Modificare |
|--------|-----------|
| `src/pages/Auth.tsx` | Adăugare link, dialog și funcție reset |

---

## Note

- Supabase se ocupă automat de trimiterea email-ului de resetare
- Link-ul din email va redirecționa utilizatorul înapoi în aplicație
- Nu este nevoie de configurare suplimentară în backend

