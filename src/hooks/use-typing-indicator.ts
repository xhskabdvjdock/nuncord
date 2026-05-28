"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

type TypingState = Record<string, number>;

export function useTypingIndicator(chatId: string) {
  const { socket, isConnected } = useSocket();
  const [typingMap, setTypingMap] = useState<TypingState>({});
  const cleanupIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onStart = ({ user }: { user?: string }) => {
      if (!user) return;
      setTypingMap((prev) => ({ ...prev, [user]: Date.now() }));
    };

    const onStop = ({ user }: { user?: string }) => {
      if (!user) return;
      setTypingMap((prev) => {
        if (!(user in prev)) return prev;
        const next = { ...prev };
        delete next[user];
        return next;
      });
    };

    socket.on("typing:start", onStart);
    socket.on("typing:stop", onStop);

    // Clean up stale typing states (e.g., disconnect / missed stop event)
    cleanupIntervalRef.current = window.setInterval(() => {
      const cutoff = Date.now() - 6000;
      setTypingMap((prev) => {
        const next: TypingState = {};
        for (const [u, ts] of Object.entries(prev)) {
          if (ts >= cutoff) next[u] = ts;
        }
        return next;
      });
    }, 2000);

    return () => {
      socket.off("typing:start", onStart);
      socket.off("typing:stop", onStop);
      if (cleanupIntervalRef.current) {
        window.clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [socket, isConnected, chatId]);

  const users = useMemo(() => Object.keys(typingMap), [typingMap]);
  const label = useMemo(() => {
    if (users.length === 0) return "";
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return `${users[0]} and ${users.length - 1} others are typing...`;
  }, [users]);

  return { users, label };
}

