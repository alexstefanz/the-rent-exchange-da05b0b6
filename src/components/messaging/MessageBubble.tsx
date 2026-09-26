import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { Check, CheckCheck, MoreVertical, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageContent } from "@/components/messaging/MessageContent";
import { AttachmentGrid } from "@/components/messaging/AttachmentGrid";
import type { Message } from "@/features/messaging/messagingApi";
import type { AttachmentRow } from "@/lib/chatMedia";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportMessageDialog } from "@/components/messaging/ReportMessageDialog";

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
  const { language, t } = useLanguage();
  const locale = language === "ro" ? ro : enUS;
  const attachments = (message.attachments || []) as AttachmentRow[];
  const hasText = message.content && message.content.trim().length > 0;
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] sm:max-w-[68%] min-w-0 flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div className={cn("group relative flex items-center gap-1", isOwn ? "flex-row-reverse" : "flex-row")}>
          <div
            className={cn(
              "rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md text-foreground",
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
          {!isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("Opțiuni mesaj", "Message options")}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem onSelect={() => setReportOpen(true)} className="text-destructive focus:text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  {t("Raportează mesaj", "Report message")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <ReportMessageDialog messageId={message.id} open={reportOpen} onOpenChange={setReportOpen} />
    </motion.div>
  );
}