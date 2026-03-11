

## Plan: Add contact info validation to product description

### Overview
Add a Zod custom validator that blocks phone numbers, email addresses, and URLs in the product description field. Show a warning message and prevent form submission.

### Validation rules
- **Phone**: digits sequences of 7+ digits (with optional spaces, dashes, dots, parens)
- **Email**: pattern with `@` and domain
- **URLs**: `http://`, `https://`, `www.`, or common TLDs like `.com`, `.ro`, `.net`

### Changes

**1. `src/lib/inputValidation.ts`** -- Add a `containsContactInfo` function:
```typescript
export const containsContactInfo = (text: string): string | null => {
  // Phone: 7+ digits (allowing separators)
  if (/(\+?\d[\d\s\-().]{6,}\d)/.test(text)) return 'phone';
  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return 'email';
  // URLs
  if (/(https?:\/\/|www\.)|(\.[a-z]{2,4}\/)/i.test(text)) return 'url';
  return null;
};
```

**2. `src/pages/NewProduct.tsx`** -- Update `productSchema.description` with `.refine()` that calls `containsContactInfo` and returns a Romanian error message.

**3. `src/pages/EditProduct.tsx`** -- Same schema change.

**4. `src/pages/ListItem.tsx`** -- Add the same validation in the `handleSubmit` before allowing publish (this page doesn't use Zod, so add a manual check with toast).

### Error message
"Descrierea nu poate conține date de contact (telefon, email sau link-uri). Comunicarea se face prin platforma Rentli."

### Files affected
- `src/lib/inputValidation.ts`
- `src/pages/NewProduct.tsx`
- `src/pages/EditProduct.tsx`
- `src/pages/ListItem.tsx`

