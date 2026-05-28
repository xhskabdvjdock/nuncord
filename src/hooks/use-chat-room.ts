"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";

type ChatRoomType = "channel" | "conversation";

export const useChatRoom = (chatId: string, type: ChatRoomType) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !chatId) return;

    if (type === "channel") {
      socket.emit("join-channel", chatId);
      return () => {
        socket.emit("leave-channel", chatId);
      };
    }

    socket.emit("join-conversation", chatId);
    return () => {
      socket.emit("leave-conversation", chatId);
    };
  }, [socket, isConnected, chatId, type]);
};
