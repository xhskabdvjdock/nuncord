"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member, MemberRole, User } from "@prisma/client";
import {
  Check,
  Copy,
  Edit,
  FileIcon,
  MessageSquareReply,
  Pin,
  Smile,
  ShieldAlert,
  ShieldCheck,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/socket-provider";
import { updateChatMessage } from "@/lib/chat-cache";
import { UserAvatar } from "@/components/user-avatar";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as Popover from "@radix-ui/react-popover";
import { EmojiPicker } from "@/components/emoji-picker";
import { useModal } from "@/hooks/use-modal-store";
import { useReplyStore } from "@/hooks/use-reply-store";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
]);

function normalizeFileUrl(fileUrl: string) {
  // If we stored an absolute URL to localhost, normalize to a relative URL
  // so Next/Image doesn't treat it as a remote/private-ip upstream.
  try {
    const url = new URL(fileUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Not an absolute URL, keep as-is.
  }
  return fileUrl;
}

interface ChatItemProps {
  id: string;
  chatId: string;
  type: "channel" | "conversation";
  content: string;
  member: Member & { user: User };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  mutationApiUrl: string;
  socketQuery: Record<string, string>;
  parentMessage?: {
    id: string;
    content: string;
    member?: { user?: { name?: string } };
  } | null;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
  isPinned?: boolean;
}

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatItem = ({
  id,
  chatId,
  type,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  mutationApiUrl,
  socketQuery,
  parentMessage,
  reactions = [],
  isPinned = false,
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const { onOpen } = useModal();
  const { setTarget } = useReplyStore();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const queryKey = `chat:${chatId}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content },
  });

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    form.reset({ content });
  }, [content, form]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${mutationApiUrl}/${id}`,
        query: socketQuery,
      });
      const response = await axios.patch(url, values);
      updateChatMessage(queryClient, queryKey, response.data);

      if (socket) {
        if (type === "channel" && socketQuery.channelId) {
          socket.emit("chat:message:update", {
            channelId: socketQuery.channelId,
            message: response.data,
          });
        }
        if (type === "conversation" && socketQuery.conversationId) {
          socket.emit("chat:dm:update", {
            conversationId: socketQuery.conversationId,
            message: response.data,
          });
        }
      }

      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fileType = fileUrl?.split(".").pop();
  const normalizedFileUrl = fileUrl ? normalizeFileUrl(fileUrl) : null;
  const fileExt = fileType?.toLowerCase();
  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner =
    type === "channel"
      ? currentMember.id === member.id
      : currentMember.userId === member.userId;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const canReact = type === "channel" && !!socketQuery.serverId && !!socketQuery.channelId;
  const isPDF = fileExt === "pdf" && !!fileUrl;
  const isImage = !!fileExt && IMAGE_EXTENSIONS.has(fileExt) && !!fileUrl;
  const isOtherFile = !!fileUrl && !isPDF && !isImage;
  const canCopyMessage = !deleted && (!!content || !!fileUrl);
  const canReply = !deleted && !fileUrl;
  const canPin = type === "channel" && (isAdmin || isModerator);
  const groupedReactions = reactions.reduce<Record<string, { count: number; active: boolean }>>(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { count: 0, active: false };
      }
      acc[reaction.emoji].count += 1;
      if (reaction.userId === currentMember.userId) {
        acc[reaction.emoji].active = true;
      }
      return acc;
    },
    {}
  );
  const isNunBotMessage = member.user.name === "nunBOT";
  const nunBotMatch = content.match(/^([ℹ️✅⚠️]) \[nunBOT\]\s*(.*)$/);
  const nunBotTone = nunBotMatch?.[1];
  const nunBotInlineBody = nunBotMatch?.[2] || "";
  const isNunBotHelp = content.startsWith("### [nunBOT] Command Center");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalizedFileUrl || content);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1200);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      const response = await axios.post(
        `/api/messages/${id}/reactions`,
        {
          emoji,
          serverId: socketQuery.serverId,
          channelId: socketQuery.channelId,
        }
      );

      updateChatMessage(queryClient, queryKey, response.data);
      if (socket && socketQuery.channelId) {
        socket.emit("chat:message:update", {
          channelId: socketQuery.channelId,
          message: response.data,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openUserProfile = () => {
    onOpen("userProfile", {
      profileUser: member.user,
      profileServerId: socketQuery.serverId,
      profileMemberId: member.id,
    });
  };

  const handlePinToggle = async () => {
    if (!socketQuery.serverId || !socketQuery.channelId) return;
    try {
      const response = await axios.patch(
        `/api/messages/${id}/pin?serverId=${socketQuery.serverId}&channelId=${socketQuery.channelId}`,
        { pin: !isPinned }
      );
      updateChatMessage(queryClient, queryKey, response.data);
      if (socket && socketQuery.channelId) {
        socket.emit("chat:message:update", {
          channelId: socketQuery.channelId,
          message: response.data,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full chat-message">
      <div className="group flex gap-x-2 items-start w-full">
        <button
          type="button"
          onClick={openUserProfile}
          className="cursor-pointer hover:drop-shadow-md transition"
        >
          <UserAvatar
            src={member.user.imageUrl || ""}
            name={member.user.name}
          />
        </button>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <button
                type="button"
                onClick={openUserProfile}
                className="font-semibold text-sm hover:underline cursor-pointer text-zinc-200"
              >
                {member.user.name}
              </button>
              {roleIconMap[member.role]}
            </div>
            <span className="text-xs text-zinc-500">{timestamp}</span>
          </div>
          {isImage && (
            <a
              href={normalizedFileUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-zinc-800 h-48 w-48"
            >
              <Image
                src={normalizedFileUrl || ""}
                alt={content}
                fill
                className="object-cover"
                sizes="192px"
              />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-zinc-800/50">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={normalizedFileUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-400 hover:underline"
              >
                PDF File
              </a>
            </div>
          )}
          {isOtherFile && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-zinc-800/50">
              <FileIcon className="h-10 w-10 fill-zinc-200/40 stroke-zinc-300" />
              <a
                href={normalizedFileUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-400 hover:underline break-all"
              >
                Download file{fileExt ? ` (.${fileExt})` : ""}
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <>
              {parentMessage ? (
                <div className="mb-1 text-xs text-zinc-500 border-l-2 border-zinc-700 pl-2">
                  Replying to {parentMessage.member?.user?.name || "User"}:{" "}
                  <span className="text-zinc-400">{parentMessage.content}</span>
                </div>
              ) : null}
              {(isNunBotHelp || (isNunBotMessage && nunBotMatch)) && !deleted ? (
                <div className="mt-1">
                  {isPinned ? (
                    <span className="inline-flex items-center gap-1 mb-1 text-[10px] uppercase tracking-wide text-indigo-300">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  ) : null}
                  {isNunBotHelp ? (
                    <div className="max-w-[640px] rounded-md border border-indigo-500/30 bg-zinc-900/70 overflow-hidden">
                      <div className="px-3 py-2 bg-indigo-500/10 border-b border-indigo-500/20 text-[11px] uppercase tracking-wide text-indigo-200 font-semibold">
                        nunBOT Embed
                      </div>
                      <div className="p-3 border-l-4 border-indigo-400">
                        <div className="prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[640px] rounded-md border bg-zinc-900/70 p-3 border-l-4",
                        nunBotTone === "✅" &&
                          "border-emerald-500/30 border-l-emerald-400",
                        nunBotTone === "⚠️" &&
                          "border-amber-500/30 border-l-amber-400",
                        nunBotTone === "ℹ️" &&
                          "border-sky-500/30 border-l-sky-400"
                      )}
                    >
                      <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-semibold">
                        nunBOT
                      </p>
                      <p className="text-sm text-zinc-200 mt-1">{nunBotInlineBody}</p>
                    </div>
                  )}
                  {isUpdated && (
                    <span className="text-[10px] mt-1 inline-block text-zinc-500">(edited)</span>
                  )}
                </div>
              ) : (
                <p
                  className={cn(
                    "text-sm text-zinc-300",
                    deleted && "italic text-zinc-500 text-xs mt-1"
                  )}
                >
                  {isPinned ? (
                    <span className="inline-flex items-center gap-1 mr-2 text-[10px] uppercase tracking-wide text-indigo-300">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  ) : null}
                  {content}
                  {isUpdated && !deleted && (
                    <span className="text-[10px] mx-2 text-zinc-500">(edited)</span>
                  )}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {canReact &&
                  Object.entries(groupedReactions).map(([emoji, value]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs border transition",
                      value.active
                        ? "bg-indigo-500/20 border-indigo-400/60 text-indigo-200"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-700/60"
                    )}
                  >
                    {emoji} {value.count}
                  </button>
                ))}
              </div>
            </>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-center w-full gap-x-2 pt-2"
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            className="p-2 bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-200"
                            placeholder="Edited message"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button disabled={isLoading} size="sm" variant="primary">
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-500">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
      {(canDeleteMessage || canCopyMessage || canReply || canReact || canPin) && (
        <div
          className={cn(
            "flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-zinc-800 border border-zinc-700 rounded-sm transition",
            "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
            isReactionPickerOpen && "opacity-100 pointer-events-auto"
          )}
        >
          {canReact && (
            <Popover.Root
              open={isReactionPickerOpen}
              onOpenChange={setIsReactionPickerOpen}
            >
              <Popover.Trigger asChild>
                <button
                  className="p-1 hover:bg-zinc-700 rounded-sm transition"
                  title="Add reaction"
                >
                  <Smile className="w-4 h-4 text-zinc-400 hover:text-zinc-300" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  avoidCollisions
                  collisionPadding={12}
                  className="z-50 w-[320px] rounded-md border border-zinc-700 bg-zinc-900 shadow-xl p-2"
                >
                  <EmojiPicker onEmojiClick={handleReact} />
                  <Popover.Arrow className="fill-zinc-900" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
          {canReply && (
            <button
              onClick={() =>
                setTarget({
                  id,
                  content,
                  authorName: member.user.name,
                })
              }
              className="p-1 hover:bg-zinc-700 rounded-sm transition"
              title="Reply"
            >
              <MessageSquareReply className="w-4 h-4 text-zinc-400 hover:text-zinc-300" />
            </button>
          )}
          {canCopyMessage && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-zinc-700 rounded-sm transition"
              title="Copy message"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400 hover:text-zinc-300" />
              )}
            </button>
          )}
          {canEditMessage && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-zinc-700 rounded-sm transition"
            >
              <Edit className="w-4 h-4 text-zinc-400 hover:text-zinc-300" />
            </button>
          )}
          {canPin && (
            <button
              onClick={handlePinToggle}
              className="p-1 hover:bg-zinc-700 rounded-sm transition"
              title={isPinned ? "Unpin message" : "Pin message"}
            >
              <Pin
                className={cn(
                  "w-4 h-4",
                  isPinned ? "text-indigo-300" : "text-zinc-400 hover:text-zinc-300"
                )}
              />
            </button>
          )}
          <button
            onClick={() =>
              onOpen("deleteMessage", {
                apiUrl: `${mutationApiUrl}/${id}`,
                query: socketQuery,
                chatId,
                chatType: type,
              })
            }
            className="p-1 hover:bg-zinc-700 rounded-sm transition"
          >
            <Trash className="w-4 h-4 text-zinc-400 hover:text-zinc-300" />
          </button>
        </div>
      )}
    </div>
  );
};
