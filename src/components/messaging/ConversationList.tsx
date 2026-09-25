import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, LifeBuoy } from "lucide-react";
import { Conversation } from "@/features/messaging/messagingApi";
import { format, isToday, isYesterday } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  userId: string;
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  userId,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;
  const filtered = conversations;

  const sortByRecent = (a: Conversation, b: Conversation) => {
    const ta = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
    const tb = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
    return tb - ta;
  };
  const unread = filtered.filter((c) => (c.unread_count || 0) > 0).sort(sortByRecent);
  const read = filtered.filter((c) => !c.unread_count || c.unread_count === 0).sort(sortByRecent);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return t("Ieri", "Yesterday");
    return format(date, "d MMM", { locale: dateLocale });
  };

  const formatRentalRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${format(s, "d MMM", { locale: dateLocale })} – ${format(e, "d MMM yyyy", { locale: dateLocale })}`;
  };

  const renderItem = (conv: Conversation) => {
    const isUnread = (conv.unread_count || 0) > 0;
    const isRenter = conv.buyer_id === userId;
    const roleLabel = isRenter ? t("Chiriaș", "Renter") : t("Proprietar", "Owner");
    return (
    <button
      key={conv.id}
      onClick={() => onSelect(conv)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50 border-l-4",
        isRenter ? "border-renter" : "border-primary",
        selectedId === conv.id
          ? isRenter ? "bg-renter/10" : "bg-primary/10"
          : isUnread
          ? isRenter ? "bg-renter/5" : "bg-primary/5"
          : "bg-transparent"
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conv.other_user?.avatar_url || undefined} />
        <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isUnread ? "font-extrabold text-foreground" : "font-medium"}`}>
            {conv.product?.title || t("Produs", "Product")}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isUnread && <span className={cn("h-2 w-2 rounded-full", isRenter ? "bg-renter" : "bg-primary")} aria-hidden />}
            {conv.last_message && (
              <span className={`text-xs whitespace-nowrap ${isUnread ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {formatTime(conv.last_message.created_at)}
              </span>
            )}
          </div>
        </div>
        <span className={cn(
          "mt-0.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold",
          isRenter ? "bg-renter/10 text-renter" : "bg-primary/10 text-primary"
        )}>
          {roleLabel}
        </span>
        {conv.rental && (
          <p className={cn("text-[11px] font-medium truncate mt-0.5", isRenter ? "text-renter" : "text-primary")}>
            {formatRentalRange(conv.rental.start_date, conv.rental.end_date)}
            {" · "}
            {conv.rental.rental_days}{" "}
            {conv.rental.rental_days === 1 ? t("zi", "day") : t("zile", "days")}
          </p>
        )}
        <p className={`text-xs truncate ${isUnread ? "text-foreground font-bold" : "text-muted-foreground"}`}>{conv.other_user?.full_name || t("Utilizator", "User")}</p>
        {conv.last_message && (
          <p
            className={`text-sm truncate mt-0.5 ${
              isUnread ? "font-bold text-foreground" : "text-muted-foreground"
            }`}
          >
            {(() => {
              const m = conv.last_message;
              const c = m.content ?? "";
              if (!m.sender_id) {
                const kind = c.split("|")[0];
                const map: Record<string, [string, string]> = {
                  booking_confirmed: ["Rezervare confirmată", "Booking confirmed"],
                  request_accepted: ["Cerere acceptată", "Request accepted"],
                  request_declined: ["Cerere refuzată", "Request declined"],
                  payment_completed: ["Plată efectuată", "Payment completed"],
                  handover_done: ["Produs predat", "Item handed over"],
                  return_started: ["Returnare în curs", "Return in progress"],
                  rental_completed: ["Închiriere finalizată", "Rental completed"],
                  booking_cancelled: ["Rezervare anulată", "Booking cancelled"],
                };
                const label = map[kind];
                if (label) return `🛎 ${t(label[0], label[1])}`;
              }
              return `${m.sender_id === userId ? t("Tu: ", "You: ") : ""}${c}`;
            })()}
          </p>
        )}
      </div>

      {conv.unread_count && conv.unread_count > 0 && (
        <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center text-[11px] bg-primary text-primary-foreground shadow-sm">
          {conv.unread_count}
        </Badge>
      )}
    </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{t("Mesaje", "Messages")}</h1>
            <p className="text-xs text-muted-foreground">{t("Toate conversațiile", "All conversations")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={t("Suport", "Support")}
            onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
          >
            <LifeBuoy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <MessageCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("Nu ai încă nicio conversație.", "You don't have any conversations yet.")}
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div className="mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary px-3 py-2">
                  {t("Necitite", "Unread")}
                </p>
                {unread.map(renderItem)}
              </div>
            )}
            {read.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">
                  {t("Citite", "Read")}
                </p>
                {read.map(renderItem)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
