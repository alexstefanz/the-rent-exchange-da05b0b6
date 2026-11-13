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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS,
  CATEGORY_TYPES,
} from "@/features/tickets/userTicketsApi";
import { getSlaInfo, slaLabel } from "@/features/tickets/sla";

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
import { toast } from "@/components/ui/sonner";
import { StatusPill } from "@/components/support/center/StatusPill";
import { cn } from "@/lib/utils";
import {
  TICKET_DESCRIPTION_MAX,
  TICKET_DESCRIPTION_MIN,
  TICKET_REPLY_MIN,
  TICKET_TITLE_MAX,
  TICKET_TITLE_MIN,
  ticketValidationMessage,
  validateTicketContent,
  validateTicketReply,
} from "@/features/tickets/ticketValidation";

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

  // New ticket form (async support — no live chat)
  const [newTitle, setNewTitle] = useState("");
  const [newCategoryGroup, setNewCategoryGroup] = useState<string>("USER");
  const [newDescription, setNewDescription] = useState("");

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

  // -------- Admin inbox (Tichete tab for admins) --------
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

  // -------- Tickets (Tichete tab) --------
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

  // Async support: la deschidere nu se reia automat o "conversație".
  // Dacă userul are deja tichete, îi arătăm lista lor; altfel formularul de
  // tichet nou. Sare peste dacă a cerut explicit un tichet nou.
  useEffect(() => {
    if (!isOpen || !user || isAdmin) return;
    if (ticketId || showTicketArchive || userRequestedNewTicket) return;
    if (userTickets.length === 0) return;
    setShowTicketArchive(true);
  }, [
    isOpen,
    user,
    isAdmin,
    ticketId,
    showTicketArchive,
    userRequestedNewTicket,
    userTickets,
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
        .select("public_id, status, title, description, created_at, sla_due_at, first_response_at")
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
        toast.error(msg || t("Eroare la trimiterea răspunsului.", "Failed to send reply."));
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
          "Eroare la actualizarea tichetului.",
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
    if (!ticketId) return;
    sendMutation.mutate(text);
  };

  /** Create a ticket from the structured form (async support flow). */
  const handleCreateTicketFromForm = async () => {
    if (!user) return;
    const title = newTitle.trim().slice(0, 120);
    const description = newDescription.trim().slice(0, TICKET_DESCRIPTION_MAX);
    const validationError = validateTicketContent(title, description);
    if (validationError) {
      toast.error(ticketValidationMessage(validationError, language === "ro" ? "ro" : "en"));
      return;
    }
    if (countSpecialChars(description) > MAX_SPECIAL_CHARS) {
      toast.error(
        t(
          `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
          `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`,
        ),
      );
      return;
    }
    setIsCreatingTicket(true);
    try {
      const categoryType =
        CATEGORY_TYPES[newCategoryGroup]?.[0]?.value || "GENERAL_INQUIRY";
      const ticket = await createUserTicket({
        title,
        description,
        category_group: newCategoryGroup,
        category_type: categoryType,
      });
      setNewTitle("");
      setNewDescription("");
      setTicketId(ticket.id);
      setTicketPublicId(ticket.public_id);
      setUserLeftTicket(false);
      setUserRequestedNewTicket(false);
      queryClient.invalidateQueries({ queryKey: ["userTickets"] });
      toast.success(
        t(
          `Tichet creat: ${ticket.public_id}`,
          `Ticket created: ${ticket.public_id}`,
        ),
        {
          description: t(
            "Răspundem în maximum 48 de ore.",
            "We reply within 48 hours.",
          ),
        },
      );
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : t("Eroare la crearea tichetului.", "Failed to create the ticket."),
      );
    } finally {
      setIsCreatingTicket(false);
    }
  };


  const handleSendTicketMessage = () => {
    const text = messageText.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text) return;
    if (!isAdmin) {
      const validationError = validateTicketReply(text);
      if (validationError) {
        toast.error(ticketValidationMessage(validationError, language === "ro" ? "ro" : "en"));
        return;
      }
    }
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

  const activeSla = ticketInfo ? getSlaInfo(ticketInfo) : null;


  // FAB & tab badges (role-aware)
  const fabBadgeCount = isAdmin
    ? adminInboxUnread + adminNewCount
    : openTicketsCount;
  const activeAdminTicket =
    isAdmin && ticketId ? adminInbox.find((t) => t.id === ticketId) : null;

  // Header content
  // Back is hidden for non-admin while viewing an ACTIVE ticket — userul
  // nu trebuie să iasă accidental din conversația de suport în curs.
  // Pentru tichete închise / arhivă / admin păstrăm back-ul.
  const showBack =
    showTicketArchive ||
    !!ticketId;
  const headerTitle = ticketId
    ? ticketPublicId || t("Tichet", "Ticket")
    : showTicketArchive
    ? t("Tichetele mele", "My tickets")
    : isAdmin
    ? t("Inbox suport", "Support inbox")
    : t("Tichet nou", "New ticket");
  const slaHint = t("Răspuns în maximum 48h", "Reply within 48h");
  const headerSubtitle = ticketId
    ? isAdmin
      ? activeAdminTicket?.requester_name || activeAdminTicket?.title || slaHint
      : slaHint
    : isAdmin
    ? t("Tichete active", "Active tickets")
    : slaHint;


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
      {/* Support ticket card — desktop only */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 hidden lg:flex items-center gap-3 rounded-2xl bg-background border border-border pl-2 pr-4 py-2 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] text-left"
          aria-label={t("Suport Rentli", "Rentli Support")}
        >
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
              <Headphones className="h-5 w-5 text-primary" aria-hidden />
            </div>
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              {t("Suport Rentli", "Rentli Support")}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {t("Deschide un tichet · răspuns în 48h", "Open a ticket · reply within 48h")}
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
                    aria-label={t("Închide tichetul", "Close ticket")}
                    title={t("Închide tichetul", "Close ticket")}
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
                        "Confirmă doar dacă problema este rezolvată sau tichetul a fost deschis din greșeală. Poți oricând deschide unul nou.",
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
                            t("Nu am putut închide tichetul", "Could not close the ticket"),
                            { description: e?.message },
                          );
                        }
                      }}
                    >
                      {t("Închide tichetul", "Close ticket")}
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
                      "Trebuie să fii autentificat pentru a deschide un tichet.",
                      "You must be signed in to open a ticket.",
                    )}
                  </p>
                  <Button variant="default" size="sm" className="mt-3" asChild>
                    <a href="/auth">{t("Autentificare", "Sign In")}</a>
                  </Button>
                </div>
              </div>
            ) : ticketId ? (
              /* ----- Ticket thread (asynchronous, email-style) ----- */
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  {activeSla && (
                    <div
                      className={cn(
                        "rounded-xl border px-3 py-2 mb-3 text-[11px] font-medium",
                        activeSla.state === "breached"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : activeSla.state === "answered"
                          ? "border-border bg-muted text-muted-foreground"
                          : "border-primary/30 bg-primary/5 text-foreground",
                      )}
                    >
                      {slaLabel(activeSla, language)}
                    </div>
                  )}
                  {ticketInfo?.description && (
                    <div className="rounded-lg border bg-card p-3 mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                        {t("Descrierea inițială", "Original description")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {ticketInfo.description}
                      </p>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {t(
                        "Niciun mesaj încă în acest tichet.",
                        "No messages in this ticket yet.",
                      )}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = isAdmin
                          ? msg.author_type === "ADMIN"
                          : msg.author_type === "CUSTOMER";
                        const isInternalNote = (msg as any).is_internal === true;
                        const authorLabel = isInternalNote
                          ? t("Notă internă", "Internal note")
                          : msg.author_type === "CUSTOMER"
                          ? (msg as any).author_name || t("Tu", "You")
                          : msg.author_type === "SYSTEM"
                          ? t("Sistem", "System")
                          : (msg as any).author_name || t("Echipa Rentli", "Rentli team");
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "min-w-0 rounded-xl border p-3 text-sm",
                              isInternalNote
                                ? "border-yellow-300 bg-yellow-50"
                                : isOwn
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-card",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-foreground truncate inline-flex items-center gap-1">
                                {isInternalNote && <Lock className="h-3 w-3" />}
                                {authorLabel}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {format(new Date(msg.created_at), "d MMM yyyy, HH:mm", {
                                  locale: dateLocale,
                                })}
                              </span>
                            </div>
                            {renderMessageContent(msg.message_text)}
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
                      {t("Acest tichet a fost închis.", "This ticket has been closed.")}
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
                    <div className="px-3 py-2.5 space-y-2">
                      {!isAdmin && (
                        <p className="text-[11px] text-muted-foreground">
                          {t(
                            "Adaugă informații noi într-un răspuns complet. Echipa revine în maximum 48 de ore.",
                            "Add new information in a complete reply. The team responds within 48 hours.",
                          )}
                        </p>
                      )}
                      <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={openImagePicker}
                        disabled={sendMutation.isPending || isUploadingImage || isCreatingTicket}
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                        aria-label={t("Atașează imagine", "Attach image")}
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
                        rows={3}
                        placeholder={t(
                          "Adaugă un răspuns la tichet...",
                          "Add a reply to this ticket...",
                        )}
                        className="text-sm flex-1 rounded-lg resize-none overflow-y-auto min-h-20 max-h-40 py-2"
                      />

                      <Button
                        size="sm"
                        className="h-9 shrink-0"
                        onClick={handleSendTicketMessage}
                        disabled={
                          (!isAdmin && messageText.trim().length < TICKET_REPLY_MIN) ||
                          !messageText.trim() ||
                          sendMutation.isPending ||
                          isCreatingTicket
                        }
                      >
                        {isCreatingTicket || sendMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Send className="h-4 w-4 mr-1.5" />{t("Trimite răspunsul", "Send reply")}</>
                        )}
                      </Button>
                      </div>
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
                      {t(
                        "Suport pe bază de tichete · răspuns în maximum 48 de ore",
                        "Ticket-based support · reply within 48 hours",
                      )}
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
                          {t("Niciun tichet activ", "No active tickets")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(
                            "Tichetele noi de la clienți vor apărea aici.",
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
                          {t("Niciun tichet încă.", "No tickets yet.")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleStartNewTicket}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                        >
                          + {t("Deschide tichet nou", "Open new ticket")}
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
                            {(() => {
                              const info = getSlaInfo(ticket);
                              return (
                                <p
                                  className={cn(
                                    "text-[11px] mt-0.5 font-medium",
                                    info.state === "breached"
                                      ? "text-destructive"
                                      : info.state === "answered"
                                      ? "text-muted-foreground"
                                      : "text-primary",
                                  )}
                                >
                                  {slaLabel(info, language)}
                                </p>
                              );
                            })()}

                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ----- New ticket form (async support, 48h SLA) ----- */
                  <div className="flex-1 overflow-y-auto px-4 py-4 min-w-0">
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Ticket className="h-4 w-4 text-primary" />
                        {t("Deschide un tichet", "Open a ticket")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(
                          "Suportul Rentli funcționează pe bază de tichete. Răspundem la fiecare tichet în maximum 48 de ore, prin email și în contul tău.",
                          "Rentli support works with tickets. We reply to every ticket within 48 hours, by email and in your account.",
                        )}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">
                          {t("Subiect", "Subject")}
                        </label>
                        <Input
                          value={newTitle}
                          minLength={TICKET_TITLE_MIN}
                          maxLength={TICKET_TITLE_MAX}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder={t("Ex: Problemă la plata unei rezervări", "E.g. Issue with a booking payment")}
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">
                          {t("Categorie", "Category")}
                        </label>
                        <Select value={newCategoryGroup} onValueChange={setNewCategoryGroup}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[80]">
                            {CATEGORY_GROUPS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {CATEGORY_GROUP_LABELS[g] || g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">
                          {t("Detalii", "Details")}
                        </label>
                        <Textarea
                          value={newDescription}
                          minLength={TICKET_DESCRIPTION_MIN}
                          maxLength={TICKET_DESCRIPTION_MAX}
                          rows={8}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder={t(
                            "Descrie pe scurt problema. Include codul rezervării dacă e cazul.",
                            "Briefly describe the issue. Include the booking code if relevant.",
                          )}
                          className="text-sm resize-y min-h-40"
                        />
                        <div className="flex justify-end pt-1 text-[10px] tabular-nums text-muted-foreground">
                          {newDescription.length}/{TICKET_DESCRIPTION_MAX}
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleCreateTicketFromForm}
                        disabled={
                          newTitle.trim().length < TICKET_TITLE_MIN ||
                          newDescription.trim().length < TICKET_DESCRIPTION_MIN ||
                          isCreatingTicket
                        }
                      >
                        {isCreatingTicket ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("Trimite tichetul", "Submit ticket")
                        )}
                      </Button>

                      <p className="text-[11px] text-muted-foreground text-center">
                        {t(
                          "Vei primi un număr de tichet și notificare când echipa răspunde.",
                          "You'll get a ticket number and a notification when the team replies.",
                        )}
                      </p>

                      {userTickets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowTicketArchive(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-primary hover:underline pt-1"
                        >
                          <History className="h-3 w-3" />
                          {t(
                            `Vezi tichetele mele (${userTickets.length})`,
                            `View my tickets (${userTickets.length})`,
                          )}
                        </button>
                      )}
                    </div>
                  </div>
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
                t("Marchezi tichetul ca rezolvat?", "Mark ticket as resolved?")}
              {pendingAdminAction === "INVESTIGATE" &&
                t(
                  "Marchezi tichetul: necesită investigații?",
                  "Mark ticket: needs investigation?",
                )}
              {pendingAdminAction === "CANCEL" &&
                t("Anulezi acest ticket?", "Cancel this ticket?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAdminAction === "RESOLVE" &&
                t(
                  "Clientul va primi un email că tichetul a fost rezolvat. Va putea redeschide trimițând un nou mesaj.",
                  "The customer will be notified by email. They can reopen by sending a new message.",
                )}
              {pendingAdminAction === "INVESTIGATE" &&
                t(
                  "Tichetul rămâne deschis, dar marcat ca necesitând investigații suplimentare din partea echipei.",
                  "The ticket stays open but is flagged as needing further internal investigation.",
                )}
              {pendingAdminAction === "CANCEL" &&
                t(
                  "Tichetul va fi închis și marcat ca anulat. Acțiunea poate fi anulată din ERP-ul de admin.",
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
