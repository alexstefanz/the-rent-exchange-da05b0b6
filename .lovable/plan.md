Voi face o corecție punctuală ca notificarea să rămână un singur card vizibil, fără fundal/card suplimentar în spate.

Pași:
1. Ajustez `src/components/ui/sonner.tsx` astfel încât wrapper-ul Sonner pentru toast-uri custom să fie transparent, fără border, padding, shadow sau background.
2. Păstrez cardul real doar în `NotificationToast` din `src/lib/notify.tsx`, pentru ca designul notificării să rămână exact cel din screenshot.
3. Nu schimb logica de deduplicare și nu reintroduc al doilea Toaster; modificarea este strict vizuală.
4. Verific prin cod că există în continuare o singură instanță Sonner și că wrapper-ul nu mai poate genera fundalul/cardul mare din spate.

Detaliu tehnic:
- Problema vine din faptul că `toast.custom()` randă cardul nostru în interiorul unui element Sonner care încă are stiluri de toast standard. Vom face stilurile acelui container neutre/ transparente, iar singurul element cu background, border și shadow va fi cardul custom.