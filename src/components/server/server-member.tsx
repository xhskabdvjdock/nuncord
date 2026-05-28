"use client";

import { Member, Server, User } from "@prisma/client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

interface ServerMemberProps {
  member: Member & {
    user: Pick<User, "id" | "name" | "imageUrl" | "status" | "statusText">;
  };
  server: Server;
}

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

const statusTextMap = {
  ONLINE: "Online",
  IDLE: "Away",
  BUSY: "Busy",
  OFFLINE: "Offline",
};

export const ServerMember = ({ member, server }: ServerMemberProps) => {
  const params = useParams();

  const icon = roleIconMap[member.role];

  return (
    <Link
      href={`/dms/${member.id}`}
      prefetch
      scroll={false}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/40 transition mb-1 border border-transparent",
        params?.memberId === member.id &&
          "bg-zinc-700/70 border-zinc-600/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
      )}
    >
      <UserAvatar
        src={member.user.imageUrl || ""}
        name={member.user.name}
        status={member.user.status}
        className="h-8 w-8"
      />
      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold text-sm text-zinc-400 group-hover:text-zinc-300 transition truncate",
            params?.memberId === member.id && "text-zinc-200"
          )}
        >
          {member.user.name}
        </p>
        <p className="text-[11px] text-zinc-500 truncate">
          {member.user.statusText?.trim() || statusTextMap[member.user.status]}
        </p>
      </div>
      <span className="ml-auto">{icon}</span>
    </Link>
  );
};
