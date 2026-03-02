import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, User, Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAdminConversationDetail } from "@/features/admin/adminConversationsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const AdminConversationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["adminConversationDetail", id],
    queryFn: () => getAdminConversationDetail(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Conversația nu a fost găsită.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/conversations")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { conversation, product, buyer, owner, messages } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/conversations")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Înapoi la conversații
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6" /> Vizualizare conversație
          </h1>
          <Badge variant="outline" className="mt-1">Read-only</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Mesaje ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isBuyer = msg.sender_id === conversation.buyer_id;
                      const sender = isBuyer ? buyer : owner;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isBuyer ? "" : "flex-row-reverse"}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={sender?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {sender?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] ${isBuyer ? "" : "text-right"}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium">
                                {sender?.full_name || "Utilizator"}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {isBuyer ? "Chiriaș" : "Proprietar"}
                              </Badge>
                            </div>
                            <div className={`rounded-lg p-3 text-sm ${isBuyer ? "bg-muted" : "bg-primary/10"}`}>
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(msg.created_at), "d MMM yyyy HH:mm", { locale: ro })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {messages.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Niciun mesaj în această conversație
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Product */}
            {product && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Produs</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt="" className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <p className="font-medium text-sm">{product.title}</p>
                  {product.slug && (
                    <Link to={`/produs/${product.slug}`} className="text-xs text-primary hover:underline">
                      Vezi anunțul →
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Buyer */}
            {buyer && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Chiriaș</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={buyer.avatar_url || ""} />
                      <AvatarFallback>{buyer.full_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{buyer.full_name || "Anonim"}</p>
                      <p className="text-xs text-muted-foreground">{buyer.email}</p>
                    </div>
                  </div>
                  <Link to={`/admin/users/${buyer.id}`} className="text-xs text-primary hover:underline mt-2 block">
                    Vezi profil admin →
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Owner */}
            {owner && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Proprietar</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={owner.avatar_url || ""} />
                      <AvatarFallback>{owner.full_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{owner.full_name || "Anonim"}</p>
                      <p className="text-xs text-muted-foreground">{owner.email}</p>
                    </div>
                  </div>
                  <Link to={`/admin/users/${owner.id}`} className="text-xs text-primary hover:underline mt-2 block">
                    Vezi profil admin →
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Meta */}
            <Card>
              <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
                <p>Creat: {format(new Date(conversation.created_at), "d MMM yyyy HH:mm", { locale: ro })}</p>
                <p>Actualizat: {format(new Date(conversation.updated_at), "d MMM yyyy HH:mm", { locale: ro })}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConversationDetail;
