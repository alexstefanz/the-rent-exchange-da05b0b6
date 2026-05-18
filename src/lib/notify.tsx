import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RentalNotifyOptions {
  image?: string | null;
  title: string;
  message: string;
  duration?: number;
}

function RentalToast({
  id,
  image,
  title,
  message,
}: RentalNotifyOptions & { id: string | number }) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 w-[min(380px,calc(100vw-32px))]",
        "bg-background border border-border/60 rounded-2xl",
        "shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.18)]",
        "px-4 py-3.5 pr-9",
      )}
    >
      <div className="shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-muted">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label="Close"
        className="absolute top-2 right-2 h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
  rental: ({ image, title, message, duration = 10000 }: RentalNotifyOptions) =>
    toast.custom(
      (id) => <RentalToast id={id} image={image} title={title} message={message} />,
      {
        duration,
        position: "bottom-center",
        unstyled: true,
        classNames: {
          toast: "!bg-transparent !border-0 !shadow-none !p-0",
        },
      },
    ),
};