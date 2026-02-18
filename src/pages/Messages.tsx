import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation } from "@/features/messaging/messagingApi";
import { useConversations } from "@/hooks/queries/useConversations";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatPanel } from "@/components/messaging/ChatPanel";
import { useState as useStateReact } from "react";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useStateReact(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState("rezervari");

  if (!authLoading && !user) {
    navigate("/auth");
  }

  const { data: conversations = [], isLoading } = useConversations(user?.id);

  // Auto-select conversation from URL query param
  useEffect(() => {
    const convId = searchParams.get("conv");
    if (convId && conversations.length > 0 && !selectedConversation) {
      const found = conversations.find((c) => c.id === convId);
      if (found) setSelectedConversation(found);
    }
  }, [searchParams, conversations, selectedConversation]);

  const handleSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mobile: fullscreen chat when a conversation is selected
  if (!isDesktop && selectedConversation) {
    return (
      <div className="h-[100dvh] flex flex-col">
        <ChatPanel
          conversationId={selectedConversation.id}
          otherUserName={selectedConversation.other_user?.full_name || null}
          otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
          productTitle={selectedConversation.product?.title || "Produs"}
          ownerId={selectedConversation.owner_id}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Mobile: conversation list (no chat selected)
  if (!isDesktop) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pb-20">
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            userId={user?.id || ""}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSelect={handleSelect}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Desktop: split view
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex h-[calc(100vh-10rem)] border rounded-xl overflow-hidden bg-background shadow-sm">
          {/* Left: conversation list */}
          <div className="w-[340px] shrink-0 border-r flex flex-col">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              userId={user?.id || ""}
              selectedId={selectedConversation?.id}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSelect={handleSelect}
            />
          </div>

          {/* Right: chat area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <ChatPanel
                conversationId={selectedConversation.id}
                otherUserName={selectedConversation.other_user?.full_name || null}
                otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
                productTitle={selectedConversation.product?.title || "Produs"}
                ownerId={selectedConversation.owner_id}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-3" />
                <p className="text-sm">Selectează o conversație pentru a vedea mesajele</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
