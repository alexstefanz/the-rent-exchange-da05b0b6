import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, X, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  prepareAttachment,
  uploadAttachment,
  classifyFile,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  type PreparedAttachment,
  type UploadedAttachment,
} from "@/lib/chatMedia";
import { MAX_MESSAGE_LENGTH } from "@/features/messaging/messagingApi";
import { cn } from "@/lib/utils";
import { containsProfanity } from "@/lib/profanityFilter";
import { useIsBanned } from "@/hooks/useIsBanned";
import { Ban } from "lucide-react";

interface Props {
  conversationId: string;
  disabled?: boolean;
  onSend: (content: string, uploaded: UploadedAttachment[]) => Promise<void>;
  onTyping?: () => void;
}

export function MessageInput({ conversationId, disabled, onSend, onTyping }: Props) {
  const { t } = useLanguage();
  const { isBanned } = useIsBanned();
  const effectiveDisabled = disabled || isBanned;
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PreparedAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [text]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
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
      toast.error(
        t(
          "Limbajul licențios nu este permis. Conturile care încalcă această regulă pot fi suspendate.",
          "Offensive language is not allowed. Accounts that break this rule can be suspended."
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
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          multiple
          hidden
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={effectiveDisabled || sending || pending.length >= MAX_ATTACHMENTS_PER_MESSAGE}
          className="shrink-0 rounded-full text-muted-foreground hover:text-primary"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
            onTyping?.();
          }}
          onKeyDown={handleKey}
          disabled={effectiveDisabled || sending}
          placeholder={isBanned ? "Cont suspendat" : t("Scrie un mesaj...", "Write a message...")}
          className={cn(
            "min-h-[40px] max-h-[140px] resize-none rounded-2xl border-border/60 bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/40 px-4 py-2.5 text-base md:text-sm"
          )}
        />
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
    </div>
  );
}