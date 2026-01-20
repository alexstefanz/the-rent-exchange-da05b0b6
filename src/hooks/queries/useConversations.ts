import { useQuery } from "@tanstack/react-query";
import { getConversations, getMessages } from "@/features/messaging/messagingApi";

export const useConversations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: getConversations,
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds for messaging
  });
};

export const useMessages = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
  });
};
