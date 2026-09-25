import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/queries/useConversations";
import { useLanguage } from "@/contexts/LanguageContext";
import { Conversation } from "@/features/messaging/messagingApi";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatPanel } from "@/components/messaging/ChatPanel";
import { useQueryClient } from "@tanstack/react-query";
import { useChatViewport } from "@/hooks/useChatViewport";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

const MessagesTab = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const t = (ro: string, en: string) => language === "ro" ? ro : en;
  const { data: conversations = [], isLoading } = useConversations(user?.id);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  useChatViewport(!isDesktop && !!selectedConversation);

  const handleSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleBack = () => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    if (!isDesktop) {
      setIsClosing(true);
      return;
    }
    setSelectedConversation(null);
  };

  const handleCloseAnimationEnd = () => {
    if (!isClosing) return;
    setSelectedConversation(null);
    setIsClosing(false);
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

  // Mobile: fullscreen chat when selected
  if (!isDesktop && selectedConversation) {
    return (
      <>
        <div className={`pointer-events-none ${isClosing ? "animate-slide-in-left" : ""}`}>
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            userId={user?.id || ""}
            onSelect={handleSelect}
          />
        </div>
        <div
        className={`fixed inset-0 z-50 bg-background flex flex-col transform-gpu will-change-transform ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
        style={{
          top: "var(--chat-top, 0px)",
          height: "var(--chat-h, 100dvh)",
          bottom: "auto",
        }}
        onAnimationEnd={handleCloseAnimationEnd}
        >
        <ChatPanel
          conversationId={selectedConversation.id}
          otherUserName={selectedConversation.other_user?.full_name || null}
          otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
          productTitle={selectedConversation.product?.title || "Produs"}
          ownerId={selectedConversation.owner_id}
          buyerId={selectedConversation.buyer_id}
          rentalsId={selectedConversation.rentals_id || null}
          onBack={handleBack}
        />
        </div>
      </>
    );
  }

  // Mobile: just the list
  if (!isDesktop) {
    return (
      <ConversationList
        conversations={conversations}
        isLoading={isLoading}
        userId={user?.id || ""}
        onSelect={handleSelect}
      />
    );
  }

  // Desktop: split view
  return (
    <div className="flex h-[calc(100vh-16rem)] border rounded-xl overflow-hidden bg-background shadow-sm">
      <div className="w-[340px] shrink-0 border-r flex flex-col">
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          userId={user?.id || ""}
          selectedId={selectedConversation?.id}
          onSelect={handleSelect}
        />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatPanel
            conversationId={selectedConversation.id}
            otherUserName={selectedConversation.other_user?.full_name || null}
            otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
            productTitle={selectedConversation.product?.title || "Produs"}
            ownerId={selectedConversation.owner_id}
            buyerId={selectedConversation.buyer_id}
            rentalsId={selectedConversation.rentals_id || null}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-3" />
            <p className="text-sm">{t("Selectează o conversație pentru a vedea mesajele", "Select a conversation to see messages")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
