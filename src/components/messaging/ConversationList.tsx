import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, LifeBuoy, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
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
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "archived">("all");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isArchived = (c: Conversation) => !!c.rental && new Date(c.rental.end_date) < today;
  const q = query.trim().toLowerCase();
  const filtered = conversations.filter((c) => {
    if (tab === "active" && isArchived(c)) return false;
    if (tab === "archived" && !isArchived(c)) return false;
    if (!q) return true;
    return [c.other_user?.full_name, c.product?.title, c.last_message?.content].some((v) => v?.toLowerCase().includes(q));
  });
  const totalUnread = conversations.filter((c) => (c.unread_count || 0) > 0).length;

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
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-muted/50 border-l-[3px]",
        selectedId === conv.id ? "bg-primary/10 border-primary" : "border-transparent"
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conv.other_user?.avatar_url || undefined} />
        <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-semibold"}`}>
            {conv.other_user?.full_name || t("Utilizator", "User")}
          </span>
          {conv.last_message && (
            <span className={`text-xs whitespace-nowrap shrink-0 ${isUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {formatTime(conv.last_message.created_at)}
            </span>
          )}
        </div>
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
        <p className="text-xs text-muted-foreground/80 truncate mt-0.5">{conv.product?.title || t("Produs", "Product")}</p>
      </div>

      {(conv.unread_count || 0) > 0 && (
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
            <h1 className="text-xl font-bold flex items-center gap-2">{t("Mesaje", "Messages")}
              {totalUnread > 0 && <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">{totalUnread}</span>}
            </h1>
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
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Caută conversații...", "Search conversations...")} className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-1 mt-3 border-b border-border/60">
          {([["all", "Toate", "All"], ["active", "Active", "Active"], ["archived", "Arhivate", "Archived"]] as const).map(([k, r, e]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn("px-3 py-2 text-sm -mb-px border-b-2 transition-colors", tab === k ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t(r, e)}{k === "all" ? ` (${conversations.length})` : ""}
            </button>
          ))}
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
