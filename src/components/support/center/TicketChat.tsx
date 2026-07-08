import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImagePlus, Loader2, CheckCheck, Check } from "lucide-react";
import { format, isToday, isYesterday, type Locale } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_MESSAGE_LENGTH, MAX_SPECIAL_CHARS, countSpecialChars, clampChatInput } from "@/features/messaging/messagingApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    onError: () => toast.error(t("Nu s-a putut trimite mesajul.", "Could not send message.")),
  });

  const handleSend = () => {
    const txt = text.trim();
    if (!txt || sendMutation.isPending) return;
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
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-background to-muted/20">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            {t("Începe conversația cu echipa de suport.", "Start the conversation with our support team.")}
          </p>
        ) : (
          <AnimatePresence initial={false}>
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
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </div>

      {!isClosed ? (
        <div className="border-t border-border/60 p-3 bg-background">
          <div className="flex items-end gap-2">
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
              enterKeyHint="send"
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("Scrie un mesaj…", "Write a message…")}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              className="min-h-9 max-h-40 resize-none overflow-y-auto"
            />
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              aria-label={t("Trimite", "Send")}
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-2 items-end", isOwn ? "justify-end" : "justify-start")}
    >
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {msg.author_name?.[0]?.toUpperCase() || "S"}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[75%] flex flex-col", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <span className="text-[10px] text-muted-foreground px-1 mb-0.5">
            {msg.author_name ? `${t("Suport", "Support")} · ${msg.author_name}` : t("Suport", "Support")}
          </span>
        )}
        {isAttachment ? (
          <AttachmentBubble reference={msg.message_text} />
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border/60 rounded-bl-md text-foreground"
            )}
          >
            {msg.message_text}
          </div>
        )}
        <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-muted-foreground">
          <span>{format(new Date(msg.created_at), "HH:mm", { locale })}</span>
          {isOwn && (
            <span>
              {msg.read_at ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}