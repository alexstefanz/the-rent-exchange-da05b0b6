## Change
Remove the redundant "Cont complet verificat" emerald banner that appears below the balance card in `AccountHubMenu`, since the same status is already shown in the hero card next to the avatar (green "Verificat" pill).

## File
- `src/components/layout/AccountHubMenu.tsx` — in `MiddleZone`, delete the `incompleteHealth.length === 0` branch that renders the emerald "Cont complet verificat / Account fully verified" pill. Keep the "Finalizează contul X/5" row for incomplete cases unchanged.
