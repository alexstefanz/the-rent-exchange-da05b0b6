import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, ChevronDown, CheckCircle2 } from "lucide-react";
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
  isRentalPaidLike,
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
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getProductUrlFromTitle } from "@/lib/slugUtils";
import { ExternalLink } from "lucide-react";

interface ChatPanelProps {
  conversationId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  productTitle: string;
  ownerId?: string;
  buyerId?: string;
  rentalsId?: string | null;
  productId?: string | null;
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
  productId,
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
  const [reopenedAt, setReopenedAt] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);
  const [peerPhone, setPeerPhone] = useState<string | null>(null);
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
        .select("buyer_id,owner_id,buyer_last_read_at,owner_last_read_at,reopened_at")
        .eq("id", conversationId)
        .maybeSingle();
      if (data) {
        const peerRead = user.id === (data as any).buyer_id
          ? (data as any).owner_last_read_at
          : (data as any).buyer_last_read_at;
        setPeerLastReadAt(peerRead);
        setReopenedAt((data as any).reopened_at ?? null);
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
          setReopenedAt(conv.reopened_at ?? null);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[chat-panel:${conversationId}] status:`, status);
        }
        if (status === "SUBSCRIBED") {
          // Catch any INSERT that fired between open and channel-ready (RLS race).
          queryClient.invalidateQueries({ queryKey: ["messages-attached", conversationId] });
        }
      });
    return () => {
      supabase.removeChannel(channel);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
  }, [conversationId, user?.id, queryClient]);

  // Fetch the peer's phone for the header. The underlying RPC is bidirectional
  // (works for both owner and renter) and only returns data once the rental is
  // paid/authorized, so we can call it unconditionally for the peer.
  useEffect(() => {
    if (!peerId) {
      setPeerPhone(null);
      return;
    }
    getOwnerContactInfo(peerId).then((info) => setPeerPhone(info?.phone || null));
  }, [peerId]);

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
    // Optimistic: show the message immediately so the UI feels instant.
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (uploaded.length === 0) {
      const optimistic: Message = {
        id: tmpId,
        conversation_id: conversationId,
        sender_id: user?.id || null,
        content: finalContent,
        is_read: false,
        created_at: new Date().toISOString(),
        attachments: [],
      };
      setLocalMessages((prev) => [...prev, optimistic]);
    }
    let sent;
    try {
      sent = await sendMessage(conversationId, finalContent);
    } catch (e: any) {
      setLocalMessages((prev) => prev.filter((m) => m.id !== tmpId));
      if (e?.message === "PROFANITY_BLOCKED") {
        toast.error(
          t(
            "Mesajul conține limbaj licențios. Încălcările repetate pot duce la suspendarea contului.",
            "Message contains offensive language. Repeated violations can lead to account suspension."
          )
        );
        throw e;
      }
      if (e?.message === "CONTACT_INFO_BLOCKED") {
        toast.error(
          t(
            "Nu poți trimite date de contact (telefon, email sau link-uri) înainte de plata rezervării.",
            "You can't share contact details (phone, email or links) before the booking is paid."
          )
        );
        throw e;
      }
      if (e?.message === "TOO_MANY_SPECIAL_CHARS") {
        toast.error(
          t(
            "Maxim 20 simboluri speciale per mesaj.",
            "Maximum 20 special symbols per message."
          )
        );
        throw e;
      }
      throw e;
    }
    if (!sent) {
      setLocalMessages((prev) => prev.filter((m) => m.id !== tmpId));
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
      setLocalMessages((prev) => {
        // Replace the optimistic placeholder (if any) with the real message;
        // if realtime already inserted it (without attachments), merge attachments in.
        const withoutTmp = prev.filter((m) => m.id !== tmpId);
        const existingIdx = withoutTmp.findIndex((m) => m.id === sent.id);
        if (existingIdx >= 0) {
          if (attachments.length === 0) return withoutTmp;
          const merged = [...withoutTmp];
          merged[existingIdx] = { ...merged[existingIdx], ...sent, attachments };
          return merged;
        }
        return [...withoutTmp, { ...sent, attachments }];
      });
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

  const isClosed = useMemo(() => {
    if (!rentalCtx) return false;
    if (rentalCtx.status !== "completed") return false;
    if (!reopenedAt) return true;
    // Reopened any time after status changed → keep open
    return false;
  }, [rentalCtx, reopenedAt]);

  const handleReopen = async () => {
    if (!conversationId || reopening) return;
    setReopening(true);
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("conversations")
      .update({ reopened_at: nowIso })
      .eq("id", conversationId);
    setReopening(false);
    if (error) {
      toast.error(t("Nu am putut relua conversația.", "Could not resume the conversation."));
      return;
    }
    setReopenedAt(nowIso);
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const isPaid = isRentalPaidLike(rentalCtx?.payment_status, rentalCtx?.paid_at);

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {!hideHeader && (
        <ChatHeader
          name={otherUserName}
          avatarUrl={otherUserAvatar}
          online={peerOnline}
          typing={peerTyping}
          onBack={onBack}
          onInfo={onOpenInfo}
          phone={peerPhone}
          showPhone={isPaid}
          profileUrl={peerId ? `/utilizator/${peerId}` : null}
          productUrl={
            rentalCtx?.product_slug
              ? `/produs/${rentalCtx.product_slug}`
              : rentalCtx?.product_id
              ? `/produs/${rentalCtx.product_id}`
              : productId
              ? `/produs/${productId}`
              : null
          }
        />
      )}

      {rentalCtx && (
        <div className="shrink-0">
          <BookingSummaryCard rental={rentalCtx} isOwner={isOwner} fallbackTitle={productTitle} />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4" style={{ touchAction: "pan-y" }}>
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

      {isClosed ? (
        <div className="border-t bg-background px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("Conversație finalizată", "Conversation closed")}</p>
              <p className="text-xs text-muted-foreground">
                {t("Închirierea a fost încheiată.", "The rental has ended.")}
              </p>
            </div>
          </div>
          <Button onClick={handleReopen} disabled={reopening} size="sm" className="shrink-0">
            {reopening
              ? t("Se reia…", "Resuming…")
              : t("Reia conversația", "Resume conversation")}
          </Button>
        </div>
      ) : (
        <MessageInput
          key={conversationId}
          conversationId={conversationId}
          isPaid={isPaid}
          onSend={handleSend}
          onTyping={() => setTyping(true)}
        />
      )}

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
