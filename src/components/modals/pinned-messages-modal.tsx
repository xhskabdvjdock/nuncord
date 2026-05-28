"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Pin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";

type PinnedItem = {
  id: string;
  content: string;
  createdAt: string;
  member: { user: { name: string } };
};

export const PinnedMessagesModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "pinnedMessages";
  const [items, setItems] = useState<PinnedItem[]>([]);

  useEffect(() => {
    if (!isModalOpen) return;
    const channelId = data.query?.channelId;
    const serverId = data.query?.serverId;
    if (!channelId || !serverId) return;
    axios
      .get(`/api/channels/${channelId}/pins`, { params: { serverId } })
      .then((res) => setItems(res.data.items ?? []))
      .catch(() => setItems([]));
  }, [isModalOpen, data.query?.channelId, data.query?.serverId]);

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1f2125] text-white border border-zinc-700 max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-indigo-300" />
            Pinned Messages
          </DialogTitle>
          <DialogDescription>
            {items.length} pinned message{items.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] overflow-y-auto space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-zinc-700 bg-zinc-900/50 p-3">
              <p className="text-xs text-zinc-500 mb-1">
                {item.member.user.name} • {format(new Date(item.createdAt), "PPPp")}
              </p>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{item.content}</p>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No pinned messages yet.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

