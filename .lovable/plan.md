# Scoatere carduri „coming soon" din Centru securitate

În `src/components/profile/AccountTab.tsx` (liniile 615–616), șterg cele două `ComingSoonCard`:
- „Autentificare în 2 pași (2FA)"
- „Sesiuni active & dispozitive"

Rămân doar cardurile funcționale: Parolă și Ultima conectare. Dacă iconițele `Smartphone` / `Globe` nu mai sunt folosite altundeva în fișier, le scot și din import.
