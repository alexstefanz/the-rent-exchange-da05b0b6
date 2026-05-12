import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle } from "lucide-react";
import { Conversation } from "@/features/messaging/messagingApi";
import { format, isToday, isYesterday } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  userId: string;
  selectedId?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  userId,
  selectedId,
  activeTab,
  onTabChange,
  onSelect,
}: ConversationListProps) {
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;
  const rezervariUnread = conversations
    .filter(c => c.buyer_id === userId)
    .reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const deInchiriatUnread = conversations
    .filter(c => c.owner_id === userId)
    .reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const filtered = conversations.filter((conv) =>
    activeTab === "rezervari" ? conv.buyer_id === userId : conv.owner_id === userId
  );

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
    return (
    <button
      key={conv.id}
      onClick={() => onSelect(conv)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50 border-l-2 ${
        selectedId === conv.id
          ? "bg-muted border-primary"
          : isUnread
          ? "bg-primary/5 border-primary"
          : "border-transparent"
      }`}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conv.other_user?.avatar_url || undefined} />
        <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-medium"}`}>
            {conv.product?.title || t("Produs", "Product")}
          </span>
          {conv.last_message && (
            <span className={`text-xs whitespace-nowrap ${isUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {formatTime(conv.last_message.created_at)}
            </span>
          )}
        </div>
        {conv.rental && (
          <p className="text-[11px] text-primary font-medium truncate mt-0.5">
            {formatRentalRange(conv.rental.start_date, conv.rental.end_date)}
            {" · "}
            {conv.rental.rental_days}{" "}
            {conv.rental.rental_days === 1 ? t("zi", "day") : t("zile", "days")}
          </p>
        )}
        <p className={`text-xs truncate ${isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>{conv.other_user?.full_name || t("Utilizator", "User")}</p>
        {conv.last_message && (
          <p
            className={`text-sm truncate mt-0.5 ${
              conv.unread_count ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {(!conv.last_message.sender_id || conv.last_message.content?.startsWith("booking_confirmed|"))
              ? `🛎 ${t("Rezervare confirmată", "Booking confirmed")}`
              : `${conv.last_message.sender_id === userId ? t("Tu: ", "You: ") : ""}${conv.last_message.content}`}
          </p>
        )}
      </div>

      {conv.unread_count && conv.unread_count > 0 && (
        <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center text-[11px] bg-primary text-primary-foreground">
          {conv.unread_count}
        </Badge>
      )}
    </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <h1 className="text-xl font-bold mb-3">{t("Mesaje", "Messages")}</h1>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="rezervari" className="flex-1 gap-1.5">
              {t("Rezervări", "Reservations")}
              {rezervariUnread > 0 && (
                <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5 py-0">
                  {rezervariUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="de-inchiriat" className="flex-1 gap-1.5">
              {t("De Închiriat", "For Rent")}
              {deInchiriatUnread > 0 && (
                <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5 py-0">
                  {deInchiriatUnread}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
              {activeTab === "rezervari"
                ? t("Nicio conversație despre rezervări.", "No reservation conversations.")
                : t("Nicio conversație despre produsele tale.", "No conversations about your products.")}
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
