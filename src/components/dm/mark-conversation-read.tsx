"use client";

import { useEffect } from "react";
import axios from "axios";
import { useUnreadStore } from "@/hooks/use-unread-store";

interface MarkConversationReadProps {
  conversationId: string;
  memberId: string;
}

export const MarkConversationRead = ({
  conversationId,
  memberId,
}: MarkConversationReadProps) => {
  const clearDm = useUnreadStore((s) => s.clearDm);

  useEffect(() => {
    clearDm(memberId);
    void axios.post("/api/unread", { conversationId }).catch(() => {});
  }, [conversationId, memberId, clearDm]);

  return null;
};
