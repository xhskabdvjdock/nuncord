import { Hash } from "lucide-react";

interface ChatWelcomeProps {
  name: string;
  type: "channel" | "conversation";
}

export const ChatWelcome = ({ name, type }: ChatWelcomeProps) => {
  return (
    <div className="space-y-3 px-4 mb-4">
      {type === "channel" && (
        <div className="h-[80px] w-[80px] rounded-2xl bg-zinc-700/70 border border-zinc-600/60 flex items-center justify-center">
          <Hash className="h-12 w-12 text-white" />
        </div>
      )}
      <p className="text-xl md:text-3xl font-bold text-zinc-100">
        {type === "channel" ? `Welcome to #${name}` : `${name}`}
      </p>
      <p className="text-zinc-400 text-sm">
        {type === "channel"
          ? `This is the start of the #${name} channel.`
          : `This is the start of your conversation with ${name}`}
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
        <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
          Tip: Press Enter to send
        </span>
        {type === "channel" ? (
          <>
            <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
              Tip: @mention members
            </span>
            <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
              Tip: Pin key messages
            </span>
          </>
        ) : (
          <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
            Tip: Ctrl+K to find friends
          </span>
        )}
      </div>
    </div>
  );
};
