import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export function useNotifications() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get("/notifications");
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // optionally poll every minute, though websocket is better
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/notifications/read-all`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}
