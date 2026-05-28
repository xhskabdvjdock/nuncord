"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  name?: string;
  className?: string;
  status?: "ONLINE" | "IDLE" | "BUSY" | "OFFLINE";
}

const statusMap = {
  ONLINE: "bg-emerald-500",
  IDLE: "bg-amber-500",
  BUSY: "bg-rose-500",
  OFFLINE: "bg-zinc-500",
};

export const UserAvatar = ({ src, name, className, status }: UserAvatarProps) => {
  return (
    <div className="relative inline-flex">
      <Avatar className={cn("h-8 w-8", className)}>
        <AvatarImage src={src} />
        <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
          {name?.charAt(0)?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      {status ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-zinc-900",
            statusMap[status]
          )}
        />
      ) : null}
    </div>
  );
};
