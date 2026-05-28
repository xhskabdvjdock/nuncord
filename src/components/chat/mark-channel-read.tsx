"use client";

import { useEffect } from "react";
import axios from "axios";
import { useUnreadStore } from "@/hooks/use-unread-store";

export const MarkChannelRead = ({ channelId }: { channelId: string }) => {
  const clearChannel = useUnreadStore((s) => s.clearChannel);

  useEffect(() => {
    clearChannel(channelId);
    void axios.post("/api/unread", { channelId }).catch(() => {});
  }, [channelId, clearChannel]);

  return null;
};
