"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";

export type VoiceUser = {
  userId: string;
  name: string;
  imageUrl: string;
  micMuted: boolean;
  deafened: boolean;
};

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  latencyMs: number | null;
  voiceByChannelId: Record<string, VoiceUser[]>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: true,
  latencyMs: null,
  voiceByChannelId: {},
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [voiceByChannelId, setVoiceByChannelId] = useState<Record<string, VoiceUser[]>>({});

  useEffect(() => {
    const socketInstance = ClientIO(
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
      {
        path: "/api/socket/io",
        addTrailingSlash: false,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }
    );

    socketInstance.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      setIsConnecting(true);
      setLatencyMs(null);
    });

    socketInstance.on("reconnect_attempt", () => {
      setIsConnecting(true);
    });

    socketInstance.on("voice:state", (payload: { channelId: string; users: VoiceUser[] }) => {
      if (!payload?.channelId) return;
      setVoiceByChannelId((prev) => ({
        ...prev,
        [payload.channelId]: Array.isArray(payload.users) ? payload.users : [],
      }));
    });

    setSocket(socketInstance);

    let pingInterval: ReturnType<typeof setInterval> | null = null;
    const runPing = () => {
      const startedAt = performance.now();
      socketInstance.timeout(2500).emit("client:ping", (err: Error | null) => {
        if (err) {
          setLatencyMs(null);
          return;
        }
        setLatencyMs(Math.round(performance.now() - startedAt));
      });
    };

    pingInterval = setInterval(() => {
      if (socketInstance.connected) runPing();
    }, 15000);

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, isConnecting, latencyMs, voiceByChannelId }}
    >
      {children}
    </SocketContext.Provider>
  );
};
