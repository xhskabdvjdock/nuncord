"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, Search, Settings, User } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { useModal } from "@/hooks/use-modal-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NavigationFooter = () => {
  const { onOpen } = useModal();
  const [unreadCount, setUnreadCount] = useState(0);

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

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onOpen("notifications")}
            className="group flex items-center relative focus-visible:ring-0"
          >
            <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/70 group-hover:bg-amber-500 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
              <Bell className="group-hover:text-white transition text-amber-300" size={20} />
            </div>
            {unreadCount > 0 ? (
              <span className="absolute top-0 right-2 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-zinc-900">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p className="font-semibold text-sm">Notifications</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onOpen("searchUsers")}
            className="group flex items-center focus-visible:ring-0"
          >
            <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/70 group-hover:bg-emerald-500 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
              <Search className="group-hover:text-white transition text-emerald-400" size={20} />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p className="font-semibold text-sm">Find Friends</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/profile" className="group flex items-center focus-visible:ring-0">
            <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/70 group-hover:bg-indigo-500 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
              <User className="group-hover:text-white transition text-indigo-400" size={20} />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p className="font-semibold text-sm">Profile</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onOpen("appSettings")}
            className="group flex items-center focus-visible:ring-0"
          >
            <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/70 group-hover:bg-violet-500 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
              <Settings
                className="group-hover:text-white transition text-violet-300"
                size={20}
              />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <p className="font-semibold text-sm">Settings</p>
        </TooltipContent>
      </Tooltip>

      <SignOutButton />
    </div>
  );
};
