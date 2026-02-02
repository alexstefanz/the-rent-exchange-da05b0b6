import { cn } from "@/lib/utils";
import { uxCopy } from "@/data/uxCopy";

type StatusType = "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "active" | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: uxCopy.status.pending,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  accepted: {
    label: uxCopy.status.accepted,
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: uxCopy.status.rejected,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  completed: {
    label: uxCopy.status.completed,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  cancelled: {
    label: uxCopy.status.cancelled,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  active: {
    label: uxCopy.status.active,
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  inactive: {
    label: uxCopy.status.inactive,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

const StatusBadge = ({ status, size = "sm" }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.className,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
