import { motion } from "framer-motion";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageContent } from "@/components/messaging/MessageContent";
import { AttachmentGrid } from "@/components/messaging/AttachmentGrid";
import type { Message } from "@/features/messaging/messagingApi";
import type { AttachmentRow } from "@/lib/chatMedia";

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
  seen: boolean;
  onOpenAttachment: (attachments: AttachmentRow[], index: number) => void;
}

export function MessageBubble({
  message,
  isOwn,
  isLastInGroup,
  seen,
  onOpenAttachment,
}: Props) {
  const { language } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const attachments = (message.attachments || []) as AttachmentRow[];
  const hasText = message.content && message.content.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] sm:max-w-[68%] flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-white border border-border/60 rounded-bl-md text-foreground",
            !hasText && attachments.length > 0 && "p-1.5"
          )}
        >
          {hasText && (
            <div className="px-3.5 py-2">
              <MessageContent text={message.content} messageId={message.id} isOwn={isOwn} />
            </div>
          )}
          {attachments.length > 0 && (
            <div className={cn(hasText ? "px-1.5 pb-1.5" : "")}>
              <AttachmentGrid
                attachments={attachments}
                onOpen={(i) => onOpenAttachment(attachments, i)}
              />
            </div>
          )}
        </div>
        {isLastInGroup && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1 px-1 text-[10px]",
              isOwn ? "text-muted-foreground" : "text-muted-foreground"
            )}
          >
            <span>{format(new Date(message.created_at), "HH:mm", { locale })}</span>
            {isOwn && (
              <span className="ml-0.5">
                {seen ? (
                  <CheckCheck className="h-3 w-3 text-primary" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}