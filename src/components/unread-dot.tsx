import { cn } from "@/lib/utils";

interface UnreadDotProps {
  mention?: boolean;
  className?: string;
}

export const UnreadDot = ({ mention, className }: UnreadDotProps) => {
  if (!mention) {
    return (
      <span
        className={cn(
          "ml-auto h-2 w-2 shrink-0 rounded-full bg-zinc-300/90",
          className
        )}
        aria-label="Unread messages"
      />
    );
  }

  return (
    <span
      className={cn(
        "ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 ring-2 ring-rose-500/25",
        className
      )}
      aria-label="Unread mention"
    />
  );
};
