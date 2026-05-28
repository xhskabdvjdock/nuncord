export default function ChannelLoading() {
  return (
    <div className="surface-chat flex flex-col h-full">
      <div className="h-12 border-b border-zinc-800/80 px-3 flex items-center">
        <div className="h-4 w-4 rounded bg-zinc-700/70 mr-2" />
        <div className="h-4 w-40 rounded bg-zinc-700/70" />
        <div className="ml-auto h-6 w-24 rounded bg-zinc-700/50" />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-zinc-800/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-zinc-800/60" />
                <div className="h-3 w-full max-w-[520px] rounded bg-zinc-800/50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pb-6">
        <div className="h-12 rounded-md bg-zinc-800/60" />
      </div>
    </div>
  );
}

