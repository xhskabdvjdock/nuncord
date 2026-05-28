"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Bell, CheckCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";

type NotificationItem = {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  actor?: { name: string; imageUrl?: string | null } | null;
  message?: { channelId: string; channel?: { serverId: string } | null } | null;
};

export const NotificationsModal = () => {
  const { isOpen, onClose, type } = useModal();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isModalOpen = isOpen && type === "notifications";

  const fetchNotifications = async () => {
    const response = await axios.get("/api/notifications");
    setNotifications(response.data.notifications || []);
    setUnreadCount(response.data.unreadCount || 0);
  };

  useEffect(() => {
    if (!isModalOpen) return;
    fetchNotifications().catch(console.error);
  }, [isModalOpen]);

  const markAllRead = async () => {
    await axios.patch("/api/notifications", { readAll: true });
    fetchNotifications().catch(console.error);
  };

  const markOneRead = async (notificationId: string) => {
    await axios.patch("/api/notifications", { notificationId });
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1f2125] text-white p-0 overflow-hidden max-w-lg border border-zinc-700">
        <DialogHeader className="pt-7 px-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-400" />
            Notifications
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Recent mentions and activity ({unreadCount} unread)
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="outline" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-3 ${
                  notification.read
                    ? "border-zinc-700 bg-zinc-900/40"
                    : "border-indigo-500/40 bg-indigo-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-100">{notification.content}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markOneRead(notification.id)}
                      className="text-xs text-indigo-300 hover:text-indigo-100"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                {notification.message?.channelId &&
                notification.message.channel?.serverId ? (
                  <Link
                    href={`/servers/${notification.message.channel.serverId}/channels/${notification.message.channelId}`}
                    onClick={onClose}
                    className="text-xs text-indigo-300 hover:underline mt-2 inline-block"
                  >
                    Open message location
                  </Link>
                ) : null}
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6">
                No notifications yet.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

