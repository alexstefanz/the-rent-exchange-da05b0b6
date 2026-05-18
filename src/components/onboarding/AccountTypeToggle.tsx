import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountType = "individual" | "business";

interface Props {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

export const AccountTypeToggle = ({ value, onChange }: Props) => {
  const baseBtn =
    "flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-4 transition-all text-sm font-semibold";

  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Tip cont">
      <button
        type="button"
        role="radio"
        aria-checked={value === "individual"}
        onClick={() => onChange("individual")}
        className={cn(
          baseBtn,
          value === "individual"
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border bg-background text-muted-foreground hover:border-primary/40"
        )}
      >
        <User className="h-5 w-5" />
        Persoană fizică
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "business"}
        onClick={() => onChange("business")}
        className={cn(
          baseBtn,
          value === "business"
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border bg-background text-muted-foreground hover:border-primary/40"
        )}
      >
        <Building2 className="h-5 w-5" />
        Companie
      </button>
    </div>
  );
};

export default AccountTypeToggle;