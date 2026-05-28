"use client";

import * as z from "zod";
import qs from "query-string";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { appendChatMessage } from "@/lib/chat-cache";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";

const formSchema = z.object({
  fileUrl: z.string().min(1, { message: "File URL is required." }),
});

export const MessageFileModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isModalOpen = isOpen && type === "messageFile";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { fileUrl: "" },
  });

  const isLoading = form.formState.isSubmitting || isUploading;

  const sendMessage = async (fileUrl: string) => {
    const url = qs.stringifyUrl({
      url: data.apiUrl || "",
      query: data.query,
    });

    const response = await axios.post(url, {
      fileUrl,
      content: fileUrl,
    });

    if (data.chatId) {
      appendChatMessage(queryClient, `chat:${data.chatId}`, response.data);
    }

    if (socket && data.query) {
      if (data.query.channelId) {
        socket.emit("chat:message:send", {
          channelId: data.query.channelId,
          message: response.data,
        });
      }
      if (data.query.conversationId) {
        socket.emit("chat:dm:send", {
          conversationId: data.query.conversationId,
          message: response.data,
        });
      }
    }

    form.reset();
    handleClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await sendMessage(values.fileUrl);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await sendMessage(uploadResponse.data.url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#313338] text-white p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold text-zinc-100">
            Add an attachment
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Upload a file or paste a URL
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6 px-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileUp className="h-4 w-4 mr-2" />
                )}
                Upload from device
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#313338] px-2 text-zinc-500">or</span>
                </div>
              </div>
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="https://example.com/file.png"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-[#2b2d31] px-6 py-4">
              <Button variant="primary" disabled={isLoading} type="submit">
                Send URL
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
