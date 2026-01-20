import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation } from "@/features/messaging/messagingApi";
import { ChatDialog } from "@/components/messaging/ChatDialog";
import { useConversations } from "@/hooks/queries/useConversations";
import { useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
  }

  // Use React Query for conversations
  const { data: conversations = [], isLoading } = useConversations(user?.id);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Ieri';
    }
    return format(date, 'd MMM', { locale: ro });
  };

  const handleCloseChat = (open: boolean) => {
    if (!open) {
      setSelectedConversation(null);
      // Invalidate conversations cache to refresh unread counts
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mesaje</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nicio conversație</h3>
              <p className="text-muted-foreground">
                Conversațiile tale vor apărea aici când vei contacta un proprietar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedConversation(conv)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {conv.other_user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {conv.other_user?.full_name || 'Utilizator'}
                      </span>
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatMessageTime(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.product?.title}
                    </p>
                    {conv.last_message && (
                      <p className={`text-sm truncate mt-1 ${conv.unread_count ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {conv.last_message.sender_id === user?.id ? 'Tu: ' : ''}
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>

                  {conv.unread_count && conv.unread_count > 0 && (
                    <Badge variant="default" className="rounded-full h-6 min-w-6 flex items-center justify-center">
                      {conv.unread_count}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {selectedConversation && (
        <ChatDialog
          open={!!selectedConversation}
          onOpenChange={handleCloseChat}
          conversationId={selectedConversation.id}
          otherUserName={selectedConversation.other_user?.full_name || null}
          otherUserAvatar={selectedConversation.other_user?.avatar_url || null}
          productTitle={selectedConversation.product?.title || 'Produs'}
        />
      )}
    </div>
  );
}
