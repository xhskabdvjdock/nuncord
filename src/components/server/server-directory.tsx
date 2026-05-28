"use client";

import { useEffect, useMemo, useState } from "react";
import { Channel, ChannelType, MemberRole, Server } from "@prisma/client";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ServerChannel } from "./server-channel";
import { useSocket } from "@/components/providers/socket-provider";
import { MicOff, Headphones } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface ServerDirectoryProps {
  server: Server;
  role?: MemberRole;
  channels: Channel[];
}

const FAVORITES_KEY_PREFIX = "discord-clone:fav-channels:";

function sectionTitle(title: string, count: number, open: boolean, onToggle: () => void) {
  return (
    <button
      onClick={onToggle}
      className="server-section-title w-full flex items-center justify-between px-2 py-2 text-[11px] uppercase font-semibold text-zinc-500 hover:text-zinc-300 transition"
    >
      <span className="tracking-wide">{title}</span>
      <span className="flex items-center gap-2">
        <span className="text-[10px] rounded bg-zinc-800/70 border border-zinc-800 px-1.5 py-0.5">
          {count}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

export const ServerDirectory = ({
  server,
  role,
  channels,
}: ServerDirectoryProps) => {
  const { voiceByChannelId } = useSocket();
  const [query, setQuery] = useState("");
  const [openText, setOpenText] = useState(true);
  const [openAudio, setOpenAudio] = useState(true);
  const [openVideo, setOpenVideo] = useState(true);
  const [openPinned, setOpenPinned] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const favoritesStorageKey = `${FAVORITES_KEY_PREFIX}${server.id}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(favoritesStorageKey);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {
      setFavoriteIds([]);
    }
  }, [favoritesStorageKey]);

  const toggleFavorite = (channelId: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem(favoritesStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const filteredChannels = useMemo(() => {
    if (!q) return channels;
    return channels.filter((channel) => channel.name.toLowerCase().includes(q));
  }, [channels, q]);

  const pinnedChannels = filteredChannels.filter((c) => favoriteIds.includes(c.id));
  const textChannels = filteredChannels.filter(
    (c) => c.type === ChannelType.TEXT && !favoriteIds.includes(c.id)
  );
  const audioChannels = filteredChannels.filter(
    (c) => c.type === ChannelType.AUDIO && !favoriteIds.includes(c.id)
  );
  const videoChannels = filteredChannels.filter(
    (c) => c.type === ChannelType.VIDEO && !favoriteIds.includes(c.id)
  );

  return (
    <div className="mt-2">
      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels..."
            className="pl-9 bg-zinc-950/25 border border-zinc-800/80 focus-visible:ring-0"
          />
        </div>
      </div>

      {!!pinnedChannels.length && (
        <div className="mb-2">
          {sectionTitle("Pinned Channels", pinnedChannels.length, openPinned, () =>
            setOpenPinned((v) => !v)
          )}
          {openPinned && (
            <div className="space-y-[2px]">
              {pinnedChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                  pinned
                  isFavorite
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!!textChannels.length && (
        <div className="mb-2">
          {sectionTitle("Text Channels", textChannels.length, openText, () =>
            setOpenText((v) => !v)
          )}
          {openText && (
            <div className="space-y-[2px]">
              {textChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                  isFavorite={favoriteIds.includes(channel.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!!audioChannels.length && (
        <div className="mb-2">
          {sectionTitle("Voice Channels", audioChannels.length, openAudio, () =>
            setOpenAudio((v) => !v)
          )}
          {openAudio && (
            <div className="space-y-[2px]">
              {audioChannels.map((channel) => {
                const users = voiceByChannelId[channel.id] || [];
                return (
                  <div key={channel.id} className="space-y-1">
                    <ServerChannel
                      channel={channel}
                      role={role}
                      server={server}
                      isFavorite={favoriteIds.includes(channel.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                    {users.length ? (
                      <div className="ml-7 space-y-1">
                        {users.map((u) => (
                          <div
                            key={u.userId}
                            className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-zinc-300/90 hover:bg-zinc-800/40 transition"
                          >
                            <UserAvatar
                              src={u.imageUrl || ""}
                              name={u.name}
                              className="h-5 w-5"
                            />
                            <span className="truncate font-medium">{u.name}</span>
                            <span className="ml-auto flex items-center gap-1 text-zinc-500">
                              {u.micMuted ? (
                                <MicOff className="h-3.5 w-3.5 text-rose-300" />
                              ) : null}
                              {u.deafened ? (
                                <Headphones className="h-3.5 w-3.5 text-rose-300" />
                              ) : null}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!!videoChannels.length && (
        <div className="mb-2">
          {sectionTitle("Video Channels", videoChannels.length, openVideo, () =>
            setOpenVideo((v) => !v)
          )}
          {openVideo && (
            <div className="space-y-[2px]">
              {videoChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                  isFavorite={favoriteIds.includes(channel.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!filteredChannels.length && (
        <div className="px-2 py-4 text-center text-xs text-zinc-500">
          No results for "{query}".
        </div>
      )}
    </div>
  );
};

