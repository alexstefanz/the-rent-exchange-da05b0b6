import { Shield, CheckCircle, ShieldCheck, Headphones } from "lucide-react";
import { useUxCopy } from "@/hooks/useUxCopy";

const TrustBadges = () => {
  const copy = useUxCopy();
  
  const badges = [
    { icon: Shield, label: copy.trust.securePay, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { icon: CheckCircle, label: copy.trust.verified, color: "text-blue-600", bgColor: "bg-blue-50" },
    { icon: ShieldCheck, label: copy.trust.insurance, color: "text-purple-600", bgColor: "bg-purple-50" },
    { icon: Headphones, label: copy.trust.support, color: "text-orange-600", bgColor: "bg-orange-50" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
      {badges.map((badge, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2 bg-muted/50 transition-colors hover:bg-muted"
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${badge.bgColor}`}>
            <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
          </div>
          <span className="text-xs md:text-sm font-medium text-foreground">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
