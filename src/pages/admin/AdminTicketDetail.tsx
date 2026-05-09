import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Legacy detail route — preserves bookmarks/links by redirecting to the
 * new 3-panel inbox (`/admin/tickets?id=…`).
 */
const AdminTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useEffect(() => {
    if (id) navigate(`/admin/tickets?id=${id}`, { replace: true });
    else navigate("/admin/tickets", { replace: true });
  }, [id, navigate]);
  return null;
};

export default AdminTicketDetail;

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  WAITING_CUSTOMER: "bg-purple-100 text-purple-800",
  WAITING_OWNER: "bg-purple-100 text-purple-800",
  WAITING_INTERNAL: "bg-gray-100 text-gray-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-600",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const AdminTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ticket, isLoading } = useOpsTicket(id);
  const { data: messages } = useTicketMessages(id);
  const { data: auditLog } = useTicketAuditLog(id);
  const { data: attachments } = useTicketAttachments(id);

  const [messageText, setMessageText] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  // Mark ticket as read when admin opens it
  useEffect(() => {
    if (ticket?.id) {
      markTicketRead(ticket.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['opsTickets'] });
          queryClient.invalidateQueries({ queryKey: ['admin-notification-summary'] });
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        })
        .catch(() => {/* silent */});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [aiLoading, setAiLoading] = useState<null | "summarize" | "suggest_reply" | "suggest_action">(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiActionRec, setAiActionRec] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['opsTicket', id] });
    queryClient.invalidateQueries({ queryKey: ['ticketMessages', id] });
    queryClient.invalidateQueries({ queryKey: ['ticketAuditLog', id] });
    queryClient.invalidateQueries({ queryKey: ['opsTickets'] });
  };

  const handleFieldChange = async (field: string, newValue: string, auditAction: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const oldValue = (ticket as any)[field];
      await updateOpsTicketField(ticket.id, field, oldValue, newValue, auditAction);
      toast.success("Actualizat");
      invalidateAll();
    } catch { toast.error("Eroare la actualizare"); }
    finally { setUpdating(false); }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !id) return;
    setSending(true);
    try {
      await createTicketMessage(id, messageText, isInternal);
      toast.success(isInternal ? "Notă internă adăugată" : "Mesaj trimis");
      setMessageText("");
      invalidateAll();
    } catch { toast.error("Eroare"); }
    finally { setSending(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setSending(true);
    try {
      await uploadTicketAttachment(id, file);
      toast.success("Fișier atașat");
      queryClient.invalidateQueries({ queryKey: ['ticketAttachments', id] });
    } catch { toast.error("Eroare la upload"); }
    finally { setSending(false); }
  };

  const runAiAssist = async (mode: "summarize" | "suggest_reply" | "suggest_action") => {
    if (!id) return;
    setAiLoading(mode);
    try {
      const { data, error } = await supabase.functions.invoke("support-ai-admin-assist", {
        body: { ticketId: id, mode },
      });
      if (error) throw error;
      const text = (data as any)?.text?.trim();
      if (!text) throw new Error("Răspuns gol de la AI");
      if (mode === "summarize") setAiSummary(text);
      else if (mode === "suggest_action") setAiActionRec(text);
      else if (mode === "suggest_reply") {
        setMessageText(text);
        toast.success("Răspuns sugerat — revizuiește înainte de a trimite");
      }
    } catch (err: any) {
      toast.error(err?.message || "Eroare AI");
    } finally {
      setAiLoading(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticketul nu a fost găsit.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const categoryTypeLabel = CATEGORY_TYPES[ticket.category_group]?.find(t => t.value === ticket.category_type)?.label || ticket.category_type;
  const isClosed = ticket.status === 'CLOSED';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tickets')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Înapoi la tickete
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="font-mono text-lg text-muted-foreground">{ticket.public_id}</span>
              {ticket.title}
            </h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge className={statusColors[ticket.status]}>{STATUS_OPTIONS.find(o => o.value === ticket.status)?.label}</Badge>
              <Badge className={priorityColors[ticket.priority]}>{PRIORITY_OPTIONS.find(o => o.value === ticket.priority)?.label}</Badge>
              <Badge variant="outline">{CATEGORY_GROUP_LABELS[ticket.category_group]}</Badge>
              <Badge variant="outline">{categoryTypeLabel}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader><CardTitle className="text-base">Descriere</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Tabs: Messages & Audit */}
            <Tabs defaultValue="messages">
              <TabsList>
                <TabsTrigger value="messages">Conversație ({messages?.length || 0})</TabsTrigger>
                <TabsTrigger value="attachments">Atașamente ({attachments?.length || 0})</TabsTrigger>
                <TabsTrigger value="audit">Audit ({auditLog?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="space-y-4">
                {/* Messages timeline */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {messages?.map(msg => (
                    <div key={msg.id} className={`p-3 rounded-lg border ${msg.is_internal ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.is_internal && <Lock className="h-3 w-3 text-yellow-600" />}
                        <span className="text-xs font-medium">
                          {(() => {
                            const roleLabel =
                              msg.author_type === 'ADMIN' ? 'Admin' :
                              msg.author_type === 'CUSTOMER' ? 'Client' :
                              msg.author_type === 'OWNER' ? 'Proprietar' :
                              msg.author_type === 'SYSTEM' ? 'Sistem' :
                              msg.author_type;
                            return msg.author_name && msg.author_type !== 'SYSTEM'
                              ? `${roleLabel} · ${msg.author_name}`
                              : roleLabel;
                          })()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'd MMM yyyy HH:mm', { locale: ro })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                    </div>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nicio conversație încă</p>
                  )}
                </div>

                {/* Message input */}
                {!isClosed && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder={isInternal ? "Notă internă (vizibilă doar admin)..." : "Scrie un mesaj..."}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={isInternal} onCheckedChange={v => setIsInternal(v === true)} />
                          <Lock className="h-3 w-3" /> Notă internă
                        </label>
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" onChange={handleFileUpload} />
                          <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <Paperclip className="h-4 w-4" /> Atașează
                          </div>
                        </label>
                      </div>
                      <Button size="sm" onClick={handleSendMessage} disabled={sending || !messageText.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                        Trimite
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attachments">
                <div className="space-y-2">
                  {attachments?.map(att => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{att.file_name}</span>
                      {att.file_size && <span className="text-xs text-muted-foreground">({(att.file_size / 1024).toFixed(0)} KB)</span>}
                    </a>
                  ))}
                  {(!attachments || attachments.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">Niciun atașament</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audit">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {auditLog?.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                        {entry.old_value && <span className="text-xs text-muted-foreground">De la: {entry.old_value}</span>}
                        {entry.old_value && entry.new_value && <span className="text-xs text-muted-foreground"> → </span>}
                        {entry.new_value && <span className="text-xs font-medium">La: {entry.new_value}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.created_at), 'd MMM HH:mm', { locale: ro })}
                      </span>
                    </div>
                  ))}
                  {(!auditLog || auditLog.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nicio intrare în audit</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader><CardTitle className="text-base">Acțiuni</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <Select
                    value={ticket.status}
                    onValueChange={v => handleFieldChange('status', v, 'STATUS_CHANGED')}
                    disabled={updating}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioritate</label>
                  <Select
                    value={ticket.priority}
                    onValueChange={v => handleFieldChange('priority', v, 'PRIORITY_CHANGED')}
                    disabled={updating}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                {/* TODO: Stub for financial actions */}
                <Button variant="outline" size="sm" className="w-full" disabled>
                  💰 Crează Refund (TODO)
                </Button>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  ⚠️ Aplică Penalizare (TODO)
                </Button>
              </CardContent>
            </Card>

            {/* AI Assist */}
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Assist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline" size="sm" className="w-full justify-start"
                  onClick={() => runAiAssist("summarize")}
                  disabled={aiLoading !== null}
                >
                  {aiLoading === "summarize" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <ListChecks className="h-3.5 w-3.5 mr-2" />}
                  Sumarizează ticket
                </Button>
                <Button
                  variant="outline" size="sm" className="w-full justify-start"
                  onClick={() => runAiAssist("suggest_reply")}
                  disabled={aiLoading !== null || isClosed}
                >
                  {aiLoading === "suggest_reply" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Wand2 className="h-3.5 w-3.5 mr-2" />}
                  Sugerează răspuns
                </Button>
                <Button
                  variant="outline" size="sm" className="w-full justify-start"
                  onClick={() => runAiAssist("suggest_action")}
                  disabled={aiLoading !== null}
                >
                  {aiLoading === "suggest_action" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
                  Recomandă status & prioritate
                </Button>

                {aiSummary && (
                  <div className="text-xs whitespace-pre-wrap bg-muted/40 border rounded-md p-2 mt-2">
                    <p className="font-semibold text-[10px] uppercase tracking-wide text-primary mb-1">Sumar</p>
                    {aiSummary}
                  </div>
                )}
                {aiActionRec && (
                  <div className="text-xs whitespace-pre-wrap bg-muted/40 border rounded-md p-2">
                    <p className="font-semibold text-[10px] uppercase tracking-wide text-primary mb-1">Recomandare</p>
                    {aiActionRec}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground pt-1">Asistență AI internă — verifică înainte de a trimite.</p>
              </CardContent>
            </Card>

            {/* Context */}
            <Card>
              <CardHeader><CardTitle className="text-base">Context</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ticket.requester_user_id && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Creat de:</span>
                    <Link to={`/admin/users/${ticket.requester_user_id}`} className="text-primary hover:underline font-medium">
                      {ticket.requester_name || 'Utilizator'}
                    </Link>
                  </div>
                )}
                {ticket.reservation_id && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/admin/reservations`} className="text-primary hover:underline">
                      Rezervare
                    </Link>
                  </div>
                )}
                {ticket.product_id && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/admin/products`} className="text-primary hover:underline">
                      Produs
                    </Link>
                  </div>
                )}
                {ticket.rental_user_id && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/utilizator/${ticket.rental_user_id}`} className="text-primary hover:underline">
                      Chiriaș
                    </Link>
                  </div>
                )}
                {ticket.owner_user_id && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/utilizator/${ticket.owner_user_id}`} className="text-primary hover:underline">
                      Owner
                    </Link>
                  </div>
                )}
                {ticket.rental_user_id && ticket.owner_user_id && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/admin/conversations?buyer=${ticket.rental_user_id}&owner=${ticket.owner_user_id}`} className="text-primary hover:underline">
                      Vezi conversația
                    </Link>
                  </div>
                )}
                {!ticket.reservation_id && !ticket.product_id && !ticket.rental_user_id && !ticket.owner_user_id && !ticket.requester_user_id && (
                  <p className="text-muted-foreground">Niciun context atașat</p>
                )}

                {/* Tags */}
                {ticket.tags && ticket.tags.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Taguri</p>
                    <div className="flex flex-wrap gap-1">
                      {ticket.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
                <p>Creat: {format(new Date(ticket.created_at), 'd MMM yyyy HH:mm', { locale: ro })}</p>
                <p>Actualizat: {format(new Date(ticket.updated_at), 'd MMM yyyy HH:mm', { locale: ro })}</p>
                {ticket.closed_at && <p>Închis: {format(new Date(ticket.closed_at), 'd MMM yyyy HH:mm', { locale: ro })}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTicketDetail;
