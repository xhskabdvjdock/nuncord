"use client";

import { Channel, ChannelType, MemberRole, Server } from "@prisma/client";
import { Edit, Hash, Lock, Mic, Pin, PinOff, Trash, Video } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useModal } from "@/hooks/use-modal-store";
import { useUnreadStore } from "@/hooks/use-unread-store";
import { UnreadDot } from "@/components/unread-dot";

interface ServerChannelProps {
  channel: Channel;
  server: Server;
  role?: MemberRole;
  pinned?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (channelId: string) => void;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
};

export const ServerChannel = ({
  channel,
  server,
  role,
  pinned,
  isFavorite,
  onToggleFavorite,
}: ServerChannelProps) => {
  const { onOpen } = useModal();
  const params = useParams();
  const Icon = iconMap[channel.type];
  const isActive = params?.channelId === channel.id;
  const badge = useUnreadStore((s) => s.channels[channel.id]);
  const showBadge = !isActive && !!badge && (badge.unread || badge.mention);

  const onAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (action === "edit") {
      onOpen("editChannel", { channel, server });
    }
    if (action === "delete") {
      onOpen("deleteChannel", { channel, server });
    }
  };

  return (
    <Link
      href={`/servers/${params?.serverId}/channels/${channel.id}`}
      prefetch
      scroll={false}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full mb-1 border border-transparent",
        "hover:bg-zinc-800/35 hover:border-zinc-800/60 transition",
        isActive &&
          "bg-zinc-800/60 border-zinc-700/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0 w-5 h-5",
          isActive ? "text-zinc-200" : "text-zinc-400"
        )}
      />
      <p
        className={cn(
          "line-clamp-1 font-semibold text-sm transition",
          isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300"
        )}
      >
        {channel.name}
      </p>
      {showBadge ? <UnreadDot mention={badge.mention} /> : null}
      {channel.name !== "general" && role !== MemberRole.GUEST && (
        <div className={cn("flex items-center gap-x-2", !showBadge && "ml-auto")}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleFavorite?.(channel.id);
            }}
            className="hidden group-hover:block"
            title={isFavorite ? "Unpin channel" : "Pin channel"}
          >
            {isFavorite ? (
              <PinOff className="w-4 h-4 text-zinc-300 hover:text-zinc-100 transition" />
            ) : (
              <Pin className="w-4 h-4 text-zinc-400 hover:text-zinc-200 transition" />
            )}
          </button>
          <Edit
            onClick={(e) => onAction(e, "edit")}
            className="hidden group-hover:block w-4 h-4 text-zinc-400 hover:text-zinc-300 transition"
          />
          <Trash
            onClick={(e) => onAction(e, "delete")}
            className="hidden group-hover:block w-4 h-4 text-zinc-400 hover:text-zinc-300 transition"
          />
        </div>
      )}
      {channel.name === "general" && (
        <Lock className="ml-auto w-4 h-4 text-zinc-500" />
      )}
      {pinned && channel.name !== "general" && (
        <Pin className="ml-auto w-3.5 h-3.5 text-indigo-300/80" />
      )}
    </Link>
  );
};
