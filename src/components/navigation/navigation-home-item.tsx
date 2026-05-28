"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NavigationHomeItem = () => {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/dms") ?? false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/dms"
          prefetch
          scroll={false}
          className="group relative flex items-center focus-visible:ring-0"
        >
          <div
            className={cn(
              "absolute left-0 bg-white/90 rounded-r-full transition-all w-[4px]",
              !isActive && "group-hover:h-[20px]",
              isActive ? "h-[36px]" : "h-[8px]"
            )}
          />
          <div
            className={cn(
              "relative group flex mx-3 h-[48px] w-[48px] rounded-[24px] overflow-hidden items-center justify-center",
              "transition-all duration-200 bg-indigo-500/90 text-white",
              "group-hover:rounded-[16px] group-hover:shadow-[0_10px_22px_rgba(0,0,0,0.35)]",
              isActive && "rounded-[16px] ring-2 ring-indigo-300/40"
            )}
          >
            <MessageCircle className="h-5 w-5" />
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <p className="font-semibold text-sm">Direct Messages</p>
      </TooltipContent>
    </Tooltip>
  );
};
