import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, ArrowLeft, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  sendMessage,
  markMessagesAsRead,
  Message,
  MAX_MESSAGE_LENGTH,
  getOwnerContactInfo,
} from "@/features/messaging/messagingApi";
import { useMessages } from "@/hooks/queries/useConversations";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatPanelProps {
  conversationId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  productTitle: string;
  ownerId?: string;
  onBack?: () => void;
  className?: string;
}

export function ChatPanel({
  conversationId,
  otherUserName,
  otherUserAvatar,
  productTitle,
  ownerId,
  onBack,
  className = "",
}: ChatPanelProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const dateLocale = language === "ro" ? ro : enUS;
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: fetchedMessages, isLoading } = useMessages(conversationId);

  // Sync fetched messages to local state
  useEffect(() => {
    if (fetchedMessages) {
      setLocalMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Subscribe to realtime + mark as read
  useEffect(() => {
    if (!conversationId) return;

    markMessagesAsRead(conversationId);

    const channel = supabase
      .channel(`chat-panel-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setLocalMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== user?.id) {
            markMessagesAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Refresh conversations unread counts on unmount
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
  }, [conversationId, user?.id, queryClient]);

  // Fetch owner phone for 3CX call button
  useEffect(() => {
    if (!ownerId) return;
    getOwnerContactInfo(ownerId).then((info) => {
      setOwnerPhone(info?.phone || null);
    });
  }, [ownerId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const sent = await sendMessage(conversationId, newMessage);
    if (sent) setNewMessage("");
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={otherUserAvatar || undefined} />
          <AvatarFallback>{otherUserName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-sm truncate">{productTitle}</span>
          <span className="text-xs text-muted-foreground truncate">{otherUserName || t("Utilizator", "User")}</span>
        </div>
        {ownerPhone && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={`tel:${ownerPhone}`} className="shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-green-600 transition-colors"
                    asChild
                  >
                    <span>
                      <Phone className="h-5 w-5" />
                    </span>
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent>{t("Apelează prin 3CX", "Call via 3CX")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t("Niciun mesaj încă. Trimite primul mesaj!", "No messages yet. Send the first one!")}
          </div>
        ) : (
          <div className="space-y-3">
            {localMessages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2 bg-background">
        <Input
          placeholder={t("Scrie un mesaj...", "Write a message...")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onKeyDown={handleKeyPress}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
