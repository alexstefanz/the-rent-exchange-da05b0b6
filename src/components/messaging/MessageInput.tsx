import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, X, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import {
  prepareAttachment,
  uploadAttachment,
  classifyFile,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  type PreparedAttachment,
  type UploadedAttachment,
} from "@/lib/chatMedia";
import { MAX_MESSAGE_LENGTH, MAX_SPECIAL_CHARS, countSpecialChars, clampChatInput } from "@/features/messaging/messagingApi";
import { cn } from "@/lib/utils";
import { containsProfanity } from "@/lib/profanityFilter";
import { useIsBanned } from "@/hooks/useIsBanned";
import { Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  conversationId: string;
  disabled?: boolean;
  isPaid?: boolean;
  onSend: (content: string, uploaded: UploadedAttachment[]) => Promise<void>;
  onTyping?: () => void;
}

export function MessageInput({ conversationId, disabled, isPaid, onSend, onTyping }: Props) {
  const { t } = useLanguage();
  const { isBanned } = useIsBanned();
  const effectiveDisabled = disabled || isBanned;
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PreparedAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profanityAlertOpen, setProfanityAlertOpen] = useState(false);
  const [contactAlert, setContactAlert] = useState<{ open: boolean; kind: "phone" | "email" | "both" }>({ open: false, kind: "phone" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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

  // Autosize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [text]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const updateKeyboardState = () => {
      const active = document.activeElement as HTMLElement | null;
      const editing = !!active && (
        active.tagName === "TEXTAREA" ||
        active.tagName === "INPUT" ||
        active.isContentEditable
      );
      const delta = window.innerHeight - vv.height;
      setKeyboardOpen(editing && delta > 80);
    };

    updateKeyboardState();
    vv.addEventListener("resize", updateKeyboardState);
    vv.addEventListener("scroll", updateKeyboardState);
    document.addEventListener("focusin", updateKeyboardState);
    document.addEventListener("focusout", updateKeyboardState);

    return () => {
      vv.removeEventListener("resize", updateKeyboardState);
      vv.removeEventListener("scroll", updateKeyboardState);
      document.removeEventListener("focusin", updateKeyboardState);
      document.removeEventListener("focusout", updateKeyboardState);
    };
  }, []);

  const handleFileSelect = async (input: HTMLInputElement) => {
    const files = Array.from(input.files || []);
    input.value = "";
    if (!files.length) return;
    if (pending.length + files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      toast.error(t(`Maxim ${MAX_ATTACHMENTS_PER_MESSAGE} fișiere per mesaj`, `Max ${MAX_ATTACHMENTS_PER_MESSAGE} files per message`));
      return;
    }
    const prepared: PreparedAttachment[] = [];
    for (const file of files) {
      if (!classifyFile(file)) {
        toast.error(t(`Format invalid: ${file.name}`, `Invalid format: ${file.name}`));
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(t(`Fișier prea mare (>25MB): ${file.name}`, `File too large (>25MB): ${file.name}`));
        continue;
      }
      const p = await prepareAttachment(file);
      if (p) prepared.push(p);
    }
    setPending((prev) => [...prev, ...prepared]);
  };

  const openAttachmentPicker = () => {
    if (typeof document === "undefined") return;
    if (effectiveDisabled || sending || pending.length >= MAX_ATTACHMENTS_PER_MESSAGE) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";
    input.multiple = true;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.style.display = "none";

    const cleanup = () => {
      input.onchange = null;
      input.remove();
    };

    input.onchange = () => {
      void handleFileSelect(input).finally(cleanup);
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

  const removePending = (i: number) => {
    setPending((prev) => {
      const next = [...prev];
      const [removed] = next.splice(i, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const handleSend = async () => {
    const content = text.trim();
    if (sending) return;
    if (!content && pending.length === 0) return;
    if (content && containsProfanity(content).hit) {
      setProfanityAlertOpen(true);
      return;
    }
    if (content && !isPaid) {
      // Normalize: strip spaces, dots, dashes between digits to catch obfuscated phones
      const normalized = content.replace(/[\s.\-]/g, "");
      const hasPhone = /(?:^|[^\d])07\d{8}(?!\d)/.test(normalized) || /(?:^|[^\d])\+?40\s*7\d{8}/.test(normalized);
      const hasEmail = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/.test(content);
      if (hasPhone || hasEmail) {
        setContactAlert({ open: true, kind: hasPhone && hasEmail ? "both" : hasPhone ? "phone" : "email" });
        return;
      }
    }
    if (content && countSpecialChars(content) > MAX_SPECIAL_CHARS) {
      toast.error(
        t(
          `Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`,
          `Maximum ${MAX_SPECIAL_CHARS} special symbols per message.`
        )
      );
      return;
    }
    setSending(true);
    setUploadProgress(0);

    try {
      const uploaded: UploadedAttachment[] = [];
      for (let i = 0; i < pending.length; i++) {
        const p = pending[i];
        const u = await uploadAttachment(conversationId, p, (pct) => {
          setUploadProgress(Math.round(((i + pct / 100) / pending.length) * 100));
        });
        if (u) uploaded.push(u);
        else toast.error(t("Încărcare eșuată pentru un fișier", "Upload failed for one file"));
      }
      await onSend(content, uploaded);
      setText("");
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
    } finally {
      setSending(false);
      setUploadProgress(0);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="border-t bg-background/95 backdrop-blur-sm shrink-0"
      style={{ paddingBottom: keyboardOpen ? "0px" : "env(safe-area-inset-bottom)" }}
    >
      {isBanned && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-sm text-destructive">
          <Ban className="h-4 w-4" strokeWidth={2.5} />
          <span className="font-medium">Cont suspendat — nu poți trimite mesaje.</span>
        </div>
      )}
      {pending.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {pending.map((p, i) => (
            <div key={i} className="relative shrink-0 h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border">
              <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
              {p.kind === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePending(i)}
                disabled={sending}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {sending && uploadProgress > 0 && (
        <div className="px-4 pt-2">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-end gap-2 p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={openAttachmentPicker}
          disabled={effectiveDisabled || sending || pending.length >= MAX_ATTACHMENTS_PER_MESSAGE}
          className="shrink-0 rounded-full text-muted-foreground hover:text-primary"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          rows={1}
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
            onTyping?.();
          }}
          onKeyDown={handleKey}
          disabled={effectiveDisabled || sending}
          placeholder={isBanned ? "Cont suspendat" : t("Scrie un mesaj...", "Write a message...")}
          className={cn(
            "min-h-[40px] max-h-[140px] resize-none rounded-2xl border-border/60 bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/40 px-4 py-2.5 text-base md:text-sm w-full"
          )}
        />
        {text.length >= MAX_MESSAGE_LENGTH * 0.8 && (
          <span
            className={cn(
              "pointer-events-none absolute bottom-1 right-3 text-[10px] tabular-nums",
              text.length >= MAX_MESSAGE_LENGTH
                ? "text-destructive font-medium"
                : text.length >= MAX_MESSAGE_LENGTH * 0.9
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {text.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}
        {countSpecialChars(text) > 0 && (
          <span
            className={cn(
              "pointer-events-none absolute bottom-1 left-3 text-[10px] tabular-nums",
              countSpecialChars(text) >= MAX_SPECIAL_CHARS
                ? "text-destructive font-medium"
                : countSpecialChars(text) >= MAX_SPECIAL_CHARS * 0.8
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {t("simboluri", "symbols")}: {countSpecialChars(text)}/{MAX_SPECIAL_CHARS}
          </span>
        )}
        </div>
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={effectiveDisabled || sending || (!text.trim() && pending.length === 0)}
          className="shrink-0 rounded-full h-10 w-10"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <AlertDialog open={profanityAlertOpen} onOpenChange={setProfanityAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Limbaj licențios detectat", "Offensive language detected")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Mesajul tău conține limbaj nepotrivit și nu poate fi trimis. Conturile care folosesc limbaj licențios sau ofensator pot fi avertizate, restricționate sau suspendate definitiv. Te rugăm să comunici respectuos.",
                "Your message contains inappropriate language and cannot be sent. Accounts that use offensive or abusive language may be warned, restricted, or permanently suspended. Please communicate respectfully."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t("Am înțeles", "Got it")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={contactAlert.open} onOpenChange={(open) => setContactAlert((s) => ({ ...s, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {contactAlert.kind === "both"
                ? t("Date de contact detectate", "Contact info detected")
                : contactAlert.kind === "phone"
                ? t("Număr de telefon detectat", "Phone number detected")
                : t("Adresă de email detectată", "Email address detected")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Te rugăm să păstrezi conversația pe Rentli. Dacă apar probleme cu o tranzacție, administratorii pot interveni doar dacă discuția rămâne pe platformă. Schimbul de date de contact înainte de plată este descurajat pentru siguranța ta.",
                "Please keep the conversation on Rentli. If any issue arises with a transaction, our admins can only step in if the discussion stays on the platform. Sharing contact details before payment is discouraged for your safety."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t("Am înțeles", "Got it")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}