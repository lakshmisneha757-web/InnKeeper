import { motion } from "framer-motion";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck, Calendar, Wrench, DollarSign, Sparkles, X, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface NotificationCenterProps {
  onClose: () => void;
}

const typeIcons: Record<string, typeof Bell> = {
  arrival: Calendar,
  departure: Calendar,
  maintenance: Wrench,
  charge: DollarSign,
  system: Bell,
  ai_insight: Sparkles,
};

const typeColors: Record<string, string> = {
  arrival: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  departure: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  maintenance: "bg-red-500/10 text-red-600 dark:text-red-400",
  charge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  system: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  ai_insight: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useStore();
  const utils = trpc.useUtils();

  const markReadMutation = trpc.notifications.markRead.useMutation();
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation();

  // Poll for new notifications every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    }, 15000);
    return () => clearInterval(interval);
  }, [utils]);

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markReadMutation.mutateAsync({ notificationId });
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, isRead: 1 } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
      utils.notifications.unreadCount.invalidate();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      setNotifications(notifications.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
      utils.notifications.unreadCount.invalidate();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-62.5">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif, i) => {
                  const Icon = typeIcons[notif.type] || Bell;
                  const colorClass = typeColors[notif.type] || typeColors.system;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                        notif.isRead ? "opacity-60" : "bg-accent/30"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        {notif.isRead ? <Check className="h-4 w-4 opacity-50" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(new Date(notif.createdAt))}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
