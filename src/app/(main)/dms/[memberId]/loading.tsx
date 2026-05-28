const DmConversationLoading = () => {
  return (
    <div className="surface-chat h-full flex flex-col">
      <div className="h-12 border-b border-zinc-800/70 bg-zinc-900/20 animate-pulse" />
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-zinc-800/70" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 rounded bg-zinc-800/70" />
              <div className="h-3 w-full max-w-md rounded bg-zinc-800/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DmConversationLoading;
