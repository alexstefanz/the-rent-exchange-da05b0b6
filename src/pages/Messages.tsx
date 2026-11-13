import { usePageSeo } from "@/hooks/usePageSeo";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation } from "@/features/messaging/messagingApi";
import { useConversations } from "@/hooks/queries/useConversations";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatPanel } from "@/components/messaging/ChatPanel";
import { InfoPanel } from "@/components/messaging/InfoPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
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

export default function Messages({ embedded = false }: { embedded?: boolean } = {}) {
  usePageSeo({ title: "Mesaje — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [sideInfoOpen, setSideInfoOpen] = useState(true);
  const [isXl, setIsXl] = useState(typeof window !== "undefined" ? window.innerWidth >= 1280 : true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const h = (e: MediaQueryListEvent) => setIsXl(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, []);
  const [isClosing, setIsClosing] = useState(false);
  useChatViewport(!isDesktop && !!selectedConversation);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true, state: { returnTo: { pathname: "/mesaje" } } });
    }
  }, [authLoading, user, navigate]);


  const { data: conversations = [], isLoading } = useConversations(user?.id);

  useEffect(() => {
    const convId = searchParams.get("conv");
    if (!convId || !user?.id) return;
    if (convId === selectedConversation?.id) return;
    const found = conversations.find((c) => c.id === convId);
    if (found) {
      setSelectedConversation(found);
    } else if (!isLoading) {
      // Conversation not in the cached list yet (e.g. just created from a
      // product page or checkout). Force a refetch so it shows up.
      queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
    }
  }, [searchParams, conversations, selectedConversation?.id, user?.id, isLoading, queryClient]);

  const handleSelect = (conv: Conversation) => setSelectedConversation(conv);
  const handleBack = () => {
    const returnTo = (location.state as any)?.returnTo as
      | { pathname: string; search?: string; state?: any }
      | undefined;
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    if (returnTo?.pathname) {
      navigate(`${returnTo.pathname}${returnTo.search || ""}`, {
        state: returnTo.state,
      });
      return;
    }
    // Mobile: trigger slide-out animation, then clean up.
    if (!isDesktop) {
      setIsClosing(true);
      return;
    }
    if (searchParams.get("conv")) {
      if (!embedded) navigate("/mesaje", { replace: true });
    }
    setSelectedConversation(null);
  };

  const handleCloseAnimationEnd = () => {
    if (!isClosing) return;
    if (searchParams.get("conv")) {
      if (!embedded) navigate("/mesaje", { replace: true });
    }
    setSelectedConversation(null);
    setIsClosing(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const peerId = selectedConversation
    ? selectedConversation.buyer_id === user?.id
      ? selectedConversation.owner_id
      : selectedConversation.buyer_id
    : null;

  // Mobile fullscreen chat
  if (!isDesktop && selectedConversation) {
    return (
      <>
        {/* List underneath — revealed by chat slide-out for iOS-style push-back */}
        <div
          className={`min-h-screen flex flex-col bg-background ${
            isClosing ? "animate-slide-in-left" : ""
          } pointer-events-none`}
        >
          {!embedded && <Navbar />}
          <main className="flex-1 pb-20">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              userId={user?.id || ""}
              onSelect={handleSelect}
            />
          </main>
          {!embedded && <Footer />}
        </div>
        <div
          className={`fixed inset-0 z-50 flex flex-col overflow-hidden bg-background transform-gpu will-change-transform ${
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
            productTitle={selectedConversation.product?.title || ""}
            ownerId={selectedConversation.owner_id}
            buyerId={selectedConversation.buyer_id}
            rentalsId={selectedConversation.rentals_id || null}
            productId={selectedConversation.product_id || null}
            onBack={handleBack}
            onOpenInfo={() => setMobileInfoOpen(true)}
          />
        </div>
        <Sheet open={mobileInfoOpen} onOpenChange={setMobileInfoOpen}>
          <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-3xl">
            {peerId && (
              <InfoPanel
                conversationId={selectedConversation.id}
                peerId={peerId}
                peerName={selectedConversation.other_user?.full_name || null}
                peerAvatar={selectedConversation.other_user?.avatar_url || null}
                rentalsId={selectedConversation.rentals_id || null}
              />
            )}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Mobile list
  if (!isDesktop) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {!embedded && <Navbar />}
        <main className="flex-1 pb-20">
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            userId={user?.id || ""}
            onSelect={handleSelect}
          />
        </main>
        {!embedded && <Footer />}
      </div>
    );
  }

  // Desktop: 3-column layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!embedded && <Navbar />}
      <main className={embedded ? "flex-1" : "flex-1 container mx-auto px-4 py-6"}>
        <div className="flex h-[calc(100vh-10rem)] border rounded-2xl overflow-hidden bg-background shadow-sm">
          {/* Left: list */}
          <div className="w-[320px] shrink-0 border-r flex flex-col">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              userId={user?.id || ""}
              selectedId={selectedConversation?.id}
              onSelect={handleSelect}
            />
          </div>

          {/* Center: chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedConversation ? (
              <ChatPanel
                conversationId={selectedConversation.id}
                otherUserName={selectedConversation.other_user?.full_name || null}
                otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
                productTitle={selectedConversation.product?.title || ""}
                ownerId={selectedConversation.owner_id}
                buyerId={selectedConversation.buyer_id}
                rentalsId={selectedConversation.rentals_id || null}
                productId={selectedConversation.product_id || null}
                onOpenInfo={() => (isXl ? setSideInfoOpen((v) => !v) : setMobileInfoOpen(true))}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background">
                <MessageCircle className="h-12 w-12 mb-3" />
                <p className="text-sm">{t("Selectează o conversație pentru a vedea mesajele", "Select a conversation to view the messages")}</p>
              </div>
            )}
          </div>

          {/* Right: info panel */}
          {selectedConversation && peerId && isXl && sideInfoOpen && (
            <div className="w-[360px] shrink-0 border-l flex flex-col">
              <InfoPanel
                conversationId={selectedConversation.id}
                peerId={peerId}
                peerName={selectedConversation.other_user?.full_name || null}
                peerAvatar={selectedConversation.other_user?.avatar_url || null}
                rentalsId={selectedConversation.rentals_id || null}
              />
            </div>
          )}
        </div>
      </main>
      <Sheet open={mobileInfoOpen && !isXl} onOpenChange={setMobileInfoOpen}>
        <SheetContent side="right" className="w-[380px] sm:max-w-[380px] p-0">
          {selectedConversation && peerId && (
            <InfoPanel
              conversationId={selectedConversation.id}
              peerId={peerId}
              peerName={selectedConversation.other_user?.full_name || null}
              peerAvatar={selectedConversation.other_user?.avatar_url || null}
              rentalsId={selectedConversation.rentals_id || null}
            />
          )}
        </SheetContent>
      </Sheet>
      {!embedded && <Footer />}
    </div>
  );
}
