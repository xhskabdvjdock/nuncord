"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Users } from "lucide-react";
import { UserStatus } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/presence";
import type { DmFriend } from "@/lib/dm-friends";

type FriendsTab = "all" | "online" | "pending";

interface FriendsHomeProps {
  friends: DmFriend[];
}

export const FriendsHome = ({ friends }: FriendsHomeProps) => {
  const [tab, setTab] = useState<FriendsTab>("online");
  const [query, setQuery] = useState("");

  const onlineFriends = useMemo(
    () => friends.filter((f) => f.status !== UserStatus.OFFLINE),
    [friends]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tab === "online" ? onlineFriends : friends;
    if (tab === "pending") list = [];
    if (!q) return list;
    return list.filter((f) => f.userName.toLowerCase().includes(q));
  }, [friends, onlineFriends, query, tab]);

  const tabs: { id: FriendsTab; label: string; count?: number }[] = [
    { id: "online", label: "Online", count: onlineFriends.length },
    { id: "all", label: "All", count: friends.length },
    { id: "pending", label: "Pending", count: 0 },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="h-12 px-4 flex items-center border-b border-zinc-800/70 shadow-sm">
        <Users className="h-5 w-5 text-zinc-400 mr-2" />
        <h1 className="font-semibold text-zinc-100">Friends</h1>
      </div>

      <div className="px-4 py-3 border-b border-zinc-800/50 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition",
              tab === t.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span className="ml-1.5 text-xs text-zinc-500">{t.count}</span>
            ) : null}
          </button>
        ))}
        <div className="ml-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends"
            className="h-8 w-44 bg-zinc-950/30 border-zinc-800/70"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "pending" ? (
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/30 p-8 text-center">
            <p className="text-zinc-300 font-medium">No pending requests</p>
            <p className="text-sm text-zinc-500 mt-1">
              Friend requests will appear here when available.
            </p>
          </div>
        ) : null}

        {tab !== "pending" && !filtered.length ? (
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/30 p-8 text-center">
            <p className="text-zinc-300 font-medium">No friends found</p>
            <p className="text-sm text-zinc-500 mt-1">
              Join a server, or press + next to Direct Messages to add a friend.
            </p>
          </div>
        ) : null}

        {tab !== "pending" && filtered.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 px-1">
              {tab === "online" ? "Online" : "Everyone"} — {filtered.length}
            </p>
            {filtered.map((friend) => (
              <div
                key={friend.userId}
                className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/25 px-3 py-2.5 hover:bg-zinc-800/40 transition"
              >
                <UserAvatar
                  src={friend.imageUrl || ""}
                  name={friend.userName}
                  status={friend.status}
                  className="h-10 w-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-100 truncate">
                    {friend.userName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {getStatusLabel(friend.status, friend.statusText)} •{" "}
                    {friend.sharedServerName}
                  </p>
                </div>
                <Link href={`/dms/${friend.memberId}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 bg-zinc-800 hover:bg-zinc-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-4 py-2 border-t border-zinc-800/50 text-[11px] text-zinc-500 flex flex-wrap gap-3">
        <span>
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">Ctrl</kbd> +{" "}
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">K</kbd> Find friends
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">Ctrl</kbd> +{" "}
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">Shift</kbd> +{" "}
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">N</kbd> Notifications
        </span>
      </div>
    </div>
  );
};
