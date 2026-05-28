"use client";

import { Plus } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NavigationAction = () => {
  const { onOpen } = useModal();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onOpen("createServer")}
          className="group flex items-center focus-visible:ring-0"
        >
          <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/70 group-hover:bg-emerald-500 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
            <Plus
              className="group-hover:text-white transition text-emerald-400"
              size={25}
            />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <p className="font-semibold text-sm">Add a server</p>
      </TooltipContent>
    </Tooltip>
  );
};
