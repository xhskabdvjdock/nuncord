"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Member, MemberRole, User } from "@prisma/client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMembersPanel } from "@/hooks/use-members-panel-store";
import { useModal } from "@/hooks/use-modal-store";

type MemberWithUserLite = Member & {
  user: Pick<
    User,
    | "id"
    | "name"
    | "imageUrl"
    | "status"
    | "statusText"
    | "bio"
    | "bannerUrl"
    | "createdAt"
    | "lastActiveAt"
  >;
};

interface ChannelMembersPanelProps {
  serverId: string;
  members: MemberWithUserLite[];
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: <ShieldCheck className="h-4 w-4 text-indigo-400" />,
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 text-rose-400" />,
};

export const ChannelMembersPanel = ({ serverId, members }: ChannelMembersPanelProps) => {
  const { isOpen } = useMembersPanel();
  const { onOpen } = useModal();
  const [liveMembers, setLiveMembers] = useState<MemberWithUserLite[]>(members);

  useEffect(() => {
    setLiveMembers(members);
  }, [members]);

  useEffect(() => {
    let cancelled = false;
    const pullPresence = async () => {
      try {
        const res = await axios.get(`/api/servers/${serverId}/members/presence`);
        if (!cancelled && Array.isArray(res.data?.members)) {
          setLiveMembers(res.data.members);
        }
      } catch {
        // ignore transient presence fetch errors
      }
    };

    void pullPresence();
    const interval = window.setInterval(pullPresence, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [serverId]);

  if (!isOpen) return null;

  const onlineMembers = useMemo(
    () => liveMembers.filter((m) => m.user.status !== "OFFLINE"),
    [liveMembers]
  );

  const offlineMembers = useMemo(
    () => liveMembers.filter((m) => m.user.status === "OFFLINE"),
    [liveMembers]
  );

  return (
    <aside className="hidden md:flex w-60 border-l border-zinc-800/70 surface-server">
      <ScrollArea className="flex-1 px-2 py-3">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-zinc-500 px-2 pb-2">
          Members - {liveMembers.length}
        </p>
        <div className="space-y-3">
          <div>
            <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-zinc-500">
              Online - {onlineMembers.length}
            </p>
            <div className="space-y-1">
              {onlineMembers.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() =>
                    onOpen("userProfile", {
                      profileUser: member.user,
                      profileServerId: serverId,
                      profileMemberId: member.id,
                    })
                  }
                  className={cn(
                    "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full text-left",
                    "hover:bg-zinc-700/40 transition"
                  )}
                >
                  <UserAvatar
                    src={member.user.imageUrl || ""}
                    name={member.user.name}
                    status={member.user.status}
                    className="h-8 w-8"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {member.user.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {member.user.statusText?.trim() || member.user.status}
                    </p>
                  </div>
                  <span className="ml-auto">{roleIconMap[member.role]}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-zinc-500">
              Offline - {offlineMembers.length}
            </p>
            <div className="space-y-1">
              {offlineMembers.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() =>
                    onOpen("userProfile", {
                      profileUser: member.user,
                      profileServerId: serverId,
                      profileMemberId: member.id,
                    })
                  }
                  className={cn(
                    "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full text-left opacity-80",
                    "hover:bg-zinc-700/40 transition"
                  )}
                >
                  <UserAvatar
                    src={member.user.imageUrl || ""}
                    name={member.user.name}
                    status={member.user.status}
                    className="h-8 w-8"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-300 truncate">
                      {member.user.name}
                    </p>
                  </div>
                  <span className="ml-auto">{roleIconMap[member.role]}</span>
                </button>
              ))}
            </div>
          </div>
          {liveMembers.length === 0 ? (
            <button
              type="button"
              className="w-full text-left px-2 py-2 text-xs text-zinc-500"
            >
              No members found.
            </button>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
};

