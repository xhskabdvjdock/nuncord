"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { UserStatus } from "@prisma/client";
import { Bell, Search, UserPlus, UserRound } from "lucide-react";
import { getStatusLabel } from "@/lib/presence";
import type { DmFriend } from "@/lib/dm-friends";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";
import { useUnreadStore } from "@/hooks/use-unread-store";
import { UnreadDot } from "@/components/unread-dot";

type DmItem = {
  memberId: string;
  userName: string;
  imageUrl: string | null;
  status: "ONLINE" | "IDLE" | "BUSY" | "OFFLINE";
  statusText: string | null;
  sharedServerName: string;
  conversationId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

interface DmSidebarClientProps {
  items: DmItem[];
}

function sortDmItems(items: DmItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.userName.localeCompare(b.userName);
  });
}

function mapFriendsToItems(friends: DmFriend[]): DmItem[] {
  return friends.map((f) => ({
    memberId: f.memberId,
    userName: f.userName,
    imageUrl: f.imageUrl,
    status: f.status,
    statusText: f.statusText,
    sharedServerName: f.sharedServerName,
    conversationId: f.conversationId,
    lastMessageAt: f.lastMessageAt,
    lastMessagePreview: f.lastMessagePreview,
  }));
}

const navBtnClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 transition";

export const DmSidebarClient = ({ items: initialItems }: DmSidebarClientProps) => {
  const params = useParams();
  const pathname = usePathname();
  const { onOpen } = useModal();
  const { socket } = useSocket();
  const [items, setItems] = useState(() => sortDmItems(initialItems));
  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshFriends = useCallback(async () => {
    try {
      const res = await axios.get("/api/dm-friends");
      if (Array.isArray(res.data)) {
        setItems(sortDmItems(mapFriendsToItems(res.data)));
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    setItems(sortDmItems(initialItems));
  }, [initialItems]);

  useEffect(() => {
    const interval = window.setInterval(refreshFriends, 25000);
    return () => window.clearInterval(interval);
  }, [refreshFriends]);

  useEffect(() => {
    const onLocalSent = (event: Event) => {
      const detail = (event as CustomEvent<{ memberId: string; preview: string }>)
        .detail;
      if (!detail?.memberId) return;
      setItems((prev) => {
        const now = new Date().toISOString();
        const existing = prev.find((i) => i.memberId === detail.memberId);
        if (!existing) return prev;
        const updated = {
          ...existing,
          lastMessageAt: now,
          lastMessagePreview: detail.preview,
        };
        const rest = prev.filter((i) => i.memberId !== detail.memberId);
        return sortDmItems([updated, ...rest]);
      });
    };

    window.addEventListener("dm:sent", onLocalSent);
    return () => window.removeEventListener("dm:sent", onLocalSent);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onDmActivity = (payload: {
      memberId?: string;
      fromUserId?: string;
      preview?: string | null;
      imageUrl?: string;
      userName?: string;
      conversationId?: string;
    }) => {
      if (!payload?.memberId) return;

      setItems((prev) => {
        const now = new Date().toISOString();
        const existing = prev.find((i) => i.memberId === payload.memberId);
        const preview =
          payload.preview?.trim() ||
          (existing?.lastMessagePreview ?? null);

        const updated: DmItem = existing
          ? {
              ...existing,
              imageUrl: payload.imageUrl || existing.imageUrl,
              userName: payload.userName || existing.userName,
              conversationId: payload.conversationId ?? existing.conversationId,
              lastMessageAt: now,
              lastMessagePreview: preview,
            }
          : {
              memberId: payload.memberId!,
              userName: payload.userName || "User",
              imageUrl: payload.imageUrl || null,
              status: "OFFLINE",
              statusText: null,
              sharedServerName: "",
              conversationId: payload.conversationId ?? null,
              lastMessageAt: now,
              lastMessagePreview: preview,
            };

        const rest = prev.filter((i) => i.memberId !== payload.memberId);
        return sortDmItems([updated, ...rest]);
      });

      void refreshFriends();
    };

    socket.on("unread:dm", onDmActivity);
    return () => {
      socket.off("unread:dm", onDmActivity);
    };
  }, [socket, refreshFriends]);

  const isFriendsHome = pathname === "/dms";
  const onlineCount = useMemo(
    () => items.filter((i) => i.status !== "OFFLINE").length,
    [items]
  );

  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const res = await axios.get("/api/notifications");
        if (mounted) setUnreadCount(res.data.unreadCount || 0);
      } catch {
        if (mounted) setUnreadCount(0);
      }
    };
    void fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const sortedDms = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sortDmItems(items);
    if (!q) return list;
    return list.filter((item) => item.userName.toLowerCase().includes(q));
  }, [items, query]);

  const dms = useUnreadStore((s) => s.dms);

  const renderDmLink = (item: DmItem) => {
    const isActive = params?.memberId === item.memberId;
    const badge = dms[item.memberId];
    const showBadge = !isActive && !!badge && (badge.unread || badge.mention);
    const subtitle =
      item.lastMessagePreview?.trim() ||
      getStatusLabel(item.status as UserStatus, item.statusText);

    return (
      <Link
        key={item.memberId}
        href={`/dms/${item.memberId}`}
        prefetch
        scroll={false}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2 py-2 border border-transparent hover:bg-zinc-800/50 transition",
          isActive && "bg-zinc-800/70 border-zinc-700/70",
          showBadge && badge?.mention && "bg-rose-500/5"
        )}
      >
        <UserAvatar
          src={item.imageUrl || ""}
          name={item.userName}
          status={item.status}
          className="h-9 w-9 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm truncate",
              showBadge ? "font-semibold text-zinc-100" : "text-zinc-200"
            )}
          >
            {item.userName}
          </p>
          <p
            className={cn(
              "text-[11px] truncate",
              showBadge && badge?.mention
                ? "text-rose-300/90"
                : showBadge
                  ? "text-zinc-300"
                  : "text-zinc-500"
            )}
          >
            {subtitle}
          </p>
        </div>
        {showBadge ? <UnreadDot mention={badge.mention} /> : null}
      </Link>
    );
  };

  return (
    <div className="surface-server flex h-full flex-col border-r border-zinc-800/70">
      <div className="h-12 px-4 flex items-center border-b border-zinc-800/60 shadow-sm shrink-0">
        <p className="font-semibold text-zinc-100 truncate">Direct Messages</p>
      </div>
      <div className="px-3 pt-3 pb-2 border-b border-zinc-800/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find or start a conversation"
            className="h-9 pl-9 bg-zinc-950/25 border-zinc-800/70"
          />
        </div>
      </div>

      <div className="space-y-0.5 px-2 pt-2">
        <Link
          href="/dms"
          className={cn(
            navBtnClass,
            isFriendsHome && "bg-zinc-800/70 text-zinc-100"
          )}
        >
          <UserRound className="h-4 w-4 text-zinc-400" />
          <span>Friends</span>
          {onlineCount > 0 ? (
            <span className="ml-auto text-[10px] text-emerald-400 font-medium">
              {onlineCount} online
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => onOpen("notifications")}
          className={cn(navBtnClass, "relative")}
        >
          <Bell className="h-4 w-4 text-amber-300" />
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Direct Messages</p>
        <button
          type="button"
          onClick={() => onOpen("searchUsers")}
          className="h-5 w-5 rounded text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200 transition grid place-items-center"
          title="Add friend"
        >
          <UserPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-2 pb-[52px]">
        <div className="space-y-0.5">
          {sortedDms.map(renderDmLink)}
          {!sortedDms.length ? (
            <p className="px-2 py-3 text-xs text-zinc-500">
              No conversations yet. Press + above to add a friend.
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
};
