import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChannelType } from "@prisma/client";
import { MediaRoom } from "@/components/media-room";
import { ChannelMembersPanel } from "@/components/chat/channel-members-panel";
import { MarkChannelRead } from "@/components/chat/mark-channel-read";

interface ChannelPageProps {
  params: Promise<{ serverId: string; channelId: string }>;
}

const ChannelPage = async ({ params }: ChannelPageProps) => {
  const user = await currentUser();
  const { serverId, channelId } = await params;

  if (!user) {
    return redirect("/sign-in");
  }

  const channel = await db.channel.findUnique({
    where: { id: channelId },
  });

  const member = await db.member.findFirst({
    where: { serverId, userId: user.id },
    include: { user: true },
  });

  const members = await db.member.findMany({
    where: { serverId },
    orderBy: { role: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          status: true,
          statusText: true,
          lastActiveAt: true,
          bio: true,
          bannerUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!channel || !member) {
    redirect("/");
  }

  const onlineCount = members.filter((m) => m.user.status !== "OFFLINE").length;

  return (
    <div className="surface-chat flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          serverId={serverId}
          channelId={channel.id}
          name={channel.name}
          type="channel"
          memberCount={members.length}
          onlineCount={onlineCount}
        />
        {channel.type === ChannelType.TEXT && (
          <>
            <MarkChannelRead channelId={channel.id} />
            <ChatMessages
              member={member}
              name={channel.name}
              chatId={channel.id}
              type="channel"
              apiUrl="/api/messages"
              socketUrl="/api/socket/messages"
              socketQuery={{ channelId: channel.id, serverId }}
              paramKey="channelId"
              paramValue={channel.id}
            />
            <ChatInput
              name={channel.name}
              type="channel"
              chatId={channel.id}
              member={member}
              user={user}
              apiUrl="/api/socket/messages"
              query={{ channelId: channel.id, serverId }}
            />
          </>
        )}
        {channel.type === ChannelType.AUDIO && (
          <MediaRoom
            chatId={channel.id}
            userId={user.id}
            username={user.name}
            userImageUrl={user.imageUrl || ""}
            video={false}
            audio={true}
          />
        )}
        {channel.type === ChannelType.VIDEO && (
          <MediaRoom
            chatId={channel.id}
            userId={user.id}
            username={user.name}
            userImageUrl={user.imageUrl || ""}
            video={true}
            audio={true}
          />
        )}
      </div>
      {channel.type === ChannelType.TEXT && (
        <ChannelMembersPanel serverId={serverId} members={members} />
      )}
    </div>
  );
};

export default ChannelPage;
