import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/use-notifications";
import { Bell, Check, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";

export function NotificationBell() {
  const { user, accessToken } = useAuthStore();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Setup WebSocket for realtime notifications
  useEffect(() => {
    if (!user || !accessToken) return;

    // Use the exact same Socket.IO configuration as the Chat floating widget
    const socket: Socket = io(window.location.origin, {
      path: "/socket.io/",
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("new_notification", (notification) => {
      // Optimistically update the query cache
      queryClient.setQueryData(["notifications", user.id], (old: any) => {
        if (!old) return [notification];
        return [notification, ...old];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, accessToken, queryClient]);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 px-2 text-blue-600 dark:text-blue-400"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
          ) : (
            notifications.map((notif: any) => (
              <div 
                key={notif.id} 
                className={`p-4 border-b last:border-0 flex flex-col gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                onClick={() => {
                  if (!notif.isRead) markAsRead.mutate(notif.id);
                  if (notif.link) {
                    window.location.href = notif.link; // or router.push
                    setIsOpen(false);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-sm line-clamp-1">{notif.title}</p>
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {notif.message}
                </p>
                <span className="text-[10px] text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
