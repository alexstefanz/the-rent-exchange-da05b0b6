## Schimbare

În `src/components/support/SupportChatWidget.tsx`, butonul "Live Help" afișează în prezent avatarul `supportAgentAvatar` (poza unui agent). Înlocuiesc cu un icon de Support (Lucide `Headphones`) plasat într-un cerc colorat primar.

## Modificări

`src/components/support/SupportChatWidget.tsx`:
- Import `Headphones` din `lucide-react`.
- Înlocuiesc `<img src={supportAgentAvatar} … />` (liniile 705–712) cu un container `h-10 w-10 rounded-full bg-primary/10 grid place-items-center` ce conține `<Headphones className="h-5 w-5 text-primary" />`.
- Păstrez intacte: status dot verde, badge-ul de notificări, textele "Live Help / Online / Bună! Te putem ajuta?".
- Șterg importul `supportAgentAvatar` dacă nu mai e folosit nicăieri (verificat: nu este).

Nicio modificare la business logic, chat, sau alte componente.