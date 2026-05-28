"use client";

import dynamic from "next/dynamic";

// Dynamically load to keep initial bundle light.
const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export function EmojiPicker({
  onEmojiClick,
}: {
  onEmojiClick: (emoji: string) => void;
}) {
  return (
    <div className="max-h-[360px] overflow-auto">
      <Picker
        onEmojiClick={(data: { emoji: string }) => onEmojiClick(data.emoji)}
        searchDisabled={false}
        skinTonesDisabled={false}
        lazyLoadEmojis
        previewConfig={{ showPreview: false }}
        height={360}
        width="100%"
      />
    </div>
  );
}

