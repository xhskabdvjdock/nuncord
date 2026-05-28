import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MarkConversationRead } from "@/components/dm/mark-conversation-read";

interface DmConversationPageProps {
  params: Promise<{ memberId: string }>;
}

const DmConversationPage = async ({ params }: DmConversationPageProps) => {
  const user = await currentUser();
  const { memberId } = await params;

  if (!user) {
    return redirect("/sign-in");
  }

  const otherMember = await db.member.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!otherMember) {
    return redirect("/dms");
  }

  const currentMember = await db.member.findFirst({
    where: {
      userId: user.id,
      serverId: otherMember.serverId,
    },
    include: { user: true },
  });

  if (!currentMember) {
    return redirect("/dms");
  }

  const conversation = await getOrCreateConversation(currentMember.id, otherMember.id);

  if (!conversation) {
    return redirect("/dms");
  }

  return (
    <div className="surface-chat flex flex-col h-full">
      <MarkConversationRead
        conversationId={conversation.id}
        memberId={memberId}
      />
      <ChatHeader
        serverId={otherMember.serverId}
        name={otherMember.user.name}
        type="conversation"
        imageUrl={otherMember.user.imageUrl || ""}
        presenceStatus={otherMember.user.status}
        presenceText={otherMember.user.statusText}
      />
      <ChatMessages
        member={currentMember}
        name={otherMember.user.name}
        chatId={conversation.id}
        type="conversation"
        apiUrl="/api/direct-messages"
        socketUrl="/api/socket/direct-messages"
        socketQuery={{ conversationId: conversation.id }}
        paramKey="conversationId"
        paramValue={conversation.id}
      />
      <ChatInput
        name={otherMember.user.name}
        type="conversation"
        chatId={conversation.id}
        member={currentMember}
        user={user}
        dmTargetUserId={otherMember.user.id}
        apiUrl="/api/socket/direct-messages"
        query={{ conversationId: conversation.id }}
      />
    </div>
  );
};

export default DmConversationPage;
