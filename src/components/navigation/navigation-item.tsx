"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavigationItemProps {
  id: string;
  imageUrl: string;
  name: string;
}

export const NavigationItem = ({ id, imageUrl, name }: NavigationItemProps) => {
  const params = useParams();
  const isActive = params?.serverId === id;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/servers/${id}`}
          prefetch
          scroll={false}
          className="group relative flex items-center focus-visible:ring-0"
        >
          <div
            className={cn(
              "absolute left-0 bg-white/90 rounded-r-full transition-all w-[4px]",
              params?.serverId !== id && "group-hover:h-[20px]",
              isActive ? "h-[36px]" : "h-[8px]"
            )}
          />
          <div
            className={cn(
              "relative group flex mx-3 h-[48px] w-[48px] rounded-[24px] overflow-hidden",
              "transition-all duration-200",
              "bg-zinc-800/70 hover:bg-zinc-700/70",
              "group-hover:rounded-[16px] group-hover:shadow-[0_10px_22px_rgba(0,0,0,0.35)]",
              isActive && "rounded-[16px] ring-2 ring-indigo-500/35 bg-indigo-500/10"
            )}
          >
            {imageUrl ? (
              <Image fill src={imageUrl} alt={name} sizes="48px" className="object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-indigo-500 text-white font-semibold text-lg">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <p className="font-semibold text-sm capitalize">{name}</p>
      </TooltipContent>
    </Tooltip>
  );
};
