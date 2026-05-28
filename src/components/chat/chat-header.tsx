"use client";

import { UserStatus } from "@prisma/client";
import { Hash, Pin, Users } from "lucide-react";
import { getStatusLabel } from "@/lib/presence";
import { UserAvatar } from "@/components/user-avatar";
import { SocketIndicator } from "@/components/socket-indicator";
import { useMembersPanel } from "@/hooks/use-members-panel-store";
import { useModal } from "@/hooks/use-modal-store";

interface ChatHeaderProps {
  serverId: string;
  channelId?: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
  memberCount?: number;
  onlineCount?: number;
  presenceStatus?: UserStatus;
  presenceText?: string | null;
}

export const ChatHeader = ({
  serverId,
  channelId,
  name,
  type,
  imageUrl,
  memberCount,
  onlineCount,
  presenceStatus,
  presenceText,
}: ChatHeaderProps) => {
  const { toggle } = useMembersPanel();
  const { onOpen } = useModal();

  return (
    <div className="surface-chat text-sm font-semibold px-3 flex items-center h-12 border-zinc-800/80 border-b bg-zinc-950/10 backdrop-blur-xl">
      {type === "channel" && (
        <Hash className="w-5 h-5 text-zinc-400 mr-2" />
      )}
      {type === "conversation" && (
        <UserAvatar src={imageUrl} name={name} className="h-8 w-8 mr-2" />
      )}
      <div className="min-w-0">
        <p className="font-semibold text-sm text-zinc-100 truncate">{name}</p>
        {type === "conversation" && presenceStatus ? (
          <p className="text-[11px] text-zinc-500 truncate">
            {getStatusLabel(presenceStatus, presenceText)}
          </p>
        ) : null}
      </div>
      {type === "channel" ? (
        <div className="ml-3 hidden md:flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="rounded-md bg-zinc-900/50 border border-zinc-800 px-2 py-0.5">
            {memberCount ?? 0} members
          </span>
          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 px-2 py-0.5">
            {onlineCount ?? 0} online
          </span>
        </div>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        {type === "channel" && (
          <button
            type="button"
            onClick={() =>
              onOpen("pinnedMessages", {
                query: { serverId, channelId: channelId || "" },
              })
            }
            className="h-8 w-8 rounded-md hover:bg-zinc-800/50 transition flex items-center justify-center focus-visible:ring-0"
            title="Pinned messages"
          >
            <Pin className="h-4 w-4 text-zinc-400" />
          </button>
        )}
        {type === "channel" && (
          <button
            type="button"
            onClick={toggle}
            className="h-8 w-8 rounded-md hover:bg-zinc-800/50 transition flex items-center justify-center focus-visible:ring-0"
            title="Toggle members"
          >
            <Users className="h-4 w-4 text-zinc-400" />
          </button>
        )}
        <SocketIndicator />
      </div>
    </div>
  );
};
