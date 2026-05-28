"use client";

import { Fragment, useRef, ElementRef } from "react";
import { format } from "date-fns";
import { Member } from "@prisma/client";
import { Loader2, ServerCrash } from "lucide-react";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useChatRoom } from "@/hooks/use-chat-room";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "channel" | "conversation";
}

const mutationApiUrl = (type: "channel" | "conversation") =>
  type === "channel" ? "/api/messages" : "/api/direct-messages";

export const ChatMessages = ({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl,
      paramKey,
      paramValue,
    });

  useChatRoom(chatId, type);
  useChatSocket({ queryKey, addKey, updateKey });
  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });
  const { label: typingLabel } = useTypingIndicator(chatId);

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-400">Loading messages...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-xs text-zinc-400">Something went wrong!</p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto">
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && <ChatWelcome type={type} name={name} />}
      {hasNextPage && (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-zinc-400 hover:text-zinc-300 text-xs my-4 transition"
            >
              Load previous messages
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((group: any, i: number) => (
          <Fragment key={i}>
            {(Array.isArray(group?.items) ? group.items : []).map((message: any) => (
              <ChatItem
                key={message.id}
                id={message.id}
                chatId={chatId}
                type={type}
                currentMember={member}
                member={
                  type === "channel"
                    ? message.member
                    : {
                        ...member,
                        user: message.user,
                      }
                }
                content={message.content}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                isUpdated={message.updatedAt !== message.createdAt}
                mutationApiUrl={mutationApiUrl(type)}
                socketQuery={socketQuery}
                parentMessage={message.parentMessage}
                reactions={message.reactions}
                isPinned={message.isPinned}
              />
            ))}
          </Fragment>
        ))}
      </div>
      {typingLabel ? (
        <div
          className={`
            sticky bottom-0
            px-4 py-2
            text-xs text-zinc-400
            select-none pointer-events-none
            bg-zinc-900/60 backdrop-blur
            border-t border-zinc-800/60
          `}
        >
          {typingLabel}
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
};
