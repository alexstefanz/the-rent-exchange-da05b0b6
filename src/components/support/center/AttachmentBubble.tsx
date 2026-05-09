import { useQuery } from "@tanstack/react-query";
import { ImageOff, Loader2 } from "lucide-react";
import { getTicketAttachmentSignedUrl } from "@/features/tickets/userTicketsApi";

export function AttachmentBubble({ reference, onOpen }: { reference: string; onOpen?: (url: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["ticketAttachmentUrl", reference],
    queryFn: () => getTicketAttachmentSignedUrl(reference),
    staleTime: 50 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="h-32 w-48 rounded-xl bg-muted/60 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="h-24 w-40 rounded-xl bg-muted/60 flex flex-col items-center justify-center gap-1 text-muted-foreground">
        <ImageOff className="h-5 w-5" />
        <span className="text-[10px]">Imagine indisponibilă</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen?.(data)}
      className="block overflow-hidden rounded-xl border border-border/40 hover:opacity-90 transition"
    >
      <img
        src={data}
        alt="Atașament ticket"
        loading="lazy"
        className="max-h-56 max-w-[240px] object-cover"
      />
    </button>
  );
}