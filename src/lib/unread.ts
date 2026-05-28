import { ChannelType, NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { getDmFriends } from "@/lib/dm-friends";

export type UnreadBadge = {
  unread: boolean;
  mention: boolean;
};

const MENTION_TYPES: NotificationType[] = [
  "MENTION",
  "ROLE_MENTION",
  "EVERYONE_MENTION",
  "HERE_MENTION",
];

export async function getChannelUnreadMap(
  userId: string,
  serverId: string
): Promise<Record<string, UnreadBadge>> {
  const member = await db.member.findFirst({
    where: { userId, serverId },
    select: { id: true },
  });
  if (!member) return {};

  const channels = await db.channel.findMany({
    where: { serverId, type: ChannelType.TEXT },
    select: { id: true },
  });
  const channelIds = channels.map((c) => c.id);
  if (!channelIds.length) return {};

  const readStates = await db.channelReadState.findMany({
    where: { userId, channelId: { in: channelIds } },
    select: { channelId: true, lastReadAt: true },
  });
  const readMap = new Map(readStates.map((r) => [r.channelId, r.lastReadAt]));

  const mentionRows = await db.notification.findMany({
    where: {
      userId,
      read: false,
      type: { in: MENTION_TYPES },
      message: { channelId: { in: channelIds } },
    },
    select: { message: { select: { channelId: true } } },
  });
  const mentionChannels = new Set(
    mentionRows
      .map((n) => n.message?.channelId)
      .filter((id): id is string => !!id)
  );

  const result: Record<string, UnreadBadge> = {};

  await Promise.all(
    channelIds.map(async (channelId) => {
      const lastRead = readMap.get(channelId) ?? new Date(0);
      const hasUnread =
        (await db.message.count({
          where: {
            channelId,
            deleted: false,
            createdAt: { gt: lastRead },
            member: { userId: { not: userId } },
          },
          take: 1,
        })) > 0;

      result[channelId] = {
        unread: hasUnread,
        mention: mentionChannels.has(channelId),
      };
    })
  );

  return result;
}

export async function getDmUnreadMap(
  userId: string,
  userName: string
): Promise<Record<string, UnreadBadge & { conversationId: string }>> {
  const friends = await getDmFriends(userId);
  const result: Record<string, UnreadBadge & { conversationId: string }> = {};

  await Promise.all(
    friends.map(async (friend) => {
      const otherMember = await db.member.findUnique({
        where: { id: friend.memberId },
        select: { serverId: true },
      });
      if (!otherMember) return;

      const myMember = await db.member.findFirst({
        where: { userId, serverId: otherMember.serverId },
        select: { id: true },
      });
      if (!myMember) return;

      const conversation = await db.conversation.findFirst({
        where: {
          OR: [
            { memberOneId: myMember.id, memberTwoId: friend.memberId },
            { memberOneId: friend.memberId, memberTwoId: myMember.id },
          ],
        },
        select: { id: true },
      });
      if (!conversation) return;

      const readState = await db.conversationReadState.findUnique({
        where: {
          userId_conversationId: { userId, conversationId: conversation.id },
        },
        select: { lastReadAt: true },
      });
      const lastRead = readState?.lastReadAt ?? new Date(0);

      const unreadMessages = await db.directMessage.findMany({
        where: {
          conversationId: conversation.id,
          userId: { not: userId },
          deleted: false,
          createdAt: { gt: lastRead },
        },
        select: { content: true },
        take: 20,
      });

      const hasUnread = unreadMessages.length > 0;
      const mentionPattern = new RegExp(
        `@${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      const hasMention = unreadMessages.some((m) => mentionPattern.test(m.content));

      result[friend.memberId] = {
        unread: hasUnread,
        mention: hasMention,
        conversationId: conversation.id,
      };
    })
  );

  return result;
}

export async function markChannelRead(userId: string, channelId: string) {
  await db.channelReadState.upsert({
    where: { userId_channelId: { userId, channelId } },
    create: { userId, channelId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  await db.notification.updateMany({
    where: {
      userId,
      read: false,
      type: { in: MENTION_TYPES },
      message: { channelId },
    },
    data: { read: true },
  });
}

export async function markConversationRead(userId: string, conversationId: string) {
  await db.conversationReadState.upsert({
    where: { userId_conversationId: { userId, conversationId } },
    create: { userId, conversationId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
}
