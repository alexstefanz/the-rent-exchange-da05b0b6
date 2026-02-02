import { Shield, CheckCircle, ShieldCheck, Clock } from "lucide-react";
import { uxCopy } from "@/data/uxCopy";

interface TrustIndicatorsProps {
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md";
  showAll?: boolean;
}

const TrustIndicators = ({ 
  variant = "horizontal", 
  size = "sm",
  showAll = false 
}: TrustIndicatorsProps) => {
  const indicators = [
    {
      icon: Shield,
      label: uxCopy.trust.securePay,
    },
    {
      icon: CheckCircle,
      label: uxCopy.trust.identityVerified,
    },
    {
      icon: Clock,
      label: uxCopy.trust.fastResponse,
    },
  ];

  const allIndicators = showAll
    ? [
        ...indicators,
        {
          icon: ShieldCheck,
          label: uxCopy.trust.insurance,
        },
      ]
    : indicators;

  const sizeClasses = {
    sm: {
      icon: "h-3.5 w-3.5",
      text: "text-xs",
      gap: "gap-1.5",
    },
    md: {
      icon: "h-4 w-4",
      text: "text-sm",
      gap: "gap-2",
    },
  };

  const containerClasses = variant === "horizontal" 
    ? "flex flex-wrap items-center gap-3 md:gap-4"
    : "flex flex-col gap-2";

  return (
    <div className={containerClasses}>
      {allIndicators.map((indicator) => (
        <div
          key={indicator.label}
          className={`flex items-center ${sizeClasses[size].gap} text-muted-foreground`}
        >
          <indicator.icon className={`${sizeClasses[size].icon} text-primary`} />
          <span className={sizeClasses[size].text}>{indicator.label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustIndicators;
