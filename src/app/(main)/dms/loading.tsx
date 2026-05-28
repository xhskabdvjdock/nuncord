const DmsLoading = () => {
  return (
    <div className="surface-chat h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
        <p className="text-sm text-zinc-500">Loading direct messages...</p>
      </div>
    </div>
  );
};

export default DmsLoading;
