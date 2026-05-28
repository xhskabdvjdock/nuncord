"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const SignOutButton = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="group flex items-center focus-visible:ring-0"
        >
          <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/70 group-hover:bg-red-500 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
            <LogOut className="group-hover:text-white transition text-red-400" size={20} />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <p className="font-semibold text-sm">Sign Out</p>
      </TooltipContent>
    </Tooltip>
  );
};
