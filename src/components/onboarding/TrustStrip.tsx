import { Shield, Wallet, FileText, Headphones } from "lucide-react";

const ITEMS = [
  { icon: Shield, label: "Protecție tranzacții" },
  { icon: Wallet, label: "Wallet dedicat business" },
  { icon: FileText, label: "Facturi pentru companii" },
  { icon: Headphones, label: "Suport dedicat" },
];

export const TrustStrip = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
    {ITEMS.map(({ icon: Icon, label }) => (
      <div
        key={label}
        className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs font-medium text-muted-foreground"
      >
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="leading-tight">{label}</span>
      </div>
    ))}
  </div>
);

export default TrustStrip;