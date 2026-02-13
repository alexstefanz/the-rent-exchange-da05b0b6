import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle } from "lucide-react";
import { Conversation } from "@/features/messaging/messagingApi";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";

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
  const filtered = conversations.filter((conv) =>
    activeTab === "rezervari" ? conv.buyer_id === userId : conv.owner_id === userId
  );

  const unread = filtered.filter((c) => (c.unread_count || 0) > 0);
  const read = filtered.filter((c) => !c.unread_count || c.unread_count === 0);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Ieri";
    return format(date, "d MMM", { locale: ro });
  };

  const renderItem = (conv: Conversation) => (
    <button
      key={conv.id}
      onClick={() => onSelect(conv)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50 ${
        selectedId === conv.id ? "bg-muted" : ""
      }`}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conv.other_user?.avatar_url || undefined} />
        <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">
            {conv.product?.title || "Produs"}
          </span>
          {conv.last_message && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(conv.last_message.created_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.other_user?.full_name || "Utilizator"}</p>
        {conv.last_message && (
          <p
            className={`text-sm truncate mt-0.5 ${
              conv.unread_count ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {conv.last_message.sender_id === userId ? "Tu: " : ""}
            {conv.last_message.content}
          </p>
        )}
      </div>

      {conv.unread_count && conv.unread_count > 0 && (
        <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center text-[11px]">
          {conv.unread_count}
        </Badge>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Mesaje</h1>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="rezervari" className="flex-1">Rezervări</TabsTrigger>
            <TabsTrigger value="de-inchiriat" className="flex-1">De Închiriat</TabsTrigger>
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
                ? "Nicio conversație despre rezervări."
                : "Nicio conversație despre produsele tale."}
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div className="mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">
                  Necitite
                </p>
                {unread.map(renderItem)}
              </div>
            )}
            {read.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">
                  Citite
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
