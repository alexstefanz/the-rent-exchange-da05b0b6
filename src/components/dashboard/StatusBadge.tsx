import { cn } from "@/lib/utils";
import { useUxCopy } from "@/hooks/useUxCopy";

type StatusType = "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "active" | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
}

const statusStyles: Record<StatusType, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
};

const StatusBadge = ({ status, size = "sm" }: StatusBadgeProps) => {
  const copy = useUxCopy();
  const label = copy.status[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        statusStyles[status],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
