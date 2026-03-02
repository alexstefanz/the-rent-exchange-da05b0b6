import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAdminConversations } from "@/features/admin/adminConversationsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const AdminConversations = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["adminConversations", search],
    queryFn: () => getAdminConversations(search || undefined),
    staleTime: 30_000,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6" /> Conversații
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vizualizează conversațiile dintre chiriași și proprietari
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după produs, chiriaș sau proprietar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : !conversations?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nicio conversație găsită</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/admin/conversations/${conv.id}`)}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                {/* Product image */}
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {conv.product_images?.[0] ? (
                    <img src={conv.product_images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conv.product_title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="truncate">{conv.buyer_name || "Anonim"}</span>
                    <span>↔</span>
                    <span className="truncate">{conv.owner_name || "Anonim"}</span>
                  </div>
                  {conv.last_message_content && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {conv.last_message_content}
                    </p>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {conv.message_count} mesaje
                  </Badge>
                  {conv.last_message_created_at && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conv.last_message_created_at), "d MMM HH:mm", { locale: ro })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminConversations;
