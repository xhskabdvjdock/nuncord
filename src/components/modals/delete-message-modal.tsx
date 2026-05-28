"use client";

import qs from "query-string";
import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";
import { updateChatMessage } from "@/lib/chat-cache";

export const DeleteMessageModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const isModalOpen = isOpen && type === "deleteMessage";
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      const url = qs.stringifyUrl({
        url: data.apiUrl || "",
        query: data.query,
      });
      const response = await axios.delete(url);

      if (data.chatId) {
        updateChatMessage(queryClient, `chat:${data.chatId}`, response.data);
      }

      if (socket && data.query) {
        if (data.chatType === "channel" && data.query.channelId) {
          socket.emit("chat:message:update", {
            channelId: data.query.channelId,
            message: response.data,
          });
        }
        if (data.chatType === "conversation" && data.query.conversationId) {
          socket.emit("chat:dm:update", {
            conversationId: data.query.conversationId,
            message: response.data,
          });
        }
      }

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold text-zinc-100">
            Delete Message
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Are you sure you want to do this? <br />
            The message will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-[#2b2d31] px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button disabled={isLoading} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button disabled={isLoading} variant="destructive" onClick={onClick}>
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
