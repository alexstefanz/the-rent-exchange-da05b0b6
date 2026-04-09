import { useState, useEffect, useRef } from "react";
import { Headphones, X, ArrowLeft, Send, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import {
  fetchOpsTickets,
  fetchTicketMessages,
  createTicketMessage,
  OpsTicket,
  OpsTicketMessage,
  STATUS_OPTIONS,
} from "@/features/admin/opsTicketsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// Bypass type checking for the new column
const opsTickets = () => supabase.from("ops_tickets" as any);

interface TicketWithUnread extends OpsTicket {
  unread_count: number;
  last_message?: string;
  last_message_at?: string;
}

export default function AdminSupportWidget() {
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<TicketWithUnread[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OpsTicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  // Load active tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const activeTickets = await fetchOpsTickets();
      const active = activeTickets.filter(t =>
        ["NEW", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_OWNER", "WAITING_INTERNAL"].includes(t.status)
      );

      // Get last message and unread count for each ticket
      const enriched: TicketWithUnread[] = await Promise.all(
        active.map(async (ticket) => {
          const msgs = await fetchTicketMessages(ticket.id);
          const lastMsg = msgs[msgs.length - 1];
          const lastAdminRead = (ticket as any).last_admin_read_at;
          const unread = msgs.filter(
            m => m.author_type === "CUSTOMER" && (!lastAdminRead || new Date(m.created_at) > new Date(lastAdminRead))
          ).length;
          return {
            ...ticket,
            unread_count: unread,
            last_message: lastMsg?.message_text,
            last_message_at: lastMsg?.created_at,
          };
        })
      );

      enriched.sort((a, b) => {
        if (a.status === "NEW" && b.status !== "NEW") return -1;
        if (b.status === "NEW" && a.status !== "NEW") return 1;
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      setTickets(enriched);
    } catch (e) {
      console.error("Failed to load tickets:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadTickets();
  }, [isAdmin]);

  // Realtime: new tickets + new messages
  useEffect(() => {
    if (!isAdmin) return;

    const ticketChannel = supabase
      .channel("admin-widget-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "ops_tickets" }, () => {
        loadTickets();
      })
      .subscribe();

    const msgChannel = supabase
      .channel("admin-widget-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ops_ticket_messages" }, (payload) => {
        const newMsg = payload.new as OpsTicketMessage;
        // Update messages if viewing this ticket
        if (newMsg.ticket_id === selectedTicketId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
        // Refresh ticket list for unread counts
        loadTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [isAdmin, selectedTicketId]);

  // Load messages when selecting a ticket
  useEffect(() => {
    if (!selectedTicketId) return;
    setLoadingMessages(true);
    fetchTicketMessages(selectedTicketId).then(msgs => {
      setMessages(msgs);
      setLoadingMessages(false);
      // Mark as read
      opsTickets()
        .update({ last_admin_read_at: new Date().toISOString() } as any)
        .eq("id", selectedTicketId)
        .then(() => loadTickets());
    });
  }, [selectedTicketId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedTicketId) return;
    setSending(true);
    try {
      await createTicketMessage(selectedTicketId, newMessage, isInternal, "ADMIN");
      setNewMessage("");
    } catch (e) {
      console.error("Failed to send:", e);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalUnread = tickets.reduce((sum, t) => sum + t.unread_count, 0)
    + tickets.filter(t => t.status === "NEW").length;

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const getStatusLabel = (status: string) =>
    STATUS_OPTIONS.find(s => s.value === status)?.label || status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-500";
      case "IN_PROGRESS": return "bg-amber-500";
      case "WAITING_CUSTOMER": return "bg-orange-500";
      default: return "bg-muted";
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 border-2"
          style={{
            backgroundColor: "white",
            borderColor: "#F98715",
            color: "#F98715",
          }}
          aria-label="Suport Tickete"
        >
          <Headphones className="h-6 w-6" />
          {totalUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1"
              style={{ backgroundColor: "#F98715" }}
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
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
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ backgroundColor: "#F98715" }}
          >
            {selectedTicketId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTicketId(null)}
                className="text-white hover:bg-white/20 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {selectedTicket ? selectedTicket.public_id : "Tickete Suport"}
              </h3>
              {selectedTicket && (
                <p className="text-xs text-white/80 truncate">{selectedTicket.title}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setIsOpen(false); setSelectedTicketId(null); }}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          {!selectedTicketId ? (
            // Ticket List
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 px-4">
                  <Headphones className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Niciun ticket activ</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                    >
                      <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${getStatusColor(ticket.status)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.public_id}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate mt-0.5">{ticket.title}</p>
                        {ticket.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {ticket.last_message}
                          </p>
                        )}
                        {ticket.last_message_at && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(ticket.last_message_at), "dd MMM, HH:mm", { locale: ro })}
                          </p>
                        )}
                      </div>
                      {ticket.unread_count > 0 && (
                        <span
                          className="h-5 min-w-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1 shrink-0"
                          style={{ backgroundColor: "#F98715" }}
                        >
                          {ticket.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Chat View
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    Niciun mesaj încă.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => {
                      const isAdmin = msg.author_type === "ADMIN" || msg.author_type === "SYSTEM";
                      const isInternalNote = msg.is_internal;
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isInternalNote
                                ? "bg-yellow-100 border border-yellow-300 text-yellow-900"
                                : isAdmin
                                ? "text-white"
                                : "bg-muted"
                            }`}
                            style={!isInternalNote && isAdmin ? { backgroundColor: "#F98715" } : undefined}
                          >
                            {isInternalNote && (
                              <div className="flex items-center gap-1 mb-1">
                                <Lock className="h-3 w-3" />
                                <span className="text-[10px] font-medium">Notă internă</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                            <p className={`text-[10px] mt-1 ${
                              isInternalNote ? "text-yellow-700" : isAdmin ? "text-white/70" : "text-muted-foreground"
                            }`}>
                              {format(new Date(msg.created_at), "HH:mm", { locale: ro })}
                              {msg.author_type === "SYSTEM" && " · AI"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t space-y-2 bg-background">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                    className="scale-75"
                  />
                  <Lock className="h-3 w-3" />
                  <span>Notă internă</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={isInternal ? "Scrie o notă internă..." : "Răspunde clientului..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={sending}
                    className="text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    style={{ backgroundColor: "#F98715" }}
                    className="text-white hover:opacity-90 shrink-0"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
