"use client";

import { useCallback, useEffect } from "react";
import axios from "axios";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/providers/socket-provider";
import { useUnreadStore } from "@/hooks/use-unread-store";

export const UnreadProvider = () => {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const pathname = usePathname();
  const params = useParams();
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  const setChannels = useUnreadStore((s) => s.setChannels);
  const setDms = useUnreadStore((s) => s.setDms);
  const bumpChannel = useUnreadStore((s) => s.bumpChannel);
  const bumpDm = useUnreadStore((s) => s.bumpDm);
  const clearChannel = useUnreadStore((s) => s.clearChannel);
  const clearDm = useUnreadStore((s) => s.clearDm);

  const serverId = params?.serverId as string | undefined;
  const activeChannelId = params?.channelId as string | undefined;
  const activeMemberId = params?.memberId as string | undefined;

  const refreshServerUnread = useCallback(async () => {
    if (!serverId) return;
    try {
      const res = await axios.get(`/api/unread?serverId=${serverId}`);
      if (res.data?.channels) setChannels(res.data.channels);
    } catch {
      // ignore
    }
  }, [serverId, setChannels]);

  const refreshDmUnread = useCallback(async () => {
    try {
      const res = await axios.get("/api/unread?dms=true");
      if (res.data?.dms) setDms(res.data.dms);
    } catch {
      // ignore
    }
  }, [setDms]);

  useEffect(() => {
    if (!userId) return;
    void refreshDmUnread();
  }, [userId, refreshDmUnread]);

  useEffect(() => {
    if (!userId || !serverId) return;
    void refreshServerUnread();
  }, [userId, serverId, refreshServerUnread]);

  useEffect(() => {
    if (!socket || !isConnected || !serverId) return;
    socket.emit("join-server", serverId);
    return () => {
      socket.emit("leave-server", serverId);
    };
  }, [socket, isConnected, serverId]);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;
    socket.emit("join-user", userId);
    return () => {
      socket.emit("leave-user", userId);
    };
  }, [socket, isConnected, userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const onChannelBump = (payload: {
      channelId: string;
      fromUserId?: string;
      mentionUserIds?: string[];
    }) => {
      if (!payload?.channelId) return;
      if (payload.fromUserId === userId) return;
      if (payload.channelId === activeChannelId) return;

      const mentioned =
        payload.mentionUserIds?.includes("__broadcast__") ||
        payload.mentionUserIds?.includes(userId) ||
        false;
      bumpChannel(payload.channelId, { mention: mentioned });
    };

    const onDmBump = (payload: {
      memberId: string;
      conversationId?: string;
      fromUserId?: string;
      mention?: boolean;
    }) => {
      if (!payload?.memberId) return;
      if (payload.fromUserId === userId) return;
      if (payload.memberId === activeMemberId) return;

      bumpDm(payload.memberId, {
        mention: payload.mention === true,
        conversationId: payload.conversationId,
      });
    };

    socket.on("unread:channel", onChannelBump);
    socket.on("unread:dm", onDmBump);

    return () => {
      socket.off("unread:channel", onChannelBump);
      socket.off("unread:dm", onDmBump);
    };
  }, [
    socket,
    userId,
    userName,
    activeChannelId,
    activeMemberId,
    bumpChannel,
    bumpDm,
  ]);

  useEffect(() => {
    if (!activeMemberId) return;
    clearDm(activeMemberId);
  }, [activeMemberId, clearDm]);

  useEffect(() => {
    if (!activeChannelId) return;
    clearChannel(activeChannelId);
  }, [activeChannelId, clearChannel]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshDmUnread();
      if (serverId) void refreshServerUnread();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [serverId, refreshDmUnread, refreshServerUnread]);

  return null;
};
