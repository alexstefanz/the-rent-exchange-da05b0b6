import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { format, isToday, isYesterday, type Locale } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_MESSAGE_LENGTH, MAX_SPECIAL_CHARS, countSpecialChars, clampChatInput } from "@/features/messaging/messagingApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketRealtime } from "@/hooks/useTicketRealtime";
import {
  fetchUserTicketMessages,
  addUserTicketMessage,
  addUserTicketAttachment,
  markUserTicketRead,
  isTicketAttachmentRef,
  type OpsTicketMessage,
} from "@/features/tickets/userTicketsApi";
import { AttachmentBubble } from "./AttachmentBubble";
import { cn } from "@/lib/utils";
import {
  TICKET_REPLY_MIN,
  ticketValidationMessage,
  validateTicketReply,
} from "@/features/tickets/ticketValidation";

const MAX_DIM = 1920;
const Q = 0.8;
const COMPRESS_THRESHOLD = 1024 * 1024;

async function compress(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", Q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function dayLabel(d: Date, t: (ro: string, en: string) => string, locale: Locale) {
  if (isToday(d)) return t("Astăzi", "Today");
  if (isYesterday(d)) return t("Ieri", "Yesterday");
  return format(d, "d MMM yyyy", { locale });
}

interface Props {
  ticketId: string;
  isClosed: boolean;
}

export function TicketChat({ ticketId, isClosed }: Props) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const locale = language === "ro" ? ro : enUS;
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  useTicketRealtime(ticketId);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["userTicketMessages", ticketId],
    queryFn: () => fetchUserTicketMessages(ticketId),
  });

  // Mark as read when chat opens / new messages arrive
  useEffect(() => {
    if (!ticketId) return;
    markUserTicketRead(ticketId);
  }, [ticketId, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (txt: string) => addUserTicketMessage(ticketId, txt),
    onSuccess: () => {
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      qc.invalidateQueries({ queryKey: ["userTicketMessages", ticketId] });
    },
    onError: (error: Error) => toast.error(error.message || t("Nu s-a putut trimite răspunsul.", "Could not send reply.")),
  });

  const handleSend = () => {
    const txt = text.trim();
    if (!txt || sendMutation.isPending) return;
    const validationError = validateTicketReply(txt);
    if (validationError) {
      toast.error(ticketValidationMessage(validationError, language === "ro" ? "ro" : "en"));
      return;
    }
    if (txt.length > MAX_MESSAGE_LENGTH) {
      toast.error(t(`Maxim ${MAX_MESSAGE_LENGTH} caractere.`, `Maximum ${MAX_MESSAGE_LENGTH} characters.`));
      return;
    }
    if (countSpecialChars(txt) > MAX_SPECIAL_CHARS) {
      toast.error(
        t(
          `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
          `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`
        )
      );
      return;
    }
    sendMutation.mutate(txt);
  };

  const handleUpload = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("Doar imagini sunt acceptate.", "Only images are accepted."));
      return;
    }
    setUploading(true);
    try {
      const compressed = await compress(file);
      await addUserTicketAttachment(ticketId, compressed);
      qc.invalidateQueries({ queryKey: ["userTicketMessages", ticketId] });
    } catch (err) {
      console.error(err);
      toast.error(t("Eroare la încărcare.", "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const openImagePicker = () => {
    if (typeof document === "undefined") return;
    if (uploading) return;

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
      void handleUpload(input.files?.[0]).finally(cleanup);
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

  // Group messages by day
  let lastDay = "";
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-muted/10">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            {t("Nu există încă răspunsuri la acest tichet.", "There are no replies to this ticket yet.")}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const day = format(new Date(msg.created_at), "yyyy-MM-dd");
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <div key={msg.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-background border border-border/60 text-muted-foreground">
                        {dayLabel(new Date(msg.created_at), t, locale)}
                      </span>
                    </div>
                  )}
                  <ChatBubble msg={msg} userId={user?.id} />
                </div>
              );
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!isClosed ? (
        <div className="border-t border-border/60 p-3 bg-background">
          <p className="text-xs text-muted-foreground mb-2">
            {t("Adaugă informații noi într-un răspuns complet. Echipa revine în maximum 48 de ore.", "Add new information in a complete reply. The team responds within 48 hours.")}
          </p>
          <div className="flex items-start gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={openImagePicker}
              disabled={uploading}
              aria-label={t("Atașează imagine", "Attach image")}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={textareaRef}
              name="message"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
              enterKeyHint="enter"
              inputMode="text"
              value={text}
              onChange={(e) => {
                const { value, blockedSpecial } = clampChatInput(e.target.value);
                setText(value);
                if (blockedSpecial) notifySymbolBlocked();
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 160) + "px";
              }}
              placeholder={t("Scrie un răspuns detaliat…", "Write a detailed reply…")}
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
              className="min-h-20 max-h-40 resize-none overflow-y-auto"
            />
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0"
              onClick={handleSend}
              disabled={text.trim().length < TICKET_REPLY_MIN || sendMutation.isPending}
              aria-label={t("Trimite", "Send")}
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" />{t("Trimite răspunsul", "Send reply")}</>}
            </Button>
          </div>
          {(text.length >= MAX_MESSAGE_LENGTH * 0.8 || countSpecialChars(text) > 0) && (
            <div className="flex justify-between mt-1 px-1 text-[10px] tabular-nums">
              <span
                className={
                  countSpecialChars(text) >= MAX_SPECIAL_CHARS
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                }
              >
                {countSpecialChars(text) > 0
                  ? `${t("simboluri", "symbols")}: ${countSpecialChars(text)}/${MAX_SPECIAL_CHARS}`
                  : ""}
              </span>
              <span
                className={
                  text.length >= MAX_MESSAGE_LENGTH
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                }
              >
                {text.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-border/60 p-3 bg-muted/30 text-center text-xs text-muted-foreground">
          {t("Acest ticket este închis. Deschide unul nou pentru asistență.", "This ticket is closed. Open a new one for support.")}
        </div>
      )}
    </div>
  );
}

function ChatBubble({ msg, userId }: { msg: OpsTicketMessage; userId?: string }) {
  const { t, language } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const isOwn = msg.author_type === "CUSTOMER" || msg.author_id === userId;
  const isSystem = msg.author_type === "SYSTEM";
  const isAttachment = isTicketAttachmentRef(msg.message_text);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-muted-foreground italic px-3 py-1 rounded-full bg-muted/50">
          {msg.message_text}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border p-3", isOwn ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold">
          {isOwn ? t("Tu", "You") : msg.author_name ? `${t("Suport", "Support")} · ${msg.author_name}` : t("Echipa Rentli", "Rentli team")}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {format(new Date(msg.created_at), "d MMM yyyy, HH:mm", { locale })}
        </span>
      </div>
        {isAttachment ? (
          <AttachmentBubble reference={msg.message_text} />
        ) : (
          <div className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {msg.message_text}
          </div>
        )}
    </div>
  );
}