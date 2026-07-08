import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Lock, Loader2, FileText, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTicketMessages, useTicketAttachments } from "@/hooks/queries/useOpsTickets";
import { createTicketMessage, uploadTicketAttachment } from "@/features/admin/opsTicketsApi";
import type { OpsTicket, OpsTicketMessage } from "@/features/admin/opsTicketsApi";
import { MAX_MESSAGE_LENGTH, MAX_SPECIAL_CHARS, countSpecialChars } from "@/features/messaging/messagingApi";

const dayLabel = (d: Date) => {
  if (isToday(d)) return "Astăzi";
  if (isYesterday(d)) return "Ieri";
  return format(d, "d MMMM yyyy", { locale: ro });
};

const isImage = (mime?: string | null) => !!mime && mime.startsWith("image/");

interface Props {
  ticket: OpsTicket;
  onAiAssist: () => void;
  draftReply: string;
  setDraftReply: (v: string) => void;
}

export function AdminConversation({ ticket, onAiAssist, draftReply, setDraftReply }: Props) {
  const qc = useQueryClient();
  const { data: messages } = useTicketMessages(ticket.id);
  const { data: attachments } = useTicketAttachments(ticket.id);
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  const isClosed = ticket.status === "CLOSED";

  const send = async () => {
    const trimmed = draftReply.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Maxim ${MAX_MESSAGE_LENGTH} caractere.`);
      return;
    }
    if (countSpecialChars(trimmed) > MAX_SPECIAL_CHARS) {
      toast.error(`Maxim ${MAX_SPECIAL_CHARS} simboluri speciale per mesaj.`);
      return;
    }
    setSending(true);
    try {
      await createTicketMessage(ticket.id, draftReply, isInternal);
      toast.success(isInternal ? "Notă internă adăugată" : "Mesaj trimis");
      setDraftReply("");
      qc.invalidateQueries({ queryKey: ["ticketMessages", ticket.id] });
      qc.invalidateQueries({ queryKey: ["opsTicket", ticket.id] });
      qc.invalidateQueries({ queryKey: ["opsTickets"] });
    } catch {
      toast.error("Eroare la trimitere");
    } finally { setSending(false); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      await uploadTicketAttachment(ticket.id, file);
      toast.success("Fișier atașat");
      qc.invalidateQueries({ queryKey: ["ticketAttachments", ticket.id] });
      qc.invalidateQueries({ queryKey: ["ticketMessages", ticket.id] });
    } catch { toast.error("Eroare upload"); }
    finally { setSending(false); e.target.value = ""; }
  };

  // Group messages by day
  const groups: { day: string; items: OpsTicketMessage[] }[] = [];
  (messages || []).forEach((m) => {
    const d = dayLabel(new Date(m.created_at));
    const last = groups[groups.length - 1];
    if (last && last.day === d) last.items.push(m);
    else groups.push({ day: d, items: [m] });
  });

  const attByMsg = new Map<string, typeof attachments>();
  (attachments || []).forEach((a) => {
    const k = a.message_id || "_orphan";
    const arr = attByMsg.get(k) || [];
    arr.push(a);
    attByMsg.set(k, arr);
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Description card */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Descriere inițială</p>
        <p className="text-sm whitespace-pre-wrap line-clamp-3">{ticket.description}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nicio conversație încă — răspunde mai jos.</p>
        )}
        {groups.map((g, gi) => (
          <div key={gi} className="space-y-2">
            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{g.day}</span>
              <div className="h-px bg-border flex-1" />
            </div>
            {g.items.map((m) => {
              const isAdmin = m.author_type === "ADMIN";
              const isSystem = m.author_type === "SYSTEM";
              const atts = attByMsg.get(m.id) || [];

              if (isSystem) {
                return (
                  <div key={m.id} className="text-center">
                    <span className="inline-block text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {m.message_text} · {format(new Date(m.created_at), "HH:mm")}
                    </span>
                  </div>
                );
              }

              return (
                <div key={m.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm",
                    m.is_internal
                      ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100"
                      : isAdmin
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                  )}>
                    <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-0.5">
                      {m.is_internal && <Lock className="h-2.5 w-2.5" />}
                      <span className="font-medium">
                        {m.is_internal ? "Notă internă" :
                          isAdmin ? "Tu (Admin)" :
                          m.author_type === "OWNER" ? "Proprietar" :
                          m.author_type === "CUSTOMER" ? "Client" :
                          m.author_type}
                        {m.author_name && !m.is_internal ? ` · ${m.author_name}` : ""}
                      </span>
                      <span className="ml-1">{format(new Date(m.created_at), "HH:mm")}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.message_text}</p>
                    {atts.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {atts.map((a) => (
                          <a
                            key={a.id}
                            href={a.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-md overflow-hidden border border-current/20 bg-background/30"
                          >
                            {isImage(a.file_type) ? (
                              <img src={a.file_url} alt={a.file_name} className="w-full h-24 object-cover" loading="lazy" />
                            ) : (
                              <div className="flex items-center gap-1.5 p-2 text-xs">
                                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{a.file_name}</span>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Orphan attachments (no message_id) */}
        {(attByMsg.get("_orphan") || []).length > 0 && (
          <div className="border-t pt-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Atașamente standalone</p>
            <div className="grid grid-cols-3 gap-2">
              {(attByMsg.get("_orphan") || []).map((a) => (
                <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 p-2 rounded-md border hover:bg-muted/50 text-xs">
                  {isImage(a.file_type) ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  <span className="truncate">{a.file_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      {!isClosed && (
        <div className={cn(
          "border-t p-3 space-y-2 transition-colors",
          isInternal && "bg-amber-50/50 dark:bg-amber-950/20"
        )}>
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setIsInternal(false)}
              className={cn("px-2 py-0.5 rounded-md font-medium transition-colors",
                !isInternal ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              Răspuns public
            </button>
            <button
              onClick={() => setIsInternal(true)}
              className={cn("px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1",
                isInternal ? "bg-amber-500 text-white" : "text-muted-foreground hover:bg-muted")}
            >
              <Lock className="h-2.5 w-2.5" /> Notă internă
            </button>
            <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-[11px] text-primary" onClick={onAiAssist}>
              <Sparkles className="h-3 w-3 mr-1" /> AI sugerează
            </Button>
          </div>
          <Textarea
            value={draftReply}
            onChange={(e) => setDraftReply(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={isInternal ? "Notă internă (vizibilă doar admin)…" : "Răspunde clientului…"}
            rows={3}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
            }}
          />
          {(draftReply.length >= MAX_MESSAGE_LENGTH * 0.8 || countSpecialChars(draftReply) > 0) && (
            <div className="flex items-center justify-between text-[10px] tabular-nums">
              <span className={cn(
                countSpecialChars(draftReply) >= MAX_SPECIAL_CHARS
                  ? "text-destructive font-medium"
                  : countSpecialChars(draftReply) >= MAX_SPECIAL_CHARS * 0.8
                  ? "text-primary"
                  : "text-muted-foreground"
              )}>
                simboluri: {countSpecialChars(draftReply)}/{MAX_SPECIAL_CHARS}
              </span>
              <span className={cn(
                draftReply.length >= MAX_MESSAGE_LENGTH
                  ? "text-destructive font-medium"
                  : draftReply.length >= MAX_MESSAGE_LENGTH * 0.9
                  ? "text-primary"
                  : "text-muted-foreground"
              )}>
                {draftReply.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <input type="file" className="hidden" onChange={onFile} />
              <Paperclip className="h-3.5 w-3.5" /> Atașează
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:inline">⌘+Enter</span>
              <Button
                size="sm"
                onClick={send}
                disabled={
                  sending ||
                  !draftReply.trim() ||
                  draftReply.length > MAX_MESSAGE_LENGTH ||
                  countSpecialChars(draftReply) > MAX_SPECIAL_CHARS
                }
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Trimite
              </Button>
            </div>
          </div>
        </div>
      )}
      {isClosed && (
        <div className="border-t p-4 text-center text-sm text-muted-foreground">
          Acest ticket este închis. Schimbă statusul pentru a relua conversația.
        </div>
      )}
    </div>
  );
}