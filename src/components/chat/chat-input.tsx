"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SendHorizonal, X } from "lucide-react";
import { Member, User } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { appendChatMessage, removeOptimisticMessage } from "@/lib/chat-cache";
import { useReplyStore } from "@/hooks/use-reply-store";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, string>;
  name: string;
  type: "channel" | "conversation";
  chatId: string;
  member: Member;
  user: User;
  dmTargetUserId?: string;
}

const formSchema = z.object({
  content: z.string().min(1),
});

const SLASH_COMMANDS = [
  "/help",
  "/kick @username",
  "/mute @username [minutes]",
  "/unmute @username",
  "/timeout @username [minutes]",
  "/ban @username",
  "/unban @username",
  "/warn @username [reason]",
  "/clear [count]",
  "/lock",
  "/unlock",
  "/role add @username @role:RoleName",
  "/role remove @username @role:RoleName",
];

export const ChatInput = ({
  apiUrl,
  query,
  name,
  type,
  chatId,
  member,
  user,
  dmTargetUserId,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const { socket } = useSocket();
  const routeParams = useParams();
  const queryClient = useQueryClient();
  const queryKey = `chat:${chatId}`;
  const draftKey = `discord-clone:draft:${chatId}`;
  const typingStopTimeoutRef = useRef<number | null>(null);
  const { target, clearTarget } = useReplyStore();
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [memberUserIdByName, setMemberUserIdByName] = useState<Record<string, string>>(
    {}
  );
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  const typingPayload = useMemo(() => {
    if (type === "channel") {
      return { channelId: query.channelId, user: user.name };
    }
    return { conversationId: query.conversationId, user: user.name };
  }, [query.channelId, query.conversationId, type, user.name]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  });
  const contentValue = form.watch("content");

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    const savedDraft =
      typeof window !== "undefined" ? localStorage.getItem(draftKey) : null;
    if (savedDraft) {
      form.setValue("content", savedDraft);
    }
  }, [draftKey, form]);

  useEffect(() => {
    if (type !== "channel" || !query.serverId) return;
    let cancelled = false;
    const loadMentionsData = async () => {
      try {
        const [membersRes, rolesRes] = await Promise.all([
          axios.get(`/api/servers/${query.serverId}/members/presence`),
          axios.get(`/api/servers/${query.serverId}/roles`),
        ]);
        if (cancelled) return;
        const members = Array.isArray(membersRes.data?.members) ? membersRes.data.members : [];
        const roles = Array.isArray(rolesRes.data?.items) ? rolesRes.data.items : [];
        const nameToId: Record<string, string> = {};
        const names: string[] = [];
        for (const m of members) {
          const memberName = m?.user?.name;
          const memberUserId = m?.user?.id;
          if (typeof memberName === "string" && typeof memberUserId === "string") {
            nameToId[memberName.toLowerCase()] = memberUserId;
            names.push(memberName);
          }
        }
        setMemberUserIdByName(nameToId);
        setMemberNames(Array.from(new Set(names)));
        setRoleNames(
          Array.from(
            new Set(
              roles
                .map((r: any) => r?.name)
                .filter((n: unknown): n is string => typeof n === "string" && n.trim().length > 0)
            )
          )
        );
      } catch {
        if (!cancelled) {
          setMemberNames([]);
          setRoleNames([]);
        }
      }
    };
    void loadMentionsData();
    return () => {
      cancelled = true;
    };
  }, [type, query.serverId]);

  const activeToken = useMemo(() => {
    const text = contentValue || "";
    const match = text.match(/(^|\s)([@/][^\s]*)$/);
    if (!match) return null;
    const token = match[2];
    const start = text.length - token.length;
    return { token, start };
  }, [contentValue]);

  const autocompleteItems = useMemo(() => {
    if (!activeToken) return [];
    const token = activeToken.token.toLowerCase();
    if (token.startsWith("/")) {
      return SLASH_COMMANDS.filter((cmd) => cmd.toLowerCase().startsWith(token));
    }
    if (token.startsWith("@")) {
      const q = token.slice(1);
      const base = ["@everyone", "@here"];
      const users = memberNames.map((n) => `@${n}`);
      const roles = roleNames.map((n) => `@role:${n}`);
      return [...base, ...users, ...roles].filter((item) =>
        item.toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeToken, memberNames, roleNames]);

  useEffect(() => {
    setIsAutocompleteOpen(autocompleteItems.length > 0);
  }, [autocompleteItems.length]);

  const parseMentionUserIds = (content: string) => {
    const lower = content.toLowerCase();
    if (lower.includes("@everyone") || lower.includes("@here")) {
      return ["__broadcast__"];
    }
    const ids = new Set<string>();
    for (const memberName of memberNames) {
      const pattern = new RegExp(
        `@${memberName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      if (pattern.test(content)) {
        const id = memberUserIdByName[memberName.toLowerCase()];
        if (id) ids.add(id);
      }
    }
    return [...ids];
  };

  const emitMessage = (message: unknown, content: string) => {
    if (!socket) return;

    if (type === "channel" && query.channelId) {
      const mentionTokens = parseMentionUserIds(content);
      socket.emit("chat:message:send", {
        channelId: query.channelId,
        serverId: query.serverId,
        fromUserId: user.id,
        mentionUserIds: mentionTokens,
        message,
      });
    }
    if (type === "conversation" && query.conversationId && dmTargetUserId) {
      const targetMemberId =
        typeof routeParams?.memberId === "string" ? routeParams.memberId : "";
      const mentionPattern = new RegExp(
        `@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      socket.emit("chat:dm:send", {
        conversationId: query.conversationId,
        message,
        fromUserId: user.id,
        targetUserId: dmTargetUserId,
        targetMemberId,
        mention: mentionPattern.test(content),
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const content = values.content.trim();
    if (!content) return;
    const isSlashCommand = type === "channel" && content.startsWith("/");

    const optimisticId = `optimistic-${Date.now()}`;
    const now = new Date().toISOString();

    const optimisticMessage =
      type === "channel"
        ? {
            id: optimisticId,
            content,
            fileUrl: null,
            deleted: false,
            createdAt: now,
            updatedAt: now,
            memberId: member.id,
            channelId: query.channelId,
            member: { ...member, user },
            parentMessage: target
              ? {
                  id: target.id,
                  content: target.content,
                  member: { user: { name: target.authorName } },
                }
              : null,
            reactions: [],
          }
        : {
            id: optimisticId,
            content,
            fileUrl: null,
            deleted: false,
            createdAt: now,
            updatedAt: now,
            userId: user.id,
            conversationId: query.conversationId,
            user,
            reactions: [],
          };

    const optimisticBotId = `optimistic-bot-${Date.now()}`;
    const optimisticBotMessage =
      type === "channel"
        ? {
            id: optimisticBotId,
            content: "ℹ️ [nunBOT] Processing command...",
            fileUrl: null,
            deleted: false,
            createdAt: now,
            updatedAt: now,
            memberId: member.id,
            channelId: query.channelId,
            member: {
              ...member,
              user: {
                ...user,
                name: "nunBOT",
              },
            },
            parentMessage: null,
            reactions: [],
          }
        : null;

    if (!isSlashCommand) {
      appendChatMessage(queryClient, queryKey, optimisticMessage);
    } else if (optimisticBotMessage) {
      appendChatMessage(queryClient, queryKey, optimisticBotMessage);
    }
    form.reset();
    setIsAutocompleteOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(draftKey);
    }

    try {
      const url = qs.stringifyUrl({ url: apiUrl, query });
      const response = await axios.post(url, {
        content,
        parentMessageId: target?.id,
      });

      if (!isSlashCommand) {
        removeOptimisticMessage(queryClient, queryKey, optimisticId);
      } else {
        removeOptimisticMessage(queryClient, queryKey, optimisticBotId);
      }
      appendChatMessage(queryClient, queryKey, response.data);
      emitMessage(response.data, content);
      if (type === "conversation" && typeof routeParams?.memberId === "string") {
        const preview =
          content.length > 48 ? `${content.slice(0, 48)}…` : content;
        window.dispatchEvent(
          new CustomEvent("dm:sent", {
            detail: {
              memberId: routeParams.memberId,
              preview: `You: ${preview}`,
            },
          })
        );
      }
      clearTarget();
    } catch (error) {
      if (!isSlashCommand) {
        removeOptimisticMessage(queryClient, queryKey, optimisticId);
      } else {
        removeOptimisticMessage(queryClient, queryKey, optimisticBotId);
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (!status || status >= 500) {
          console.error(error);
        }
      } else {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingStopTimeoutRef.current) {
        window.clearTimeout(typingStopTimeoutRef.current);
        typingStopTimeoutRef.current = null;
      }
    };
  }, []);

  const applyAutocomplete = (value: string) => {
    if (!activeToken) return;
    const text = contentValue || "";
    const next = `${text.slice(0, activeToken.start)}${value} `;
    form.setValue("content", next, { shouldDirty: true });
    if (typeof window !== "undefined") {
      localStorage.setItem(draftKey, next);
    }
    setIsAutocompleteOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="p-4 pb-6">
                  {target && (
                    <div className="mb-2 rounded-md border border-zinc-700/70 bg-zinc-800/50 px-3 py-2 flex items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] text-indigo-300">
                          Replying to {target.authorName}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {target.content}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ml-auto text-zinc-400 hover:text-zinc-200"
                        onClick={clearTarget}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen("messageFile", { apiUrl, query, chatId, member, user })
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-[26px] w-[26px] bg-zinc-800/80 hover:bg-zinc-700/80 transition rounded-full p-1 flex items-center justify-center border border-zinc-700/70 focus-visible:ring-0"
                    >
                      <Plus className="text-zinc-200" />
                    </button>
                    <Input
                      disabled={isLoading}
                      className="pl-12 pr-12 py-6 bg-zinc-900/40 border border-zinc-800/80 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-100 placeholder:text-zinc-500"
                      placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                      {...field}
                      autoComplete="off"
                      onChange={(e) => {
                        field.onChange(e);
                        if (typeof window !== "undefined") {
                          localStorage.setItem(draftKey, e.target.value);
                        }
                        if (!socket) return;
                        socket.emit("typing:start", typingPayload);
                        if (typingStopTimeoutRef.current) {
                          window.clearTimeout(typingStopTimeoutRef.current);
                        }
                        typingStopTimeoutRef.current = window.setTimeout(() => {
                          socket.emit("typing:stop", typingPayload);
                        }, 1200);
                      }}
                      onKeyDown={(e) => {
                        if (isAutocompleteOpen && autocompleteItems.length > 0) {
                          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                            e.preventDefault();
                          }
                          if (e.key === "Tab") {
                            e.preventDefault();
                            applyAutocomplete(autocompleteItems[0]);
                            return;
                          }
                        }
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                    {isAutocompleteOpen ? (
                      <div className="absolute left-0 right-0 bottom-[54px] z-30 rounded-md border border-zinc-800 bg-zinc-950/95 shadow-xl p-1 max-h-44 overflow-y-auto">
                        {autocompleteItems.slice(0, 8).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => applyAutocomplete(item)}
                            className="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800/70 transition"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-[26px] w-[26px] bg-indigo-500 hover:bg-indigo-600 transition rounded-full p-1 flex items-center justify-center disabled:opacity-50 shadow-[0_10px_20px_rgba(0,0,0,0.35)] focus-visible:ring-0"
                    >
                      <SendHorizonal className="text-white w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Use @ to mention members/roles • / for commands</span>
                    <span>Enter to send • Shift+Enter new line</span>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
