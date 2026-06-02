import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Ban,
  Maximize2,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUserTicket,
  fetchUserTicketMessages,
  addUserTicketMessage,
  fetchUserTickets,
  closeUserTicket,
  type OpsTicket,
} from "@/features/tickets/userTicketsApi";
import {
  fetchOpsTickets,
  fetchTicketMessages,
  createTicketMessage,
  updateOpsTicketField,
  type OpsTicket as AdminOpsTicket,
} from "@/features/admin/opsTicketsApi";
import { MAX_MESSAGE_LENGTH, MAX_SPECIAL_CHARS, countSpecialChars, clampChatInput } from "@/features/messaging/messagingApi";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
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
  return <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</p>;
};

const SupportChatWidget = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const dateLocale = language === "ro" ? roLocale : enUS;
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const resetTextareaHeight = () => {
    if (messageTextareaRef.current) messageTextareaRef.current.style.height = "auto";
  };
  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };
  const lastSymbolToastRef = useRef(0);
  const notifySymbolBlocked = () => {
    const now = Date.now();
    if (now - lastSymbolToastRef.current < 1500) return;
    lastSymbolToastRef.current = now;
    toast.error(
      t(
        `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
        `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`,
      ),
    );
  };
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value, blockedSpecial } = clampChatInput(e.target.value);
    setMessageText(value);
    if (blockedSpecial) notifySymbolBlocked();
    autoGrow(e.target);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [userLeftTicket, setUserLeftTicket] = useState(false);
  const [ticketPublicId, setTicketPublicId] = useState<string | null>(null);
  const [showTicketArchive, setShowTicketArchive] = useState(false);
  // When true, user explicitly asked to open a brand new ticket — skip
  // auto-resume of the existing open ticket for this widget session.
  const [userRequestedNewTicket, setUserRequestedNewTicket] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  // Admin status-change confirmation
  type AdminAction = "RESOLVE" | "INVESTIGATE" | "CANCEL";
  const [pendingAdminAction, setPendingAdminAction] =
    useState<AdminAction | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  // Reset transient state on close
  useEffect(() => {
    if (!isOpen) {
      setTicketId(null);
      setTicketPublicId(null);
      setShowTicketArchive(false);
      setMessageText(""); resetTextareaHeight();
      setIsInternal(false);
      setUserLeftTicket(false);
      setUserRequestedNewTicket(false);
    }
  }, [isOpen]);

  // Allow other parts of the app (e.g. mobile Messages tab) to open the widget
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-support-chat", handler);
    return () => window.removeEventListener("open-support-chat", handler);
  }, []);

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

  // Auto-resume: dacă userul are un ticket deschis, îl reia automat la
  // deschiderea widget-ului (sau imediat ce lista se încarcă), astfel încât
  // back/close să nu îl arunce înapoi pe ecranul de welcome. Sare peste
  // auto-resume dacă userul a cerut explicit un ticket nou.
  useEffect(() => {
    if (!isOpen || !user || isAdmin) return;
    if (ticketId || showTicketArchive || userRequestedNewTicket) return;
    if (openTickets.length === 0) return;
    const mostRecent = [...openTickets].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0];
    setTicketId(mostRecent.id);
    setTicketPublicId(mostRecent.public_id ?? null);
  }, [
    isOpen,
    user,
    isAdmin,
    ticketId,
    showTicketArchive,
    userRequestedNewTicket,
    openTickets,
  ]);

  const handleSelectArchivedTicket = (ticket: OpsTicket) => {
    setTicketId(ticket.id);
    setTicketPublicId(ticket.public_id ?? null);
    setShowTicketArchive(false);
    setUserLeftTicket(false);
  };

  const handleStartNewTicket = () => {
    setTicketId(null);
    setTicketPublicId(null);
    setShowTicketArchive(false);
    setMessageText(""); resetTextareaHeight();
    setUserRequestedNewTicket(true);
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
      if (countSpecialChars(text) > MAX_SPECIAL_CHARS) {
        throw new Error("TOO_MANY_SPECIAL_CHARS");
      }
      if (isAdmin) {
        return createTicketMessage(ticketId!, text, isInternal, "ADMIN");
      }
      return addUserTicketMessage(ticketId!, text);
    },
    onSuccess: () => {
      setMessageText(""); resetTextareaHeight();
      setIsInternal(false);
      queryClient.invalidateQueries({
        queryKey: ["supportChatMessages", ticketId],
      });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["adminOpsInbox"] });
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "TOO_MANY_SPECIAL_CHARS") {
        toast.error(
          t(
            `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
            `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`,
          ),
        );
      } else {
        toast.error(t("Eroare la trimiterea mesajului.", "Failed to send message."));
      }
    },
  });

  const adminStatusMutation = useMutation({
    mutationFn: async (action: AdminAction) => {
      if (!ticketId) throw new Error("no ticket");
      const oldStatus = (ticketInfo?.status as string) ?? null;
      const map: Record<AdminAction, string> = {
        RESOLVE: "RESOLVED",
        INVESTIGATE: "WAITING_INTERNAL",
        CANCEL: "CLOSED",
      };
      const newStatus = map[action];
      await updateOpsTicketField(
        ticketId,
        "status",
        oldStatus,
        newStatus,
        "STATUS_CHANGED",
      );
      if (action === "CANCEL") {
        try {
          await createTicketMessage(
            ticketId,
            t("Ticket anulat de admin.", "Ticket cancelled by admin."),
            true,
            "ADMIN",
          );
        } catch (e) {
          console.error("[support] cancel note failed:", e);
        }
      }
    },
    onSuccess: (_d, action) => {
      queryClient.invalidateQueries({
        queryKey: ["supportTicketInfo", ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supportChatMessages", ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["adminOpsInbox"] });
      queryClient.invalidateQueries({ queryKey: ["opsTickets"] });
      const labels: Record<AdminAction, string> = {
        RESOLVE: t("Ticket marcat ca rezolvat.", "Ticket marked as resolved."),
        INVESTIGATE: t(
          "Ticket marcat: necesită investigații.",
          "Ticket marked: needs investigation.",
        ),
        CANCEL: t("Ticket anulat.", "Ticket cancelled."),
      };
      toast.success(labels[action]);
      setPendingAdminAction(null);
    },
    onError: () => {
      toast.error(
        t(
          "Eroare la actualizarea ticketului.",
          "Failed to update ticket.",
        ),
      );
      setPendingAdminAction(null);
    },
  });

  const ensureTicketAndSend = async (text: string) => {
    if (!user || !text.trim()) return;
    // Allow attachment URLs (image upload uses this path) — only validate plain text
    const looksLikeUrl = /^https?:\/\//i.test(text.trim());
    if (!looksLikeUrl && countSpecialChars(text) > MAX_SPECIAL_CHARS) {
      toast.error(
        t(
          `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
          `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`,
        ),
      );
      return;
    }
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
      setMessageText(""); resetTextareaHeight();
      setUserLeftTicket(false);
      setUserRequestedNewTicket(false);
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
    const text = messageText.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text) return;
    if (countSpecialChars(text) > MAX_SPECIAL_CHARS) {
      toast.error(
        t(
          `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
          `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`
        )
      );
      return;
    }
    ensureTicketAndSend(text);
  };

  const handleImageUpload = async (file: File | null | undefined) => {
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
    }
  };

  const openImagePicker = () => {
    if (typeof document === "undefined") return;
    if (sendMutation.isPending || isUploadingImage || isCreatingTicket) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.style.display = "none";

    const cleanup = () => {
      input.onchange = null;
      input.remove();
    };

    input.onchange = () => {
      void handleImageUpload(input.files?.[0]).finally(cleanup);
    };

    window.addEventListener(
      "focus",
      () => {
        window.setTimeout(() => {
          if (document.body.contains(input)) cleanup();
        }, 200);
      },
      { once: true },
    );

    document.body.appendChild(input);
    input.click();
  };

  const handleBackFromTicket = () => {
    setTicketId(null);
    setTicketPublicId(null);
    setMessageText(""); resetTextareaHeight();
    setUserLeftTicket(true);
    // Non-admin: Back întotdeauna → lista cu toate conversațiile userului.
    // Admin: Back → inbox-ul de admin (fără arhivă).
    setShowTicketArchive(!isAdmin);
  };

  // Hide on admin route only for non-admins (so plain users don't see widget there).
  if (isAdminRoute && !isAdmin) return null;

  const isClosed =
    ticketInfo?.status === "CLOSED" || ticketInfo?.status === "RESOLVED";

  // FAB & tab badges (role-aware)
  const fabBadgeCount = isAdmin
    ? adminInboxUnread + adminNewCount
    : openTicketsCount;
  const activeAdminTicket =
    isAdmin && ticketId ? adminInbox.find((t) => t.id === ticketId) : null;

  // Header content
  // Back is hidden for non-admin while viewing an ACTIVE ticket — userul
  // nu trebuie să iasă accidental din conversația de suport în curs.
  // Pentru tickete închise / arhivă / admin păstrăm back-ul.
  const showBack =
    showTicketArchive ||
    !!ticketId;
  const headerTitle = ticketId
    ? isAdmin
      ? ticketPublicId || t("Ticket", "Ticket")
      : t("Suport Rentli", "Rentli Support")
    : showTicketArchive
    ? t("Conversațiile mele", "My conversations")
    : isAdmin
    ? t("Inbox suport", "Support inbox")
    : t("Suport Rentli", "Rentli Support");
  const headerSubtitle = ticketId
    ? isAdmin
      ? activeAdminTicket?.requester_name || activeAdminTicket?.title || "Online"
      : ticketPublicId || "Online"
    : "Online";

  const handleBack = () => {
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
      {/* Live Help card — desktop only */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 hidden lg:flex items-center gap-3 rounded-2xl bg-background border border-border pl-2 pr-4 py-2 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] text-left"
          aria-label={t("Suport live", "Live support")}
        >
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
              <Headphones className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <span className="absolute -top-0.5 -left-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" aria-hidden />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              {t("Live Help", "Live Help")}
              <span className="text-xs font-semibold text-green-600">{t("Online", "Online")}</span>
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {t("Bună! Te putem ajuta?", "Hi! Can we help?")}
            </span>
          </div>
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
          className="fixed z-[60] bg-background flex flex-col overflow-hidden inset-0 lg:inset-auto lg:bottom-6 lg:right-4 lg:w-[460px] lg:max-w-[calc(100vw-2rem)] lg:rounded-2xl lg:border lg:shadow-2xl"
          style={{ height: "100dvh" }}
          ref={(el) => {
            if (el && window.innerWidth >= 1024) {
              el.style.height = "min(720px, calc(100vh - 80px))";
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
            {showBack && ticketId && (
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  R
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{headerTitle}</p>
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-xs opacity-70 lg:text-muted-foreground truncate">
                  {headerSubtitle}
                </p>
                {isAdmin && ticketId && ticketInfo?.status && (
                  <StatusPill
                    status={ticketInfo.status}
                    size="xs"
                    className="shrink-0"
                  />
                )}
              </div>
            </div>
            {ticketId && (
              <button
                onClick={() => {
                  const target = isAdmin
                    ? `/admin/tickets?id=${ticketId}`
                    : `/suport?open=${ticketId}`;
                  setIsOpen(false);
                  navigate(target);
                }}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
                aria-label={t("Deschide în pagina de suport", "Open in support page")}
                title={t("Deschide în pagina de suport", "Open in support page")}
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            )}
            {isAdmin && ticketId && !isClosed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
                    aria-label={t("Acțiuni ticket", "Ticket actions")}
                    title={t("Acțiuni ticket", "Ticket actions")}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[80]">
                  <DropdownMenuLabel>
                    {t("Status ticket", "Ticket status")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setPendingAdminAction("RESOLVE")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    {t("Marchează rezolvat", "Mark resolved")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPendingAdminAction("INVESTIGATE")}
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                    {t("Necesită investigații", "Needs investigation")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setPendingAdminAction("CANCEL")}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {t("Anulează ticket", "Cancel ticket")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isAdmin && ticketId && !isClosed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
                    aria-label={t("Închide ticketul", "Close ticket")}
                    title={t("Închide ticketul", "Close ticket")}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="z-[90]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("Închizi acest ticket?", "Close this ticket?")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        "Confirmă doar dacă problema este rezolvată sau ticketul a fost deschis din greșeală. Poți oricând deschide unul nou.",
                        "Confirm only if the issue is resolved or the ticket was opened by mistake. You can always open a new one.",
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await closeUserTicket(ticketId);
                          toast.success(t("Ticket închis", "Ticket closed"));
                          queryClient.invalidateQueries({ queryKey: ["userTickets"] });
                          queryClient.invalidateQueries({ queryKey: ["ticketInfo", ticketId] });
                          queryClient.invalidateQueries({ queryKey: ["ticketMessages", ticketId] });
                          queryClient.invalidateQueries({ queryKey: ["userTicketMessages", ticketId] });
                        } catch (e: any) {
                          toast.error(
                            t("Nu am putut închide ticketul", "Could not close the ticket"),
                            { description: e?.message },
                          );
                        }
                      }}
                    >
                      {t("Închide ticketul", "Close ticket")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                              className={`min-w-0 max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
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
                    <div className="flex items-end gap-2 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={openImagePicker}
                        disabled={sendMutation.isPending || isUploadingImage || isCreatingTicket}
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <Textarea
                        ref={messageTextareaRef}
                        value={messageText}
                        onChange={handleMessageChange}
                        maxLength={MAX_MESSAGE_LENGTH}
                        rows={1}
                        placeholder={t("Scrie mesajul tău...", "Write your message...")}
                        className="text-sm flex-1 rounded-2xl resize-none overflow-y-auto min-h-9 max-h-40 py-2"
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
                    {(messageText.length >= MAX_MESSAGE_LENGTH * 0.8 || countSpecialChars(messageText) > 0) && (
                      <div className="flex justify-between px-3 pb-1 text-[10px] tabular-nums">
                        <span className={countSpecialChars(messageText) >= MAX_SPECIAL_CHARS ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {countSpecialChars(messageText) > 0 ? `${t("simboluri", "symbols")}: ${countSpecialChars(messageText)}/${MAX_SPECIAL_CHARS}` : ""}
                        </span>
                        <span className={messageText.length >= MAX_MESSAGE_LENGTH ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {messageText.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                      </div>
                    )}
                    <p className="hidden lg:block text-[10px] text-muted-foreground text-center pb-2">
                      Chat Rentli
                    </p>
                  </div>
                )}
              </>
            ) : (
              isAdmin ? (
                  /* ----- Admin inbox list ----- */
                  <div className="flex-1 overflow-y-auto px-3 py-3 min-w-0">
                    {isLoadingAdminInbox ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : adminInbox.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Inbox className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium">
                          {t("Niciun ticket activ", "No active tickets")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(
                            "Ticketele noi de la clienți vor apărea aici.",
                            "New customer tickets will show up here.",
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {adminInbox.map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            onClick={() => {
                              setTicketId(ticket.id);
                              setTicketPublicId(ticket.public_id ?? null);
                            }}
                            className={cn(
                              "w-full min-w-0 overflow-hidden text-left rounded-xl border bg-card p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors",
                              ticket.unread_count > 0 && "border-primary/40 bg-primary/5",
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1 min-w-0">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  ticket.status === "NEW"
                                    ? "bg-blue-500"
                                    : "bg-primary",
                                )}
                              />
                              <span className="text-[11px] font-mono font-medium text-muted-foreground truncate">
                                {ticket.public_id || `#${ticket.id.slice(0, 6)}`}
                              </span>
                              <StatusPill
                                status={ticket.status}
                                size="xs"
                                className="ml-auto shrink-0"
                              />
                              {ticket.unread_count > 0 && (
                                <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                                  {ticket.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium line-clamp-1 break-all mb-0.5">
                              {ticket.title}
                            </p>
                            {ticket.requester_name && (
                              <p className="text-[11px] text-muted-foreground truncate break-all">
                                {ticket.requester_name}
                              </p>
                            )}
                            {ticket.last_message && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 break-all mt-0.5">
                                {ticket.last_message}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {format(
                                new Date(ticket.last_message_at || ticket.updated_at || ticket.created_at),
                                "d MMM yyyy, HH:mm",
                                { locale: language === "ro" ? roLocale : enUS },
                              )}
                              {" · "}
                              {formatDistanceToNow(
                                new Date(ticket.last_message_at || ticket.updated_at || ticket.created_at),
                                { locale: language === "ro" ? roLocale : enUS, addSuffix: true },
                              )}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : showTicketArchive ? (
                  /* ----- Archive list ----- */
                  <div className="flex-1 overflow-y-auto px-3 py-3 min-w-0">
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
                        <button
                          type="button"
                          onClick={handleStartNewTicket}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                        >
                          + {t("Deschide ticket nou", "Open new ticket")}
                        </button>
                        {userTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            onClick={() => handleSelectArchivedTicket(ticket)}
                            className="w-full min-w-0 overflow-hidden text-left rounded-xl border bg-card p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1 min-w-0">
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              <span className="text-[11px] font-mono font-medium text-muted-foreground truncate">
                                {ticket.public_id || `#${ticket.id.slice(0, 6)}`}
                              </span>
                              <StatusPill
                                status={ticket.status}
                                size="xs"
                                className="ml-auto shrink-0"
                              />
                            </div>
                            <p className="text-sm font-medium line-clamp-2 break-all mb-1">
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
                  </div>
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

                      {userTickets.length > 0 && (
                        <div className="mt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setShowTicketArchive(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                          >
                            <History className="h-3 w-3" />
                            {t(
                              `Vezi conversațiile mele (${userTickets.length})`,
                              `View my conversations (${userTickets.length})`,
                            )}
                          </button>
                        </div>
                      )}
                    </ScrollArea>

                    <div className="shrink-0 border-t pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-0">
                      <div className="flex items-end gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={openImagePicker}
                          disabled={isUploadingImage || isCreatingTicket}
                          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          {isUploadingImage ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <Textarea
                          ref={messageTextareaRef}
                          value={messageText}
                          onChange={handleMessageChange}
                          maxLength={MAX_MESSAGE_LENGTH}
                          rows={1}
                          placeholder={t(
                            "Scrie mesajul tău...",
                            "Write your message...",
                          )}
                          className="text-sm flex-1 rounded-2xl resize-none overflow-y-auto min-h-9 max-h-40 py-2"
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
                      {(messageText.length >= MAX_MESSAGE_LENGTH * 0.8 || countSpecialChars(messageText) > 0) && (
                        <div className="flex justify-between px-3 pb-1 text-[10px] tabular-nums">
                          <span className={countSpecialChars(messageText) >= MAX_SPECIAL_CHARS ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {countSpecialChars(messageText) > 0 ? `${t("simboluri", "symbols")}: ${countSpecialChars(messageText)}/${MAX_SPECIAL_CHARS}` : ""}
                          </span>
                          <span className={messageText.length >= MAX_MESSAGE_LENGTH ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {messageText.length}/{MAX_MESSAGE_LENGTH}
                          </span>
                        </div>
                      )}
                      <p className="hidden lg:block text-[10px] text-muted-foreground text-center pb-2">
                        Chat Rentli
                      </p>
                    </div>
                  </>
                )
              )
            }
          </div>
        </div>
      )}

      <AlertDialog
        open={!!pendingAdminAction}
        onOpenChange={(open) => {
          if (!open && !adminStatusMutation.isPending) setPendingAdminAction(null);
        }}
      >
        <AlertDialogContent className="z-[90]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAdminAction === "RESOLVE" &&
                t("Marchezi ticketul ca rezolvat?", "Mark ticket as resolved?")}
              {pendingAdminAction === "INVESTIGATE" &&
                t(
                  "Marchezi ticketul: necesită investigații?",
                  "Mark ticket: needs investigation?",
                )}
              {pendingAdminAction === "CANCEL" &&
                t("Anulezi acest ticket?", "Cancel this ticket?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAdminAction === "RESOLVE" &&
                t(
                  "Clientul va primi un email că ticketul a fost rezolvat. Va putea redeschide trimițând un nou mesaj.",
                  "The customer will be notified by email. They can reopen by sending a new message.",
                )}
              {pendingAdminAction === "INVESTIGATE" &&
                t(
                  "Ticketul rămâne deschis, dar marcat ca necesitând investigații suplimentare din partea echipei.",
                  "The ticket stays open but is flagged as needing further internal investigation.",
                )}
              {pendingAdminAction === "CANCEL" &&
                t(
                  "Ticketul va fi închis și marcat ca anulat. Acțiunea poate fi anulată din ERP-ul de admin.",
                  "The ticket will be closed and marked as cancelled. This can be reverted from the admin ERP.",
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={adminStatusMutation.isPending}>
              {t("Renunță", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingAdminAction)
                  adminStatusMutation.mutate(pendingAdminAction);
              }}
              disabled={adminStatusMutation.isPending}
              className={cn(
                pendingAdminAction === "CANCEL" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {adminStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Confirmă", "Confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SupportChatWidget;
