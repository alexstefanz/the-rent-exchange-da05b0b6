import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  markConversationRead,
  getMessagesWithAttachments,
  getRentalContext,
  getOwnerContactInfo,
  sendMessage,
  Message,
  RentalContextRow,
} from "@/features/messaging/messagingApi";
import { attachToMessage, type AttachmentRow, type UploadedAttachment } from "@/lib/chatMedia";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatPresence } from "@/hooks/useChatPresence";
import { ChatHeader } from "@/components/messaging/ChatHeader";
import { RentalStageStepper } from "@/components/messaging/RentalStageStepper";
import { TransactionCard } from "@/components/messaging/TransactionCard";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { SystemMessageBubble } from "@/components/messaging/SystemMessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { DateSeparator } from "@/components/messaging/DateSeparator";
import { MediaLightbox } from "@/components/messaging/MediaLightbox";
import { isSameDay } from "date-fns";
import { toast } from "sonner";

interface ChatPanelProps {
  conversationId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  productTitle: string;
  ownerId?: string;
  buyerId?: string;
  rentalsId?: string | null;
  onBack?: () => void;
  onOpenInfo?: () => void;
  className?: string;
  hideHeader?: boolean;
  defaultRentalContextOpen?: boolean;
}

export function ChatPanel({
  conversationId,
  otherUserName,
  otherUserAvatar,
  productTitle,
  ownerId,
  buyerId,
  rentalsId,
  onBack,
  onOpenInfo,
  className = "",
  hideHeader = false,
  defaultRentalContextOpen = true,
}: ChatPanelProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ items: AttachmentRow[]; index: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOwner = user?.id === ownerId;
  const peerId = isOwner ? buyerId : ownerId;
  const [rentalCtxOpen, setRentalCtxOpen] = useState(defaultRentalContextOpen);

  const { peerOnline, peerTyping, setTyping } = useChatPresence(
    conversationId,
    user?.id || null,
    peerId || null
  );

  const { data: fetchedMessages, isLoading } = useQuery({
    queryKey: ["messages-attached", conversationId],
    queryFn: () => getMessagesWithAttachments(conversationId),
    enabled: !!conversationId,
    staleTime: 10_000,
  });

  const { data: rentalCtx } = useQuery<RentalContextRow | null>({
    queryKey: ["rental-context", rentalsId],
    queryFn: () => (rentalsId ? getRentalContext(rentalsId) : Promise.resolve(null)),
    enabled: !!rentalsId,
    staleTime: 30_000,
  });

  // Sync messages
  useEffect(() => {
    if (fetchedMessages) setLocalMessages(fetchedMessages);
  }, [fetchedMessages]);

  // Initial conversation read state + subscribe to read receipts
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("buyer_id,owner_id,buyer_last_read_at,owner_last_read_at")
        .eq("id", conversationId)
        .maybeSingle();
      if (data) {
        const peerRead = user.id === (data as any).buyer_id
          ? (data as any).owner_last_read_at
          : (data as any).buyer_last_read_at;
        setPeerLastReadAt(peerRead);
      }
    })();
  }, [conversationId, user?.id]);

  // Mark read on open + on new incoming
  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId);
  }, [conversationId]);

  // Realtime: messages + attachments + conversations updates
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-panel-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Refetch attachments for new message
          const { data: atts } = await supabase
            .from("message_attachments")
            .select("*")
            .eq("message_id", newMsg.id);
          const enriched: Message = { ...newMsg, attachments: (atts || []) as AttachmentRow[] };
          setLocalMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
          if (newMsg.sender_id !== user?.id) {
            markConversationRead(conversationId);
          }
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversationId}` },
        (payload) => {
          const conv = payload.new as any;
          const peerRead =
            user?.id === conv.buyer_id ? conv.owner_last_read_at : conv.buyer_last_read_at;
          setPeerLastReadAt(peerRead);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
  }, [conversationId, user?.id, queryClient]);

  // Fetch owner phone for header (only if peer is owner)
  useEffect(() => {
    if (!ownerId || isOwner) {
      setOwnerPhone(null);
      return;
    }
    getOwnerContactInfo(ownerId).then((info) => setOwnerPhone(info?.phone || null));
  }, [ownerId, isOwner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, peerTyping]);

  const handleSend = async (content: string, uploaded: UploadedAttachment[]) => {
    if (!content.trim() && uploaded.length === 0) return;
    // For text-only just send. For attachments, ensure there's at least a placeholder content.
    const finalContent = content.trim() || "📎";
    let sent;
    try {
      sent = await sendMessage(conversationId, finalContent);
    } catch (e: any) {
      if (e?.message === "PROFANITY_BLOCKED") {
        toast.error(
          t(
            "Mesajul conține limbaj licențios. Încălcările repetate pot duce la suspendarea contului.",
            "Message contains offensive language. Repeated violations can lead to account suspension."
          )
        );
        throw e;
      }
      throw e;
    }
    if (sent) {
      let attachments: AttachmentRow[] = [];
      if (uploaded.length > 0) {
        await attachToMessage(sent.id, uploaded.map((u) => u.id));
        const { data } = await supabase
          .from("message_attachments")
          .select("*")
          .eq("message_id", sent.id);
        attachments = (data || []) as AttachmentRow[];
      }
      setLocalMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, { ...sent, attachments }]
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  // Group messages with date separators + grouping logic
  const renderItems = useMemo(() => {
    const items: Array<
      | { kind: "date"; date: string; key: string }
      | { kind: "msg"; msg: Message; isOwn: boolean; isLastInGroup: boolean; seen: boolean; key: string }
    > = [];
    let prev: Message | null = null;
    for (let i = 0; i < localMessages.length; i++) {
      const m = localMessages[i];
      const next = localMessages[i + 1];
      if (!prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at))) {
        items.push({ kind: "date", date: m.created_at, key: `d-${m.id}` });
      }
      const isOwn = m.sender_id === user?.id;
      const sameSenderAsNext =
        next &&
        next.sender_id === m.sender_id &&
        isSameDay(new Date(m.created_at), new Date(next.created_at)) &&
        new Date(next.created_at).getTime() - new Date(m.created_at).getTime() < 5 * 60_000;
      const isLastInGroup = !sameSenderAsNext;
      const seen =
        isOwn && peerLastReadAt
          ? new Date(peerLastReadAt).getTime() >= new Date(m.created_at).getTime()
          : false;
      items.push({ kind: "msg", msg: m, isOwn, isLastInGroup, seen, key: m.id });
      prev = m;
    }
    return items;
  }, [localMessages, user?.id, peerLastReadAt]);

  return (
    <div className={`flex flex-col h-full bg-[#FCFAF8] ${className}`}>
      {!hideHeader && (
        <ChatHeader
          name={otherUserName}
          avatarUrl={otherUserAvatar}
          productTitle={productTitle}
          online={peerOnline}
          typing={peerTyping}
          onBack={onBack}
          onInfo={onOpenInfo}
          phone={ownerPhone}
        />
      )}

      {rentalCtx && (
        <div className="border-b bg-background shrink-0">
          <button
            type="button"
            onClick={() => setRentalCtxOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            aria-expanded={rentalCtxOpen}
          >
            {rentalCtx.product_image ? (
              <img
                src={rentalCtx.product_image}
                alt=""
                className="h-8 w-8 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {rentalCtx.product_title || productTitle}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {rentalCtx.public_id} · {rentalCtx.rental_days}{" "}
                {rentalCtx.rental_days === 1 ? t("zi", "day") : t("zile", "days")} ·{" "}
                {rentalCtx.subtotal} RON
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                rentalCtxOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {rentalCtxOpen && (
            <div className="border-t">
              <RentalStageStepper rental={rentalCtx} />
              <TransactionCard
                data={{
                  publicId: rentalCtx.public_id,
                  productTitle: rentalCtx.product_title || productTitle,
                  productImage: rentalCtx.product_image,
                  startDate: rentalCtx.start_date,
                  endDate: rentalCtx.end_date,
                  rentalDays: rentalCtx.rental_days,
                  subtotal: rentalCtx.subtotal,
                  status: rentalCtx.status,
                  paymentStatus: rentalCtx.payment_status,
                  role: isOwner ? "owner" : "renter",
                }}
              />
            </div>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3" style={{ touchAction: "pan-y" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            {t("Niciun mesaj încă. Trimite primul mesaj!", "No messages yet. Send the first one!")}
          </div>
        ) : (
          <div className="space-y-1.5">
            {renderItems.map((it) =>
              it.kind === "date" ? (
                <DateSeparator key={it.key} date={it.date} />
              ) : it.msg.message_type === "system" ? (
                <SystemMessageBubble key={it.key} message={it.msg} />
              ) : (
                <MessageBubble
                  key={it.key}
                  message={it.msg}
                  isOwn={it.isOwn}
                  showAvatar={false}
                  isLastInGroup={it.isLastInGroup}
                  seen={it.seen}
                  onOpenAttachment={(items, index) => setLightbox({ items, index })}
                />
              )
            )}
            {peerTyping && (
              <div className="pt-1">
                <TypingIndicator />
              </div>
            )}
          </div>
        )}
      </div>

      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        onTyping={() => setTyping(true)}
      />

      {lightbox && (
        <MediaLightbox
          attachments={lightbox.items}
          startIndex={lightbox.index}
          open={!!lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
