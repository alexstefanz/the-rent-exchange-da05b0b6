import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  ImagePlus,
  Inbox,
  Ticket,
  ArrowLeft,
  History,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUserTicket,
  fetchUserTicketMessages,
  addUserTicketMessage,
  fetchUserTickets,
  type OpsTicket,
} from "@/features/tickets/userTicketsApi";
import {
  fetchOpsTickets,
  fetchTicketMessages,
  createTicketMessage,
  type OpsTicket as AdminOpsTicket,
} from "@/features/admin/opsTicketsApi";
import {
  getConversations,
  type Conversation,
} from "@/features/messaging/messagingApi";
import { ChatPanel } from "@/components/messaging/ChatPanel";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { ro as roLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { StatusPill } from "@/components/support/center/StatusPill";
import { cn } from "@/lib/utils";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const COMPRESS_THRESHOLD = 1 * 1024 * 1024;

const compressImage = (file: File): Promise<File> =>
  new Promise((resolve, reject) => {
    if (file.size <= COMPRESS_THRESHOLD) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nu am putut procesa imaginea"));
    };
    img.src = url;
  });

const SUPPORT_BUCKET = "support-attachments";
const SUPPORT_PATH_PREFIX = "support-attachments://";

const uploadSupportImage = async (
  file: File,
  userId: string,
): Promise<string> => {
  const fileName = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.jpg`;
  const { error } = await supabase.storage
    .from(SUPPORT_BUCKET)
    .upload(fileName, file);
  if (error) throw error;
  return `${SUPPORT_PATH_PREFIX}${fileName}`;
};

const extractSupportPath = (raw: string): string | null => {
  const text = raw.trim();
  if (text.startsWith(SUPPORT_PATH_PREFIX)) {
    return text.slice(SUPPORT_PATH_PREFIX.length);
  }
  const publicMatch = text.match(
    /\/storage\/v1\/object\/(?:public|sign)\/support-attachments\/([^?#]+)/,
  );
  if (publicMatch) {
    return decodeURIComponent(publicMatch[1]);
  }
  return null;
};

const SupportImage = ({ path }: { path: string }) => {
  const { data: signedUrl, isLoading } = useQuery({
    queryKey: ["supportSignedUrl", path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(SUPPORT_BUCKET)
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 50 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return <div className="h-32 w-48 rounded-lg bg-muted animate-pulse" />;
  }
  if (!signedUrl) {
    return (
      <p className="text-xs text-muted-foreground italic">
        [imagine indisponibilă]
      </p>
    );
  }
  return (
    <a href={signedUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={signedUrl}
        alt="Imagine atașată"
        className="max-w-full rounded-lg max-h-48 object-cover"
        loading="lazy"
      />
    </a>
  );
};

const renderMessageContent = (text: string) => {
  const path = extractSupportPath(text);
  if (path) return <SupportImage path={path} />;
  return <p className="whitespace-pre-wrap break-words">{text}</p>;
};

const SupportChatWidget = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const dateLocale = language === "ro" ? roLocale : enUS;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tickets">("chat");
  const [chatSubTab, setChatSubTab] = useState<"rezervari" | "de-inchiriat">(
    "rezervari",
  );
  // In-memory only — no localStorage persistence so reopen always lands on the list.
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketPublicId, setTicketPublicId] = useState<string | null>(null);
  const [showTicketArchive, setShowTicketArchive] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  // Reset transient state on close
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("chat");
      setActiveConv(null);
      setTicketId(null);
      setTicketPublicId(null);
      setShowTicketArchive(false);
      setMessageText("");
      setIsInternal(false);
    }
  }, [isOpen]);

  // -------- Admin role detection --------
  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // -------- Admin inbox (Tickete tab for admins) --------
  type AdminInboxTicket = AdminOpsTicket & {
    unread_count: number;
    last_message?: string;
    last_message_at?: string;
  };
  const { data: adminInbox = [], isLoading: isLoadingAdminInbox } = useQuery<
    AdminInboxTicket[]
  >({
    queryKey: ["adminOpsInbox"],
    queryFn: async () => {
      const all = await fetchOpsTickets();
      const active = all.filter((t) =>
        [
          "NEW",
          "IN_PROGRESS",
          "WAITING_CUSTOMER",
          "WAITING_OWNER",
          "WAITING_INTERNAL",
        ].includes(t.status),
      );
      const enriched: AdminInboxTicket[] = await Promise.all(
        active.map(async (ticket) => {
          const msgs = await fetchTicketMessages(ticket.id);
          const lastMsg = msgs[msgs.length - 1];
          const lastAdminRead = ticket.last_admin_read_at;
          const unread = msgs.filter(
            (m) =>
              m.author_type === "CUSTOMER" &&
              (!lastAdminRead ||
                new Date(m.created_at) > new Date(lastAdminRead)),
          ).length;
          return {
            ...ticket,
            unread_count: unread,
            last_message: lastMsg?.message_text,
            last_message_at: lastMsg?.created_at,
          };
        }),
      );
      enriched.sort((a, b) => {
        if (a.status === "NEW" && b.status !== "NEW") return -1;
        if (b.status === "NEW" && a.status !== "NEW") return 1;
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
      return enriched;
    },
    enabled: isOpen && !!user && isAdmin,
    refetchInterval: 15000,
  });

  const adminInboxUnread = adminInbox.reduce(
    (acc, t) => acc + (t.unread_count || 0),
    0,
  );
  const adminNewCount = adminInbox.filter((t) => t.status === "NEW").length;

  // Admin realtime: refresh inbox + active ticket on changes
  useEffect(() => {
    if (!isAdmin || !isOpen) return;
    const ch = supabase
      .channel(`admin-widget-inbox-${user?.id || "x"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_tickets" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["adminOpsInbox"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ops_ticket_messages",
        },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["adminOpsInbox"] });
          const tid = payload?.new?.ticket_id;
          if (tid) {
            queryClient.invalidateQueries({
              queryKey: ["supportChatMessages", tid],
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAdmin, isOpen, user?.id, queryClient]);

  // Mark ticket as read for admin when opened
  useEffect(() => {
    if (!isAdmin || !ticketId) return;
    (supabase
      .from("ops_tickets" as any)
      .update({ last_admin_read_at: new Date().toISOString() } as any)
      .eq("id", ticketId) as any)
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["adminOpsInbox"] }),
      );
  }, [isAdmin, ticketId, queryClient]);

  // -------- Conversations (Chat tab) --------
  const { data: conversations = [], isLoading: isLoadingConvs } = useQuery<
    Conversation[]
  >({
    queryKey: ["conversations", user?.id],
    queryFn: getConversations,
    enabled: isOpen && !!user,
    refetchInterval: 30000,
  });

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unread_count || 0),
    0,
  );

  const filteredConvs = conversations.filter((c) =>
    chatSubTab === "rezervari"
      ? c.buyer_id === user?.id
      : c.owner_id === user?.id,
  );
  const sortedConvs = [...filteredConvs].sort((a, b) => {
    const ta = a.last_message?.created_at
      ? new Date(a.last_message.created_at).getTime()
      : 0;
    const tb = b.last_message?.created_at
      ? new Date(b.last_message.created_at).getTime()
      : 0;
    return tb - ta;
  });

  const formatConvTime = (dateString: string) => {
    const d = new Date(dateString);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return t("Ieri", "Yesterday");
    return format(d, "d MMM", { locale: dateLocale });
  };

  // -------- Tickets (Tickete tab) --------
  const { data: userTickets = [], isLoading: isLoadingTickets } = useQuery<
    OpsTicket[]
  >({
    queryKey: ["userTickets"],
    queryFn: fetchUserTickets,
    enabled: isOpen && !!user,
    refetchInterval: 15000,
  });

  const openTickets = useMemo(
    () =>
      userTickets.filter(
        (x) => x.status !== "CLOSED" && x.status !== "RESOLVED",
      ),
    [userTickets],
  );
  const archivedTickets = useMemo(
    () =>
      userTickets.filter(
        (x) => x.status === "CLOSED" || x.status === "RESOLVED",
      ),
    [userTickets],
  );
  const openTicketsCount = openTickets.length;

  // Auto-select most recent open ticket (regular users only) when entering Tickete tab
  useEffect(() => {
    if (
      isOpen &&
      !isAdmin &&
      activeTab === "tickets" &&
      !ticketId &&
      !showTicketArchive &&
      openTickets.length > 0
    ) {
      const latest = openTickets[0];
      setTicketId(latest.id);
      setTicketPublicId(latest.public_id ?? null);
    }
  }, [isOpen, isAdmin, activeTab, ticketId, showTicketArchive, openTickets]);

  const handleSelectArchivedTicket = (ticket: OpsTicket) => {
    setTicketId(ticket.id);
    setTicketPublicId(ticket.public_id ?? null);
    setShowTicketArchive(false);
  };

  // -------- Active ticket conversation --------
  const { data: ticketInfo } = useQuery({
    queryKey: ["supportTicketInfo", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_tickets" as any)
        .select("public_id, status")
        .eq("id", ticketId!)
        .single();
      if (error) {
        setTicketId(null);
        return null;
      }
      return data as any;
    },
    enabled: !!ticketId,
  });

  useEffect(() => {
    if (ticketInfo?.public_id) setTicketPublicId(ticketInfo.public_id);
  }, [ticketInfo]);

  const { data: messages = [] } = useQuery({
    queryKey: ["supportChatMessages", ticketId],
    queryFn: () => fetchUserTicketMessages(ticketId!),
    enabled: !!ticketId && isOpen,
    refetchInterval: 10000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (isAdmin) {
        return createTicketMessage(ticketId!, text, isInternal, "ADMIN");
      }
      return addUserTicketMessage(ticketId!, text);
    },
    onSuccess: () => {
      setMessageText("");
      setIsInternal(false);
      queryClient.invalidateQueries({
        queryKey: ["supportChatMessages", ticketId],
      });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["adminOpsInbox"] });
      }
    },
  });

  const ensureTicketAndSend = async (text: string) => {
    if (!user || !text.trim()) return;
    if (ticketId) {
      sendMutation.mutate(text);
      return;
    }
    // Admins never auto-create tickets — they only reply to existing ones.
    if (isAdmin) return;
    // No active ticket → create one with this first message
    setIsCreatingTicket(true);
    try {
      const title = text.length > 60 ? `${text.slice(0, 60)}…` : text;
      const ticket = await createUserTicket({
        title,
        description: text,
        category_group: "USER",
        category_type: "GENERAL_INQUIRY",
      });
      await addUserTicketMessage(ticket.id, text);
      setTicketId(ticket.id);
      setTicketPublicId(ticket.public_id);
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["userTickets"] });
      queryClient.invalidateQueries({
        queryKey: ["supportChatMessages", ticket.id],
      });
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error(
        t(
          "Eroare la crearea ticketului. Încearcă din nou.",
          "Failed to create ticket. Please try again.",
        ),
      );
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSendTicketMessage = () => {
    const text = messageText.trim();
    if (!text) return;
    ensureTicketAndSend(text);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("Poți trimite doar imagini.", "You can only send images."));
      return;
    }
    setIsUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadSupportImage(compressed, user.id);
      await ensureTicketAndSend(url);
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(t("Eroare la încărcarea imaginii.", "Failed to upload image."));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBackFromTicket = () => {
    setTicketId(null);
    setTicketPublicId(null);
    setMessageText("");
    // If user has other open tickets, show archive toggle path; otherwise welcome screen
    setShowTicketArchive(false);
  };

  // Hide on admin route only for non-admins (so plain users don't see widget there).
  if (isAdminRoute && !isAdmin) return null;

  const isClosed =
    ticketInfo?.status === "CLOSED" || ticketInfo?.status === "RESOLVED";

  // FAB & tab badges (role-aware)
  const fabBadgeCount = isAdmin
    ? totalUnread + adminInboxUnread + adminNewCount
    : totalUnread + openTicketsCount;
  const ticketsTabBadge = isAdmin
    ? adminInboxUnread + adminNewCount
    : openTicketsCount;
  const activeAdminTicket =
    isAdmin && ticketId ? adminInbox.find((t) => t.id === ticketId) : null;

  // Header content
  const showBack = !!activeConv || !!ticketId || showTicketArchive;
  const headerTitle = activeConv
    ? activeConv.other_user?.full_name || t("Conversație", "Conversation")
    : ticketId
    ? isAdmin
      ? ticketPublicId || t("Ticket", "Ticket")
      : t("Suport Rentli", "Rentli Support")
    : showTicketArchive
    ? t("Tickete anterioare", "Previous tickets")
    : isAdmin
    ? t("Inbox suport", "Support inbox")
    : t("Mesajele mele", "My messages");
  const headerSubtitle = activeConv
    ? activeConv.product?.title || ""
    : ticketId
    ? isAdmin
      ? activeAdminTicket?.requester_name || activeAdminTicket?.title || "Online"
      : ticketPublicId || "Online"
    : "Online";

  const handleBack = () => {
    if (activeConv) {
      setActiveConv(null);
      return;
    }
    if (ticketId) {
      handleBackFromTicket();
      return;
    }
    if (showTicketArchive) {
      setShowTicketArchive(false);
      return;
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-20 lg:bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all duration-200 items-center justify-center hover:scale-105 active:scale-95 ${pathname.startsWith("/mesaje") ? "hidden lg:flex" : "flex"}`}
          aria-label={t("Suport", "Support")}
        >
          <MessageCircle className="h-6 w-6" />
          {fabBadgeCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
              {fabBadgeCount > 99 ? "99+" : fabBadgeCount}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed z-[60] bg-background flex flex-col overflow-hidden inset-0 lg:inset-auto lg:bottom-6 lg:right-4 lg:w-[400px] lg:max-w-[calc(100vw-2rem)] lg:rounded-2xl lg:border lg:shadow-2xl"
          style={{ height: "100dvh" }}
          ref={(el) => {
            if (el && window.innerWidth >= 1024) {
              el.style.height = "min(600px, calc(100vh - 100px))";
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 lg:rounded-t-2xl bg-primary text-primary-foreground lg:bg-background lg:text-foreground">
            {showBack ? (
              <button
                onClick={handleBack}
                className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25 lg:bg-secondary lg:hover:bg-secondary/80 transition-colors"
                aria-label={t("Înapoi", "Back")}
                title={t("Înapoi", "Back")}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 lg:bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    R
                  </span>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
            )}
            {showBack && (activeConv || ticketId) && (
              <Avatar className="h-9 w-9 shrink-0">
                {activeConv ? (
                  <>
                    <AvatarImage src={activeConv.other_user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {activeConv.other_user?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    R
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{headerTitle}</p>
              <p className="text-xs opacity-70 lg:text-muted-foreground truncate">
                {headerSubtitle}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
              aria-label={t("Închide", "Close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!user ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Trebuie să fii autentificat pentru a folosi chat-ul.",
                      "You must be logged in to use the chat.",
                    )}
                  </p>
                  <Button variant="default" size="sm" className="mt-3" asChild>
                    <a href="/auth">{t("Autentificare", "Sign In")}</a>
                  </Button>
                </div>
              </div>
            ) : activeConv ? (
              /* ----- User↔User conversation inline ----- */
              <ChatPanel
                conversationId={activeConv.id}
                otherUserName={activeConv.other_user?.full_name || null}
                otherUserAvatar={activeConv.other_user?.avatar_url || null}
                productTitle={activeConv.product?.title || ""}
                ownerId={activeConv.owner_id}
                buyerId={activeConv.buyer_id}
                rentalsId={activeConv.rentals_id || null}
                hideHeader
              />
            ) : ticketId ? (
              /* ----- Active ticket conversation ----- */
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  {messages.length === 0 ? (
                    isAdmin ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {t(
                          "Niciun mesaj încă în acest ticket.",
                          "No messages in this ticket yet.",
                        )}
                      </p>
                    ) : (
                    <div className="flex items-start gap-2 mt-2">
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                          R
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-sm max-w-[80%]">
                        {t(
                          "Bună! Suntem aici să te ajutăm. Scrie-ne mesajul tău și un membru al echipei Rentli îți va răspunde cât mai curând.",
                          "Hi! We're here to help. Write us your message and a member of the Rentli team will reply as soon as possible.",
                        )}
                      </div>
                    </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = isAdmin
                          ? msg.author_type === "ADMIN"
                          : msg.author_type === "CUSTOMER";
                        const isInternalNote = (msg as any).is_internal === true;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isInternalNote
                                  ? "bg-yellow-100 border border-yellow-300 text-foreground"
                                  : isOwn
                                  ? "bg-amber-400 text-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              {isInternalNote && (
                                <p className="flex items-center gap-1 text-[10px] font-semibold text-yellow-800 mb-1">
                                  <Lock className="h-3 w-3" />
                                  {t("Notă internă", "Internal note")}
                                </p>
                              )}
                              {renderMessageContent(msg.message_text)}
                              <p
                                className={`text-[10px] mt-1 ${isOwn ? "text-foreground/60" : "text-muted-foreground"}`}
                              >
                                {format(new Date(msg.created_at), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {isClosed ? (
                  <div className="px-4 py-3 border-t text-center shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("Acest ticket a fost închis.", "This ticket has been closed.")}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleBackFromTicket}>
                      {t("Înapoi", "Back")}
                    </Button>
                  </div>
                ) : (
                  <div className="shrink-0 border-t pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-0">
                    {isAdmin && (
                      <div className="flex items-center justify-between px-3 pt-2 pb-1">
                        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                          <Switch
                            checked={isInternal}
                            onCheckedChange={setIsInternal}
                          />
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            {t("Notă internă", "Internal note")}
                          </span>
                        </label>
                        {isInternal && (
                          <span className="text-[10px] text-yellow-700 font-semibold">
                            {t(
                              "Nu va fi vizibil clientului",
                              "Hidden from customer",
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendMutation.isPending || isUploadingImage || isCreatingTicket}
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={t("Scrie mesajul tău...", "Write your message...")}
                        className="h-9 text-sm flex-1 rounded-full"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendTicketMessage();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full"
                        onClick={handleSendTicketMessage}
                        disabled={
                          !messageText.trim() ||
                          sendMutation.isPending ||
                          isCreatingTicket
                        }
                      >
                        {isCreatingTicket || sendMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="hidden lg:block text-[10px] text-muted-foreground text-center pb-2">
                      Chat Rentli
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Tabs */}
                <div className="shrink-0 flex items-center gap-2 px-3 pt-2 pb-2 border-b bg-background">
                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-full text-xs font-medium transition-colors relative",
                      activeTab === "chat"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/15",
                    )}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {t("Chat", "Chat")}
                    {totalUnread > 0 && (
                      <span
                        className={cn(
                          "ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                          activeTab === "chat"
                            ? "bg-primary-foreground text-primary"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {totalUnread}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tickets")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-full text-xs font-medium transition-colors relative",
                      activeTab === "tickets"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/15",
                    )}
                  >
                    <Ticket className="h-3.5 w-3.5" />
                    {t("Tickete", "Tickets")}
                    {ticketsTabBadge > 0 && (
                      <span
                        className={cn(
                          "ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                          activeTab === "tickets"
                            ? "bg-primary-foreground text-primary"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {ticketsTabBadge}
                      </span>
                    )}
                  </button>
                </div>

                {activeTab === "chat" ? (
                  /* ----- Conversations list ----- */
                  <>
                    <div className="shrink-0 flex items-center gap-2 px-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setChatSubTab("rezervari")}
                        className={cn(
                          "flex-1 h-7 rounded-full text-[11px] font-medium transition-colors",
                          chatSubTab === "rezervari"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/70",
                        )}
                      >
                        {t("Rezervări", "Bookings")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatSubTab("de-inchiriat")}
                        className={cn(
                          "flex-1 h-7 rounded-full text-[11px] font-medium transition-colors",
                          chatSubTab === "de-inchiriat"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/70",
                        )}
                      >
                        {t("De închiriat", "Renting out")}
                      </button>
                    </div>

                    <ScrollArea className="flex-1 px-2 py-2">
                      {isLoadingConvs ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : sortedConvs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <MessageCircle className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">
                            {t(
                              "Nu ai conversații încă",
                              "No conversations yet",
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {chatSubTab === "rezervari"
                              ? t(
                                  "Începe o rezervare pentru a discuta cu proprietarul.",
                                  "Start a booking to chat with the owner.",
                                )
                              : t(
                                  "Vei vedea aici mesajele de la chiriași.",
                                  "You'll see messages from renters here.",
                                )}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {sortedConvs.map((conv) => {
                            const isUnread = (conv.unread_count || 0) > 0;
                            const lastText = conv.last_message?.content || "";
                            return (
                              <button
                                key={conv.id}
                                type="button"
                                onClick={() => setActiveConv(conv)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors hover:bg-muted/60",
                                  isUnread && "bg-primary/5",
                                )}
                              >
                                <Avatar className="h-10 w-10 shrink-0">
                                  <AvatarImage
                                    src={
                                      conv.other_user?.avatar_url || undefined
                                    }
                                  />
                                  <AvatarFallback>
                                    {conv.other_user?.full_name?.charAt(0) ||
                                      "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p
                                      className={cn(
                                        "text-sm truncate",
                                        isUnread
                                          ? "font-semibold"
                                          : "font-medium",
                                      )}
                                    >
                                      {conv.other_user?.full_name ||
                                        t("Utilizator", "User")}
                                    </p>
                                    {conv.last_message?.created_at && (
                                      <span className="text-[10px] text-muted-foreground shrink-0">
                                        {formatConvTime(
                                          conv.last_message.created_at,
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground truncate">
                                      {conv.product?.title
                                        ? `${conv.product.title} · `
                                        : ""}
                                      {lastText ||
                                        t(
                                          "Fără mesaje",
                                          "No messages",
                                        )}
                                    </p>
                                    {isUnread && (
                                      <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                                        {conv.unread_count}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </>
                ) : showTicketArchive ? (
                  /* ----- Archive list ----- */
                  <ScrollArea className="flex-1 px-3 py-3">
                    {isLoadingTickets ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : userTickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                        <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t("Niciun ticket încă.", "No tickets yet.")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            onClick={() => handleSelectArchivedTicket(ticket)}
                            className="w-full text-left rounded-xl border bg-card p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              <span className="text-[11px] font-mono font-medium text-muted-foreground">
                                {ticket.public_id || `#${ticket.id.slice(0, 6)}`}
                              </span>
                              <StatusPill
                                status={ticket.status}
                                size="xs"
                                className="ml-auto"
                              />
                            </div>
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {ticket.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(
                                new Date(ticket.created_at),
                                "dd MMM yyyy, HH:mm",
                              )}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  /* ----- Tickete: welcome / direct chat with admin ----- */
                  <>
                    <ScrollArea className="flex-1 px-4 py-3">
                      <div className="flex items-start gap-2 mt-2">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                            R
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-sm max-w-[85%]">
                          <p className="font-semibold text-xs mb-0.5">
                            {t("Echipa Rentli", "Rentli Team")}
                          </p>
                          {t(
                            "Bună! Suntem aici să te ajutăm. Scrie-ne mesajul tău și un membru al echipei Rentli îți va răspunde cât mai curând.",
                            "Hi! We're here to help. Write us your message and a member of the Rentli team will reply as soon as possible.",
                          )}
                        </div>
                      </div>

                      {archivedTickets.length > 0 && (
                        <div className="mt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setShowTicketArchive(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                          >
                            <History className="h-3 w-3" />
                            {t(
                              `Vezi tickete anterioare (${archivedTickets.length})`,
                              `View previous tickets (${archivedTickets.length})`,
                            )}
                          </button>
                        </div>
                      )}
                    </ScrollArea>

                    <div className="shrink-0 border-t pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-0">
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage || isCreatingTicket}
                          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          {isUploadingImage ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={t(
                            "Scrie mesajul tău...",
                            "Write your message...",
                          )}
                          className="h-9 text-sm flex-1 rounded-full"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendTicketMessage();
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full"
                          onClick={handleSendTicketMessage}
                          disabled={!messageText.trim() || isCreatingTicket}
                        >
                          {isCreatingTicket ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="hidden lg:block text-[10px] text-muted-foreground text-center pb-2">
                        Chat Rentli
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
