import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Headphones, Send, X, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/queries/useCurrentUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUserTicket,
  fetchUserTicketMessages,
  addUserTicketMessage,
} from "@/features/tickets/userTicketsApi";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const STORAGE_KEY = "support_chat_ticket_id";

const SupportChatWidget = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [ticketPublicId, setTicketPublicId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  // Pre-fill name from profile
  useEffect(() => {
    if (profile?.full_name && !name) {
      setName(profile.full_name);
    }
  }, [profile?.full_name]);

  // Load ticket info if we have an ID
  const { data: ticketInfo } = useQuery({
    queryKey: ["supportTicketInfo", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_tickets" as any)
        .select("public_id, status")
        .eq("id", ticketId!)
        .single();
      if (error) {
        // Ticket doesn't exist anymore, clear it
        localStorage.removeItem(STORAGE_KEY);
        setTicketId(null);
        return null;
      }
      return data as any;
    },
    enabled: !!ticketId,
  });

  useEffect(() => {
    if (ticketInfo?.public_id) {
      setTicketPublicId(ticketInfo.public_id);
    }
  }, [ticketInfo]);

  // Messages polling
  const { data: messages = [] } = useQuery({
    queryKey: ["supportChatMessages", ticketId],
    queryFn: () => fetchUserTicketMessages(ticketId!),
    enabled: !!ticketId && isOpen,
    refetchInterval: 10000,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Submit form → create ticket
  const handleSubmitForm = async () => {
    if (!user) return;
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      const ticket = await createUserTicket({
        title: subject.trim(),
        description: description.trim(),
        category_group: "USER",
        category_type: "GENERAL_INQUIRY",
      });
      setTicketId(ticket.id);
      setTicketPublicId(ticket.public_id);
      localStorage.setItem(STORAGE_KEY, ticket.id);
      setSubject("");
      setDescription("");
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message
  const sendMutation = useMutation({
    mutationFn: (text: string) => addUserTicketMessage(ticketId!, text),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["supportChatMessages", ticketId] });
    },
  });

  const handleSendMessage = () => {
    const text = messageText.trim();
    if (!text || !ticketId) return;
    sendMutation.mutate(text);
  };

  const handleNewConversation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTicketId(null);
    setTicketPublicId(null);
    setSubject("");
    setDescription("");
    setMessageText("");
  };

  // Hide on admin routes
  if (isAdminRoute) return null;

  const isClosed = ticketInfo?.status === "CLOSED" || ticketInfo?.status === "RESOLVED";

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
          aria-label={t("Suport", "Support")}
        >
          <Headphones className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-background shadow-xl flex flex-col overflow-hidden" style={{ height: "min(500px, calc(100vh - 120px))" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-2xl">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t("Suport RentNow", "RentNow Support")}</p>
              {ticketPublicId && (
                <p className="text-xs opacity-80">{ticketPublicId}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {ticketId && (
                <button
                  onClick={handleNewConversation}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
                  title={t("Conversație nouă", "New conversation")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!user ? (
              /* Not authenticated */
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <Headphones className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Trebuie să fii autentificat pentru a contacta suportul.",
                      "You must be logged in to contact support."
                    )}
                  </p>
                  <Button variant="default" size="sm" className="mt-3" asChild>
                    <a href="/auth">{t("Autentificare", "Sign In")}</a>
                  </Button>
                </div>
              </div>
            ) : !ticketId ? (
              /* Ticket creation form */
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Completează formularul de mai jos și un administrator te va contacta în cel mai scurt timp.",
                    "Fill in the form below and an admin will get back to you shortly."
                  )}
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Nume", "Name")}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Numele tău", "Your name")}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Subiect", "Subject")} *</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("Despre ce este vorba?", "What is it about?")}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Descriere", "Description")} *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("Descrie problema sau sugestia ta...", "Describe your issue or suggestion...")}
                    className="text-sm min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSubmitForm}
                  disabled={!subject.trim() || !description.trim() || isSubmitting}
                  className="w-full"
                  size="sm"
                >
                  {isSubmitting
                    ? t("Se trimite...", "Sending...")
                    : t("Trimite", "Send")}
                </Button>
              </div>
            ) : (
              /* Chat view */
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  {messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {t(
                        "Ticketul tău a fost creat. Un administrator va răspunde în curând.",
                        "Your ticket has been created. An admin will respond soon."
                      )}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isCustomer = msg.author_type === "CUSTOMER";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isCustomer
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  isCustomer ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}
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

                {/* Message input */}
                {isClosed ? (
                  <div className="px-4 py-3 border-t text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("Acest ticket a fost închis.", "This ticket has been closed.")}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleNewConversation}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t("Conversație nouă", "New conversation")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 border-t">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={t("Scrie un mesaj...", "Type a message...")}
                      className="h-9 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
