import { FlaskConical } from "lucide-react";

interface Props {
  show?: boolean;
  className?: string;
}

/**
 * Small yellow badge shown on rentals paid with the admin TEST card.
 * Renders nothing when show=false.
 */
const TestPaymentBadge = ({ show, className = "" }: Props) => {
  if (!show) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-yellow-400 bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800 ${className}`}
      title="Plată efectuată cu cardul de test (admin)"
    >
      <FlaskConical className="h-3 w-3" />
      Test
    </span>
  );
};

export default TestPaymentBadge;