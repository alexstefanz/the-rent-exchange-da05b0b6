import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Headphones, Send, X, MessageSquare, Plus, Bot, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

const STORAGE_KEY = "support_chat_ticket_id";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-ai-chat`;

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const COMPRESS_THRESHOLD = 1 * 1024 * 1024;

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
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
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nu am putut procesa imaginea"));
    };
    img.src = url;
  });
};

const uploadSupportImage = async (file: File, userId: string): Promise<string> => {
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
  const { error } = await supabase.storage.from("support-attachments").upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from("support-attachments").getPublicUrl(fileName);
  return data.publicUrl;
};

const isImageUrl = (text: string) =>
  /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(text) ||
  text.includes("/support-attachments/");

const renderMessageContent = (text: string) => {
  if (isImageUrl(text.trim())) {
    return (
      <a href={text.trim()} target="_blank" rel="noopener noreferrer">
        <img
          src={text.trim()}
          alt="Imagine atașată"
          className="max-w-full rounded-lg max-h-48 object-cover"
          loading="lazy"
        />
      </a>
    );
  }
  return <p className="whitespace-pre-wrap break-words">{text}</p>;
};

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolCallData {
  subject: string;
  description: string;
  category_group: string;
  category_type: string;
}

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

  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminRoute = pathname.startsWith("/admin");
  const hasInitiatedAi = useRef(false);

  const { data: ticketInfo } = useQuery({
    queryKey: ["supportTicketInfo", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_tickets" as any)
        .select("public_id, status")
        .eq("id", ticketId!)
        .single();
      if (error) {
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

  const { data: messages = [] } = useQuery({
    queryKey: ["supportChatMessages", ticketId],
    queryFn: () => fetchUserTicketMessages(ticketId!),
    enabled: !!ticketId && isOpen,
    refetchInterval: 10000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessages]);

  useEffect(() => {
    if (isOpen && user && !ticketId && aiMessages.length === 0 && !hasInitiatedAi.current) {
      hasInitiatedAi.current = true;
      streamAiResponse([]);
    }
  }, [isOpen, user, ticketId]);

  const handleToolCall = useCallback(async (toolData: ToolCallData) => {
    setIsCreatingTicket(true);
    try {
      const ticket = await createUserTicket({
        title: toolData.subject,
        description: toolData.description,
        category_group: toolData.category_group,
        category_type: toolData.category_type,
      });

      const aiSummary = aiMessages
        .filter(m => m.role === "user")
        .map(m => m.content)
        .join("\n");
      if (aiSummary) {
        await addUserTicketMessage(ticket.id, aiSummary);
      }

      setTicketId(ticket.id);
      setTicketPublicId(ticket.public_id);
      localStorage.setItem(STORAGE_KEY, ticket.id);
      setAiMessages([]);
      hasInitiatedAi.current = false;
      queryClient.invalidateQueries({ queryKey: ["supportChatMessages", ticket.id] });
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error(t("Eroare la crearea ticketului. Încearcă din nou.", "Failed to create ticket. Please try again."));
    } finally {
      setIsCreatingTicket(false);
    }
  }, [aiMessages, t, queryClient]);

  const streamAiResponse = async (conversationMessages: AiMessage[]) => {
    setIsAiLoading(true);
    setAiMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let toolCallName = "";
      let toolCallArgs = "";
      let hasToolCallFlag = false;

      const updateAssistant = (content: string) => {
        assistantSoFar = content;
        setAiMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content };
          return updated;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              updateAssistant(assistantSoFar + delta.content);
            }

            if (delta?.tool_calls) {
              hasToolCallFlag = true;
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) toolCallName = tc.function.name;
                if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (hasToolCallFlag && toolCallName === "create_support_ticket") {
        try {
          const toolData = JSON.parse(toolCallArgs) as ToolCallData;
          const handoffMsg = t(
            "Am înțeles problema ta. Creez acum un ticket și un administrator va prelua conversația. Mulțumesc pentru răbdare! 🙏",
            "I understand your issue. Creating a ticket now and an admin will take over. Thank you for your patience! 🙏"
          );
          updateAssistant(handoffMsg);
          await handleToolCall(toolData);
        } catch (e) {
          console.error("Failed to parse tool call:", e);
        }
      }
    } catch (err) {
      console.error("AI stream error:", err);
      setAiMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: t(
              "Îmi pare rău, am întâmpinat o eroare. Te rog încearcă din nou.",
              "Sorry, I encountered an error. Please try again."
            ),
          };
        }
        return updated;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendAiMessage = () => {
    const text = aiInput.trim();
    if (!text || isAiLoading) return;

    const userMsg: AiMessage = { role: "user", content: text };
    const newMessages = [...aiMessages, userMsg];
    setAiMessages(newMessages);
    setAiInput("");

    const apiMessages = newMessages.filter(m => m.content.trim());
    streamAiResponse(apiMessages);
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("Poți trimite doar imagini.", "You can only send images."));
      return;
    }

    setIsUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadSupportImage(compressed, user.id);

      if (ticketId) {
        sendMutation.mutate(url);
      } else {
        const userMsg: AiMessage = { role: "user", content: url };
        const newMessages = [...aiMessages, userMsg];
        setAiMessages(newMessages);
        const apiMessages = newMessages.filter(m => m.content.trim());
        streamAiResponse(apiMessages);
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(t("Eroare la încărcarea imaginii.", "Failed to upload image."));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTicketId(null);
    setTicketPublicId(null);
    setMessageText("");
    setAiMessages([]);
    hasInitiatedAi.current = false;
  };

  if (isAdminRoute) return null;

  const isClosed = ticketInfo?.status === "CLOSED" || ticketInfo?.status === "RESOLVED";

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

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
        <div
          className="fixed z-[60] bg-background flex flex-col overflow-hidden inset-0 lg:inset-auto lg:bottom-6 lg:right-4 lg:w-[400px] lg:max-w-[calc(100vw-2rem)] lg:rounded-2xl lg:border lg:shadow-2xl"
          style={{ height: "100dvh" }}
          ref={(el) => {
            if (el && window.innerWidth >= 1024) {
              el.style.height = "min(600px, calc(100vh - 100px))";
            }
          }}
        >
          {/* Header — desktop: white/clean, mobile: primary */}
          <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 lg:rounded-t-2xl bg-primary text-primary-foreground lg:bg-background lg:text-foreground">
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 lg:bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground lg:text-primary-foreground">R</span>
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t("Suport Rentli", "Rentli Support")}</p>
              <p className="text-xs opacity-70 lg:text-muted-foreground">
                {ticketPublicId || "Online"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(ticketId || aiMessages.length > 0) && (
                <button
                  onClick={handleNewConversation}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
                  title={t("Conversație nouă", "New conversation")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 lg:hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!user ? (
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
              /* AI Chat Phase */
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-3">
                    {aiMessages.map((msg, idx) => {
                      const isUser = msg.role === "user";
                      return (
                        <div
                          key={idx}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              isUser
                                ? "bg-amber-400 text-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            {msg.content ? renderMessageContent(msg.content) : null}
                            {!msg.content && isAiLoading && idx === aiMessages.length - 1 && (
                              <div className="flex items-center gap-1 py-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {isCreatingTicket && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("Se creează ticketul...", "Creating ticket...")}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* AI input */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-t shrink-0 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAiLoading || isCreatingTicket || isUploadingImage}
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={t("Scrie un mesaj...", "Type a message...")}
                    className="h-9 text-sm flex-1"
                    disabled={isAiLoading || isCreatingTicket}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAiMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleSendAiMessage}
                    disabled={!aiInput.trim() || isAiLoading || isCreatingTicket}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Ticket Chat View */
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
                                  ? "bg-amber-400 text-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              {renderMessageContent(msg.message_text)}
                              <p
                                className={`text-[10px] mt-1 ${
                                  isCustomer ? "text-foreground/60" : "text-muted-foreground"
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

                {isClosed ? (
                  <div className="px-4 py-3 border-t text-center shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("Acest ticket a fost închis.", "This ticket has been closed.")}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleNewConversation}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t("Conversație nouă", "New conversation")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 border-t shrink-0 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:pb-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendMutation.isPending || isUploadingImage}
                      className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-input bg-background hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
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
