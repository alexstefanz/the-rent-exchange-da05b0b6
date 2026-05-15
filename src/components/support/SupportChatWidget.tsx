import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Send,
  X,
  Plus,
  Loader2,
  ImagePlus,
  Inbox,
  Ticket,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getConversations,
  type Conversation,
} from "@/features/messaging/messagingApi";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { ro as roLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { StatusPill } from "@/components/support/center/StatusPill";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "support_chat_ticket_id";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const dateLocale = language === "ro" ? roLocale : enUS;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tickets">("chat");
  const [chatSubTab, setChatSubTab] = useState<"rezervari" | "de-inchiriat">(
    "rezervari",
  );
  const [ticketId, setTicketId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [ticketPublicId, setTicketPublicId] = useState<string | null>(null);

  // New-ticket composer state (when user clicks "+" on Tickete tab)
  const [isComposingTicket, setIsComposingTicket] = useState(false);
  const [newTicketText, setNewTicketText] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  // Reset transient widget state when closed
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("chat");
      setIsComposingTicket(false);
      setNewTicketText("");
    }
  }, [isOpen]);

  // -------- Conversations (Chat tab) --------
  const { data: conversations = [], isLoading: isLoadingConvs } = useQuery<
    Conversation[]
  >({
    queryKey: ["conversations", user?.id],
    queryFn: getConversations,
    enabled: isOpen && !!user && activeTab === "chat" && !ticketId,
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

  const handleOpenConversation = (conv: Conversation) => {
    setIsOpen(false);
    navigate(`/mesaje?conv=${conv.id}`);
  };

  // -------- Tickets (Tickete tab) --------
  const { data: userTickets = [], isLoading: isLoadingTickets } = useQuery<
    OpsTicket[]
  >({
    queryKey: ["userTickets"],
    queryFn: fetchUserTickets,
    enabled: isOpen && !!user && activeTab === "tickets" && !ticketId,
    refetchInterval: 15000,
  });

  const { data: openTicketsCount = 0 } = useQuery<number>({
    queryKey: ["userTicketsOpenCount"],
    queryFn: async () => {
      const list = await fetchUserTickets();
      return list.filter(
        (x) => x.status !== "CLOSED" && x.status !== "RESOLVED",
      ).length;
    },
    enabled: isOpen && !!user,
    refetchInterval: 30000,
  });

  const handleSelectTicket = (ticket: OpsTicket) => {
    setTicketId(ticket.id);
    setTicketPublicId(ticket.public_id ?? null);
    localStorage.setItem(STORAGE_KEY, ticket.id);
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
        localStorage.removeItem(STORAGE_KEY);
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
    mutationFn: (text: string) => addUserTicketMessage(ticketId!, text),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: ["supportChatMessages", ticketId],
      });
    },
  });

  const handleSendMessage = () => {
    const text = messageText.trim();
    if (!text || !ticketId) return;
    sendMutation.mutate(text);
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
      if (ticketId) {
        sendMutation.mutate(url);
      } else if (isComposingTicket) {
        setNewTicketText((prev) => (prev ? `${prev}\n${url}` : url));
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(t("Eroare la încărcarea imaginii.", "Failed to upload image."));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBackToList = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTicketId(null);
    setTicketPublicId(null);
    setMessageText("");
    setActiveTab("tickets");
  };

  const handleStartNewTicket = () => {
    setActiveTab("tickets");
    setIsComposingTicket(true);
    setNewTicketText("");
  };

  const handleCreateTicket = async () => {
    const text = newTicketText.trim();
    if (!text || !user) return;
    setIsCreatingTicket(true);
    try {
      const title = text.length > 60 ? `${text.slice(0, 60)}…` : text;
      const ticket = await createUserTicket({
        title,
        description: text,
        category_group: "OTHER",
        category_type: "GENERAL",
      });
      await addUserTicketMessage(ticket.id, text);
      setTicketId(ticket.id);
      setTicketPublicId(ticket.public_id);
      localStorage.setItem(STORAGE_KEY, ticket.id);
      setIsComposingTicket(false);
      setNewTicketText("");
      queryClient.invalidateQueries({ queryKey: ["userTickets"] });
      queryClient.invalidateQueries({ queryKey: ["userTicketsOpenCount"] });
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

  if (isAdminRoute) return null;

  const isClosed =
    ticketInfo?.status === "CLOSED" || ticketInfo?.status === "RESOLVED";

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
          {totalUnread + openTicketsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
              {totalUnread + openTicketsCount > 99
                ? "99+"
                : totalUnread + openTicketsCount}
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
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 lg:bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  R
                </span>
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {ticketId
                  ? t("Suport Rentli", "Rentli Support")
                  : t("Mesajele mele", "My messages")}
              </p>
              <p className="text-xs opacity-70 lg:text-muted-foreground">
                {ticketId ? ticketPublicId || "Online" : "Online"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {ticketId && (
                <button
                  onClick={handleBackToList}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors text-xs px-2"
                  title={t("Înapoi la tickete", "Back to tickets")}
                >
                  ←
                </button>
              )}
              {!ticketId && activeTab === "tickets" && !isComposingTicket && (
                <button
                  onClick={handleStartNewTicket}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
                  title={t("Ticket nou", "New ticket")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
            ) : ticketId ? (
              /* ----- Active ticket conversation ----- */
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  {messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {t(
                        "Ticketul tău a fost creat. Un administrator va răspunde în curând.",
                        "Your ticket has been created. An admin will respond soon.",
                      )}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isCustomer = msg.author_type === "CUSTOMER";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isCustomer
                                  ? "bg-amber-400 text-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              {renderMessageContent(msg.message_text)}
                              <p
                                className={`text-[10px] mt-1 ${isCustomer ? "text-foreground/60" : "text-muted-foreground"}`}
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
                    <Button variant="outline" size="sm" onClick={handleBackToList}>
                      {t("Înapoi la tickete", "Back to tickets")}
                    </Button>
                  </div>
                ) : (
                  <div className="shrink-0 border-t pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-0">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendMutation.isPending || isUploadingImage}
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
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
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
                    {openTicketsCount > 0 && (
                      <span
                        className={cn(
                          "ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                          activeTab === "tickets"
                            ? "bg-primary-foreground text-primary"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {openTicketsCount}
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
                                onClick={() => handleOpenConversation(conv)}
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
                ) : isComposingTicket ? (
                  /* ----- New ticket composer ----- */
                  <>
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-sm">
                          {t(
                            "Descrie pe scurt problema. Echipa Rentli îți va răspunde în cel mai scurt timp.",
                            "Briefly describe your issue. The Rentli team will reply as soon as possible.",
                          )}
                        </div>
                      </div>
                      <textarea
                        value={newTicketText}
                        onChange={(e) => setNewTicketText(e.target.value)}
                        placeholder={t(
                          "Scrie mesajul tău...",
                          "Write your message...",
                        )}
                        rows={6}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full"
                          onClick={() => {
                            setIsComposingTicket(false);
                            setNewTicketText("");
                          }}
                          disabled={isCreatingTicket}
                        >
                          {t("Anulează", "Cancel")}
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 flex-1 rounded-full gap-1.5"
                          onClick={handleCreateTicket}
                          disabled={!newTicketText.trim() || isCreatingTicket}
                        >
                          {isCreatingTicket ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {t("Trimite", "Send")}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ----- Tickets list ----- */
                  <ScrollArea className="flex-1 px-3 py-3">
                    {isLoadingTickets ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : userTickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Inbox className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium">
                          {t("Nu ai tickete deschise", "No open tickets")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(
                            "Apasă + pentru a deschide un ticket nou.",
                            "Tap + to open a new ticket.",
                          )}
                        </p>
                        <Button
                          size="sm"
                          className="mt-4 gap-1.5"
                          onClick={handleStartNewTicket}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t("Ticket nou", "New ticket")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            onClick={() => handleSelectTicket(ticket)}
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
