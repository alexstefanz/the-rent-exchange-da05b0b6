import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Props {
  userId: string;
}

const UserConversationsTab = ({ userId }: Props) => {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['adminUserConversations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, product_id, buyer_id, owner_id, updated_at,
          products(title, images),
          buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url),
          owner:profiles!conversations_owner_id_fkey(full_name, avatar_url)
        `)
        .or(`buyer_id.eq.${userId},owner_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      // Get message counts
      const ids = (data || []).map(c => c.id);
      if (!ids.length) return [];

      const countsPromises = ids.map(async (cid) => {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', cid);
        return { id: cid, count: count || 0 };
      });
      const counts = await Promise.all(countsPromises);
      const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]));

      return (data || []).map(c => ({ ...c, message_count: countMap[c.id] || 0 }));
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!conversations?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nicio conversație</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((c: any) => {
        const isBuyer = c.buyer_id === userId;
        const otherUser = isBuyer ? c.owner : c.buyer;
        return (
          <Link
            key={c.id}
            to={`/admin/conversations/${c.id}`}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback className="text-xs">{otherUser?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {isBuyer ? '🛒' : '📦'} cu {otherUser?.full_name || 'Utilizator'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Produs: {c.products?.title || 'Produs șters'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium">{c.message_count} mesaje</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(c.updated_at), "d MMM yy", { locale: ro })}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default UserConversationsTab;
