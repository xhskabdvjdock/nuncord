import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type DmFriend = {
  memberId: string;
  userId: string;
  userName: string;
  imageUrl: string | null;
  status: UserStatus;
  statusText: string | null;
  sharedServerName: string;
  conversationId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

function previewMessage(content: string, fileUrl?: string | null) {
  const text = content?.trim();
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text;
  if (fileUrl) return "Sent an attachment";
  return null;
}

async function getFriendConversationMeta(
  userId: string,
  friendMemberId: string
) {
  const otherMember = await db.member.findUnique({
    where: { id: friendMemberId },
    select: { serverId: true },
  });
  if (!otherMember) return null;

  const myMember = await db.member.findFirst({
    where: { userId, serverId: otherMember.serverId },
    select: { id: true },
  });
  if (!myMember) return null;

  const conversation = await db.conversation.findFirst({
    where: {
      OR: [
        { memberOneId: myMember.id, memberTwoId: friendMemberId },
        { memberOneId: friendMemberId, memberTwoId: myMember.id },
      ],
    },
    select: { id: true },
  });
  if (!conversation) return null;

  const lastMessage = await db.directMessage.findFirst({
    where: { conversationId: conversation.id, deleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      content: true,
      fileUrl: true,
      createdAt: true,
      userId: true,
    },
  });

  if (!lastMessage) {
    return {
      conversationId: conversation.id,
      lastMessageAt: null,
      lastMessagePreview: null,
    };
  }

  const fromSelf = lastMessage.userId === userId;
  const preview = previewMessage(lastMessage.content, lastMessage.fileUrl);

  return {
    conversationId: conversation.id,
    lastMessageAt: lastMessage.createdAt.toISOString(),
    lastMessagePreview: preview
      ? fromSelf
        ? `You: ${preview}`
        : preview
      : null,
  };
}

export async function getDmFriends(userId: string): Promise<DmFriend[]> {
  const members = await db.member.findMany({
    where: {
      userId: { not: userId },
      server: {
        members: {
          some: { userId },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    distinct: ["userId"],
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
          imageUrl: true,
          status: true,
          statusText: true,
        },
      },
      server: {
        select: {
          name: true,
        },
      },
    },
    take: 100,
  });

  const items: DmFriend[] = await Promise.all(
    members.map(async (member) => {
      const meta = await getFriendConversationMeta(userId, member.id);
      return {
        memberId: member.id,
        userId: member.userId,
        userName: member.user.name,
        imageUrl: member.user.imageUrl,
        status: member.user.status,
        statusText: member.user.statusText,
        sharedServerName: member.server.name,
        conversationId: meta?.conversationId ?? null,
        lastMessageAt: meta?.lastMessageAt ?? null,
        lastMessagePreview: meta?.lastMessagePreview ?? null,
      };
    })
  );

  return items.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.userName.localeCompare(b.userName);
  });
}
