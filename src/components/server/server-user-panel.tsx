"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Headphones, Mic, MicOff, Settings } from "lucide-react";
import { UserStatus } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal-store";
import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/presence";

interface ServerUserPanelProps {
  user: {
    id: string;
    name: string;
    imageUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    status: UserStatus;
    statusText: string | null;
    createdAt: Date;
  };
  className?: string;
}

export const ServerUserPanel = ({ user, className }: ServerUserPanelProps) => {
  const { onOpen } = useModal();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [liveStatus, setLiveStatus] = useState<UserStatus>(user.status);
  const [liveStatusText, setLiveStatusText] = useState<string | null>(user.statusText);

  useEffect(() => {
    let cancelled = false;

    const pullPresence = async () => {
      try {
        const res = await axios.get("/api/presence");
        if (cancelled) return;
        if (res.data?.status) {
          setLiveStatus(res.data.status);
        }
        setLiveStatusText(
          typeof res.data?.statusText === "string" ? res.data.statusText : null
        );
      } catch {
        // ignore transient presence errors
      }
    };

    void pullPresence();
    const interval = window.setInterval(pullPresence, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        "h-[52px] shrink-0 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm px-2 flex items-center gap-2",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onOpen("userProfile", { profileUser: user })}
        className="flex items-center min-w-0 flex-1 rounded-md px-1.5 py-1 hover:bg-zinc-800/60 transition"
      >
        <UserAvatar
          src={user.imageUrl || ""}
          name={user.name}
          status={liveStatus}
          className="h-8 w-8"
        />
        <div className="ml-2 min-w-0 text-left">
          <p className="text-xs font-semibold text-zinc-100 truncate">{user.name}</p>
          <p className="text-[10px] text-zinc-400 truncate">
            {getStatusLabel(liveStatus, liveStatusText)}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setIsMuted((v) => !v)}
          className={cn(
            "h-8 w-8 rounded-md grid place-items-center transition",
            isMuted
              ? "bg-rose-500/15 text-rose-300"
              : "text-zinc-300 hover:bg-zinc-800/70"
          )}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setIsDeafened((v) => !v)}
          className={cn(
            "h-8 w-8 rounded-md grid place-items-center transition",
            isDeafened
              ? "bg-rose-500/15 text-rose-300"
              : "text-zinc-300 hover:bg-zinc-800/70"
          )}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          <Headphones className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onOpen("appSettings")}
          className="h-8 w-8 rounded-md grid place-items-center text-zinc-300 hover:bg-zinc-800/70 transition"
          title="User settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

