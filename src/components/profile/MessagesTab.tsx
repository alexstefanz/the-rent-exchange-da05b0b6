import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/queries/useConversations";
import { useLanguage } from "@/contexts/LanguageContext";
import { Conversation } from "@/features/messaging/messagingApi";
import { ChatDialog } from "@/components/messaging/ChatDialog";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";

const MessagesTab = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = (ro: string, en: string) => language === "ro" ? ro : en;
  const { data: conversations, isLoading, refetch } = useConversations(user?.id);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: language === "ro" ? ro : enUS
    });
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {t("Nicio conversație", "No conversations")}
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            {t(
              "Nu ai încă nicio conversație. Când vei începe o discuție despre un produs, aceasta va apărea aici.",
              "You don't have any conversations yet. When you start a discussion about a product, it will appear here."
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {conversations.map((conversation) => (
          <Card 
            key={conversation.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
            onClick={() => setSelectedConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={conversation.other_user?.avatar_url || undefined} 
                    alt={conversation.other_user?.full_name || "User"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conversation.other_user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium truncate">
                      {conversation.other_user?.full_name || t("Utilizator", "User")}
                    </h4>
                    {conversation.last_message && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatMessageTime(conversation.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.product?.title}
                  </p>
                  
                  {conversation.last_message && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.last_message.content}
                    </p>
                  )}
                </div>

                {(conversation.unread_count ?? 0) > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedConversation && (
        <ChatDialog
          open={!!selectedConversation}
          onOpenChange={(open) => !open && handleCloseChat()}
          conversationId={selectedConversation.id}
          otherUserName={selectedConversation.other_user?.full_name || null}
          otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
          productTitle={selectedConversation.product?.title || ""}
        />
      )}
    </>
  );
};

export default MessagesTab;
