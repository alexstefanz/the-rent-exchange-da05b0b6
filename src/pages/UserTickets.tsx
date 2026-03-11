import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, MessageCircle, Send, LifeBuoy, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  fetchUserTickets,
  createUserTicket,
  fetchUserTicketMessages,
  addUserTicketMessage,
  CATEGORY_GROUPS,
  CATEGORY_TYPES,
  CATEGORY_GROUP_LABELS,
  type OpsTicket,
  type OpsTicketMessage,
} from "@/features/tickets/userTicketsApi";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "Nou", variant: "default" },
  IN_PROGRESS: { label: "În lucru", variant: "secondary" },
  WAITING_CUSTOMER: { label: "Așteptare răspuns", variant: "outline" },
  WAITING_OWNER: { label: "Așteptare owner", variant: "outline" },
  WAITING_INTERNAL: { label: "În procesare", variant: "secondary" },
  RESOLVED: { label: "Rezolvat", variant: "default" },
  CLOSED: { label: "Închis", variant: "destructive" },
};

const UserTickets = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['userTickets'],
    queryFn: fetchUserTickets,
    enabled: !!user,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 pt-24 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <LifeBuoy className="h-6 w-6 text-primary" />
                {t("Suport & Tickete", "Support & Tickets")}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t("Creează și urmărește cererile tale de suport", "Create and track your support requests")}
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Ticket nou", "New ticket")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("Creează un ticket", "Create a ticket")}</DialogTitle>
                </DialogHeader>
                <CreateTicketForm
                  onSuccess={() => {
                    setCreateDialogOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['userTickets'] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Tickets List */}
          {isLoading || authLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !tickets?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <LifeBuoy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">{t("Niciun ticket", "No tickets")}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Nu ai creat încă niciun ticket de suport.", "You haven't created any support tickets yet.")}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Creează primul ticket", "Create first ticket")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isExpanded={expandedTicketId === ticket.id}
                  onToggle={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ============================================
// Ticket Card with expandable messages
// ============================================

const TicketCard = ({ ticket, isExpanded, onToggle }: { ticket: OpsTicket; isExpanded: boolean; onToggle: () => void }) => {
  const { t } = useLanguage();
  const statusInfo = STATUS_LABELS[ticket.status] || { label: ticket.status, variant: "outline" as const };
  const categoryLabel = CATEGORY_GROUP_LABELS[ticket.category_group] || ticket.category_group;
  const typeLabel = CATEGORY_TYPES[ticket.category_group]?.find(ct => ct.value === ticket.category_type)?.label || ticket.category_type;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{ticket.public_id}</span>
              <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                {statusInfo.label}
              </Badge>
            </div>
            <p className="font-medium text-sm truncate">{ticket.title}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{categoryLabel} → {typeLabel}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{format(new Date(ticket.created_at), "d MMM yyyy, HH:mm", { locale: ro })}</span>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {/* Description */}
          <div className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>
          {/* Messages Timeline */}
          <TicketMessages ticketId={ticket.id} ticketStatus={ticket.status} />
        </div>
      )}
    </Card>
  );
};

// ============================================
// Messages Timeline
// ============================================

const TicketMessages = ({ ticketId, ticketStatus }: { ticketId: string; ticketStatus: string }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  const { data: messages, isLoading } = useQuery({
    queryKey: ['userTicketMessages', ticketId],
    queryFn: () => fetchUserTicketMessages(ticketId),
    refetchInterval: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => addUserTicketMessage(ticketId, text),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['userTicketMessages', ticketId] });
    },
    onError: () => {
      toast({ title: t("Eroare", "Error"), description: t("Nu s-a putut trimite mesajul", "Could not send message"), variant: "destructive" });
    },
  });

  const isClosed = ticketStatus === 'CLOSED' || ticketStatus === 'RESOLVED';

  return (
    <div className="p-4 space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : messages?.length ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.author_type === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.author_type === 'CUSTOMER'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium opacity-70">
                    {msg.author_type === 'CUSTOMER' ? t("Tu", "You") : msg.author_type === 'SYSTEM' ? 'System' : t("Suport", "Support")}
                  </span>
                  <span className="text-[10px] opacity-50">
                    {format(new Date(msg.created_at), "d MMM, HH:mm", { locale: ro })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.message_text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t("Niciun mesaj încă", "No messages yet")}
        </p>
      )}

      {/* Reply input */}
      {!isClosed && (
        <div className="flex gap-2 pt-2">
          <Input
            placeholder={t("Scrie un mesaj...", "Write a message...")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                e.preventDefault();
                sendMutation.mutate(newMessage.trim());
              }
            }}
          />
          <Button
            size="icon"
            disabled={!newMessage.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate(newMessage.trim())}
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================
// Create Ticket Form
// ============================================

const CreateTicketForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("");
  const [categoryType, setCategoryType] = useState("");

  const createMutation = useMutation({
    mutationFn: createUserTicket,
    onSuccess: () => {
      toast({ title: t("Ticket creat", "Ticket created"), description: t("Ticketul tău a fost trimis cu succes.", "Your ticket has been submitted successfully.") });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: t("Eroare", "Error"), description: err.message, variant: "destructive" });
    },
  });

  const categoryTypes = categoryGroup ? (CATEGORY_TYPES[categoryGroup] || []) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryGroup || !categoryType) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category_group: categoryGroup,
      category_type: categoryType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("Categorie", "Category")}</Label>
        <Select value={categoryGroup} onValueChange={(v) => { setCategoryGroup(v); setCategoryType(""); }}>
          <SelectTrigger><SelectValue placeholder={t("Selectează categoria", "Select category")} /></SelectTrigger>
          <SelectContent>
            {CATEGORY_GROUPS.map(g => (
              <SelectItem key={g} value={g}>{CATEGORY_GROUP_LABELS[g] || g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {categoryGroup && (
        <div className="space-y-2">
          <Label>{t("Tip problemă", "Issue type")}</Label>
          <Select value={categoryType} onValueChange={setCategoryType}>
            <SelectTrigger><SelectValue placeholder={t("Selectează tipul", "Select type")} /></SelectTrigger>
            <SelectContent>
              {categoryTypes.map(ct => (
                <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("Titlu", "Title")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("Descrie pe scurt problema", "Briefly describe the issue")}
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("Descriere", "Description")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("Explică în detaliu problema întâmpinată...", "Explain the issue in detail...")}
          rows={4}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!title.trim() || !description.trim() || !categoryGroup || !categoryType || createMutation.isPending}
      >
        {createMutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("Se trimite...", "Submitting...")}</>
        ) : (
          t("Trimite ticketul", "Submit ticket")
        )}
      </Button>
    </form>
  );
};

export default UserTickets;
