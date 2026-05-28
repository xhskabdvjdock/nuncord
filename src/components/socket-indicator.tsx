"use client";

import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";

export const SocketIndicator = () => {
  const { isConnected, isConnecting, latencyMs } = useSocket();

  if (isConnecting && !isConnected) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-600/10 text-amber-400 border-amber-600/30 animate-pulse"
      >
        Reconnecting...
      </Badge>
    );
  }

  if (!isConnected) {
    return (
      <Badge variant="outline" className="bg-yellow-600/10 text-yellow-400 border-yellow-600/20">
        Offline
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-emerald-600/10 text-emerald-500 border-emerald-600/20">
      Live{latencyMs ? ` • ${latencyMs}ms` : ""}
    </Badge>
  );
};
